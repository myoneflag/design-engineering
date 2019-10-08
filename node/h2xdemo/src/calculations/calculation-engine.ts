import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import {ObjectStore, SelectionTarget} from '@/htmlcanvas/lib/types';
import {EntityType} from '@/store/document/entities/types';
import PipeEntity, {fillPipeDefaultFields, makePipeFields} from '@/store/document/entities/pipe-entity';
import ValveEntity, {makeValveFields} from '@/store/document/entities/valve-entity';
import FlowSourceEntity, {makeFlowSourceFields} from '@/store/document/entities/flow-source-entity';
import TmvEntity, {makeTMVFields} from '@/store/document/entities/tmv/tmv-entity';
import FixtureEntity, {fillFixtureFields, makeFixtureFields} from '@/store/document/entities/fixtures/fixture-entity';
import {
    DeadlegAttribute,
    ThreeConnectionAttribute,
    TwoConnectionAttribute,
} from '@/store/document/calculations/valve-calculation';
import PopupEntity, {MessageType} from '@/store/document/entities/calculations/popup-entity';
import {DemandType} from '@/calculations/types';
import Graph from '@/calculations/graph';
import {isConnectable} from '@/store/document';
import EquationEngine from '@/calculations/equation-engine';
import {Catalog, PipeSpec} from '@/store/catalog/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {isCalculated} from '@/store/document/calculations';
import UnionFind from '@/calculations/union-find';
import {assertUnreachable} from '@/lib/utils';
import uuid from 'uuid';
import {emptyPipeCalculation} from '@/store/document/calculations/pipe-calculation';
import {interpolateTable, lowerBoundTable, parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';
import Popup from '@/htmlcanvas/objects/popup';
import Pipe from '@/htmlcanvas/objects/pipe';
import {getDarcyWeisbachMH, getFrictionFactor, getReynoldsNumber} from '@/calculations/pressure-drops';
import FlowSolver from '@/calculations/flow-solver';
import {PropertyField} from '@/store/document/entities/property-field';
import {MainEventBus} from '@/store/main-event-bus';
import Vue from 'vue';

const AS_PSD = 'as35002018LoadingUnits';

export default class CalculationEngine {

    objectStore!: ObjectStore;
    doc!: DocumentState;
    demandType!: DemandType;
    flowGraph!: Graph<string, string>;
    luFlowGraph!: Graph<string, string>;
    equationEngine!: EquationEngine;
    catalog!: Catalog;
    centerWc!: Coord;
    extraWarnings!: PopupEntity[];
    extraErrors!: PopupEntity[];

    calculate(
        objectStore: ObjectStore,
        doc: DocumentState,
        centerWc: Coord,
        catalog: Catalog,
        demandType: DemandType,
        done: (entity: PopupEntity[]) => void,
    ) {
        this.objectStore = objectStore;
        this.doc = doc;
        this.catalog = catalog;
        this.demandType = demandType;
        this.centerWc = centerWc;
        this.extraWarnings = [];
        this.extraErrors = [];

        const success = this.preValidate();

        if (!success) {
            return;
        }

        setTimeout(() => {
            // let's do some random calculations for now.
            done(this.doRealCalculation());
        },
            500);
        this.equationEngine = new EquationEngine();
    }

    clearCalculations() {
        this.objectStore.forEach((v) => {
            if (isCalculated(v.entity)) {
                (v.entity as any).calculation = null;
            }
        });
    }

    preValidate(): boolean {
        let selectObject: SelectionTarget | null = null;

        this.objectStore.forEach((obj) => {
            let fields: PropertyField[] = [];
            switch (obj.entity.type) {
                case EntityType.FLOW_SOURCE:
                    fields = makeFlowSourceFields([], []);
                    break;
                case EntityType.PIPE:
                    fields = makePipeFields([], []);
                    break;
                case EntityType.VALVE:
                    fields = makeValveFields([], []);
                    break;
                case EntityType.TMV:
                    fields = makeTMVFields();
                    break;
                case EntityType.FIXTURE:
                    fields = makeFixtureFields();
                    break;
                case EntityType.SYSTEM_NODE:
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.RESULTS_MESSAGE:
                    break;
            }

            fields.forEach((field) => {
                if (!selectObject) {
                    if (field.requiresInput &&
                        ((obj.entity as any)[field.property] === null ||
                            (obj.entity as any)[field.property] === '')
                    ) {
                        selectObject = {
                            uid: obj.uid,
                            property: field.property,
                            message: 'Please enter a value for ' + field.property,
                            variant: 'danger',
                            title: 'Missing required value',
                            recenter: true,
                        };
                    }
                }
            });
        });

        if (selectObject) {
            MainEventBus.$emit('select', selectObject);
            return false;
        }
        return true;
    }

    doRealCalculation(): PopupEntity[] {
        this.clearCalculations();
        this.generateFlowGraph();
        this.generateLUFlowGraph();

        const sanityCheckWarnings = this.sanityCheck(this.objectStore, this.doc);

        if (sanityCheckWarnings.length === 0) {
            // The remaining graph must be a rooted forest.
            const {sources, biconnected} = this.analyseGraph();
            this.sizeDefinitePipes(sources.flat());
            this.sizeRingsAndRoots(sources.flat());
        }

        if (!this.equationEngine.isComplete()) {
            throw new Error('Calculations could not complete \n');
        }


        return [];
    }

    generateFlowGraph() {
        this.flowGraph = new Graph<string, string>();
        this.objectStore.forEach((obj) => {
            if (obj.entity.type === EntityType.PIPE) {
                const entity = obj.entity as PipeEntity;
                this.flowGraph.addEdge(entity.endpointUid[0], entity.endpointUid[1], entity.uid, entity.uid);
            } else if (obj.entity.type === EntityType.TMV) {
                const entity = obj.entity as TmvEntity;
                this.flowGraph.addDirectedEdge(entity.hotRoughInUid, entity.outputUid, entity.uid);
                this.flowGraph.addDirectedEdge(entity.coldRoughInUid, entity.outputUid, entity.uid);
            } else if (isConnectable(obj.entity.type)) {
                this.flowGraph.addNode(obj.uid);
            }
        });
    }

    // Just like a flow graph, but only connects when loading units are transferred.
    generateLUFlowGraph() {
        this.luFlowGraph = new Graph<string, string>();
        this.objectStore.forEach((obj) => {
            if (obj.entity.type === EntityType.PIPE) {
                const entity = obj.entity as PipeEntity;
                this.luFlowGraph.addEdge(entity.endpointUid[0], entity.endpointUid[1], entity.uid, entity.uid);
            } else if (obj.entity.type === EntityType.TMV) {
                const entity = obj.entity as TmvEntity;
                this.luFlowGraph.addDirectedEdge(entity.hotRoughInUid, entity.outputUid, entity.uid, entity.uid);
            } else if (isConnectable(obj.entity.type)) {
                this.luFlowGraph.addNode(obj.uid);
            }
        });
    }


    sizeRingsAndRoots(sources: string[]) {

        // For each connected component, find the total LUs, thus the flow rates, then distribute
        // the flow rate equally to each fixture. From these flow rates, we can then calculate the
        // flow network, and iteratively re-size the pipes.
        const leaf2lu = new Map<string, number>();
        const flowConnectedUF = new UnionFind<string>();
        sources.forEach((s) => {
            this.luFlowGraph.dfs(s, (n) => {
               const lu = this.getTerminalLoadingUnits(this.objectStore.get(n)!.entity);
               leaf2lu.set(n, lu);
               flowConnectedUF.join(s, n);
            });
        });

        const demandLS = new Map<string, number>();
        const sourcesKPA = new Map<string, number>();

        sources.forEach((suid) => {
            const source = this.objectStore.get(suid)!;
            if (source.entity.type === EntityType.FLOW_SOURCE) {
                sourcesKPA.set(suid, source.entity.pressureKPA!);
            } else {
                throw new Error('Flow coming in from an entity that isn\'t a source');
            }
        });

        const flowComponents = flowConnectedUF.groups();
        flowComponents.forEach((group) => {
            let totalLU = 0;
            group.forEach((n) => {
                if (leaf2lu.has(n)) {
                    totalLU += leaf2lu.get(n)!;
                }
            });

            if (totalLU) {
                const recommendedFlowRate = this.lookupFlowRate(totalLU);
                if (recommendedFlowRate === null) {
                    throw new Error('Could not get flow rate from loading units');
                }

                const perUnit = recommendedFlowRate / totalLU;

                group.forEach((n) => {
                    if (leaf2lu.has(n) && leaf2lu.get(n)! > 0) {
                        demandLS.set(n, perUnit * leaf2lu.get(n)!);
                    }
                });
            }
        });

        // Now we can iteratively sizing of pipes.
        const pipesThatNeedSizing = new Set<string>();
        this.luFlowGraph.edgeList.forEach((e) => {
            const pipeObj = this.objectStore.get(e.value)!;
            if (pipeObj instanceof Pipe) {
                if (pipeObj.entity.calculation === null) {
                    const filled = fillPipeDefaultFields(this.doc, pipeObj.computedLengthM, pipeObj.entity);
                    const initialSize = lowerBoundTable(this.catalog.pipes[filled.material!].pipesBySize, 0)!;
                    pipeObj.entity.calculation = {
                        flowRateLS: null,
                        loadingUnits: null,
                        optimalInnerPipeDiameterMM: null,
                        pressureDropKpa: null,
                        realInternalDiameterMM: parseCatalogNumberExact(initialSize.diameterInternalMM),
                        realNominalPipeDiameterMM: parseCatalogNumberExact(initialSize.diameterNominalMM),
                        temperatureRange: null,
                        velocityRealMS: null,
                    };
                    pipesThatNeedSizing.add(pipeObj.entity.uid);
                } else if (pipeObj.entity.calculation.realInternalDiameterMM === null) {
                    const filled = fillPipeDefaultFields(this.doc, pipeObj.computedLengthM, pipeObj.entity);
                    const initialSize = lowerBoundTable(this.catalog.pipes[filled.material!].pipesBySize, 0)!;

                    pipeObj.entity.calculation.realInternalDiameterMM =
                        parseCatalogNumberExact(initialSize.diameterInternalMM);
                    pipeObj.entity.calculation.realNominalPipeDiameterMM =
                        parseCatalogNumberExact(initialSize.diameterNominalMM);

                    pipesThatNeedSizing.add(pipeObj.entity.uid);
                }
            }
        });

        const solver = new FlowSolver(this.luFlowGraph, this.objectStore, this.doc, this.catalog);

        console.log("demand:");
        console.log(demandLS);
        console.log("sources:");
        console.log(sourcesKPA);

        while (true) {
            const assignment = solver.solveFlowsLS(demandLS, sourcesKPA);
            let changed = false;

            pipesThatNeedSizing.forEach((target) => {
                const flow = assignment.getFlow(target);

                // TODO: Size ring mains properly
                // But for now, just size this main by this flow.
                const pipe = this.objectStore.get(target) as Pipe;
                const oldSize = pipe.entity.calculation!.realInternalDiameterMM;
                this.sizePipeForFlowRate(pipe.entity, flow);
                const newSize = pipe.entity.calculation!.realInternalDiameterMM;

                if (oldSize !== newSize) {
                    changed = true;
                }
            });

            console.log("Changed: " + changed);

            if (!changed) {
                // Pipe sizes have converged.
                break;
            }
        }
    }

    // Checks basic validity stuff, like hot water/cold water shouldn't mix, all fixtures have
    // required water sources filled in, etc.
    sanityCheck(objectStore: ObjectStore, doc: DocumentState): PopupEntity[] {
        return [];
    }

    setLoadingUnits(object: BaseBackedObject, value: number) {
        if (isCalculated(object.entity)) {
            const calculation = (object.entity as any).calculation;
            if ('loadingUnits' in calculation) {
                calculation.loadingUnits = value;
            } else {
                throw new Error('loadingUnits not a property of calculation ' + JSON.stringify(object.entity));
            }
        } else {
            throw new Error('object not calculatable' + JSON.stringify(object.entity));
        }
    }

    getTerminalLoadingUnits(node: DrawableEntity): number {
        if (node.type === EntityType.SYSTEM_NODE) {
            if (node.parentUid === null) {
                throw new Error('System node doesn\'t have parent. ' + JSON.stringify(node));
            }
            const parent = this.objectStore.get(node.parentUid);
            if (parent === undefined) {
                throw new Error('System node is missing parent. ' + JSON.stringify(node));
            }
            switch (parent.type) {
                case EntityType.FIXTURE:
                    const fixture = parent.entity as FixtureEntity;
                    const mainFixture = fillFixtureFields(this.doc, this.catalog, fixture);
                    if (node.uid === fixture.coldRoughInUid) {
                        return Number(mainFixture.loadingUnitsCold!);
                    } else if (node.uid === fixture.warmRoughInUid) {
                        return Number(mainFixture.loadingUnitsHot!);
                    } else {
                        throw new Error('Invalid connection to fixture ' +
                            JSON.stringify(node) + '\n' + JSON.stringify(fixture),
                        );
                    }
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FLOW_SOURCE:
                case EntityType.FLOW_RETURN:
                case EntityType.PIPE:
                case EntityType.VALVE:
                case EntityType.TMV:
                case EntityType.SYSTEM_NODE:
                case EntityType.RESULTS_MESSAGE:
                    return 0;
            }
            assertUnreachable(parent.type);
            // Sadly, typescript type checking for return value was not smart enough to avoid these two lines.
            throw new Error('parent type is not a correct value');
        } else {
            return 0;
        }
    }

    configurePipeForLoadingUnits(pipe: PipeEntity, lu: number) {
        pipe.calculation = emptyPipeCalculation();
        pipe.calculation.loadingUnits = lu;

        const size = this.lookupFlowRate(lu);

        if (size === null) {
            // out of range
            this.extraWarnings.push({
                center: Popup.findCenter(this.objectStore.get(pipe.uid)!, this.centerWc),
                params: {
                    type: MessageType.WARNING,
                    text: 'Could not get flow rate for this pipe using the current PSD standard',
                },
                parentUid: null,
                targetUids: [pipe.uid],
                type: EntityType.RESULTS_MESSAGE,
                uid: uuid(),
            });
        } else {
            this.sizePipeForFlowRate(pipe, size);
        }

    }

    sizePipeForFlowRate(pipe: PipeEntity, flowRateLS: number) {
        pipe.calculation!.flowRateLS = flowRateLS;

        pipe.calculation!.optimalInnerPipeDiameterMM = this.calculateInnerDiameter(pipe);
        const page = this.getRealPipe(pipe);
        pipe.calculation!.realNominalPipeDiameterMM = parseCatalogNumberExact(page!.diameterNominalMM);
        pipe.calculation!.realInternalDiameterMM = parseCatalogNumberExact(page!.diameterInternalMM);

        if (pipe.calculation!.realNominalPipeDiameterMM) {
            pipe.calculation!.velocityRealMS = this.getVelocityRealMs(pipe);
            pipe.calculation!.pressureDropKpa = this.getPressureDrop(pipe);
        }
    }

    lookupFlowRate(lu: number): number | null {
        const psd = this.doc.drawing.calculationParams.psdMethod;
        const table = this.catalog.psdStandards[psd].table;
        if (psd === AS_PSD) {
            return interpolateTable(table, lu, true);
        } else {
            throw new Error('PSD not supported');
        }
    }

    calculateInnerDiameter(pipe: PipeEntity): number {
        const computed = fillPipeDefaultFields(this.doc, 0, pipe);

        // depends on pipe sizing method
        if (this.doc.drawing.calculationParams.pipeSizingMethod === 'velocity') {
            // http://www.1728.org/flowrate.htm
            return Math.sqrt(
                4000 * pipe.calculation!.flowRateLS! / (Math.PI * computed.maximumVelocityMS!),
            );
        } else {
            throw new Error('Pipe sizing strategy not supported');
        }
    }

    getPressureDrop(pipe: PipeEntity): number {
        const obj = this.objectStore.get(pipe.uid) as Pipe;
        const filled = fillPipeDefaultFields(this.doc, obj.computedLengthM, pipe);
        const realPipe = lowerBoundTable(
            this.catalog.pipes[filled.material!].pipesBySize,
            filled.diameterMM!,
        )!;
        const roughness = parseCatalogNumberExact(realPipe.colebrookWhiteCoefficient);
        const realInternalDiameter = parseCatalogNumberExact(realPipe.diameterInternalMM);

        const system = this.doc.drawing.flowSystems.find((s) => s.uid === pipe.systemUid)!;

        const fluidDensity =  parseCatalogNumberExact(this.catalog.fluids[system.fluid].densityKGM3);
        const dynamicViscosity = parseCatalogNumberExact(interpolateTable(
            this.catalog.fluids[system.fluid].dynamicViscosityByTemperature,
            system.temperature, // TOOD: Use pipe's temperature
        ));

        return getDarcyWeisbachMH(
            getFrictionFactor(
                realInternalDiameter!,
                roughness!,
                getReynoldsNumber(
                    fluidDensity!,
                    pipe.calculation!.velocityRealMS!,
                    realInternalDiameter!,
                    dynamicViscosity!,
                ),
            ),
            filled.lengthM!,
            realInternalDiameter!,
            pipe.calculation!.velocityRealMS!,
        );
    }

    getVelocityRealMs(pipe: PipeEntity) {
        // http://www.1728.org/flowrate.htm

        return 4000 * pipe.calculation!.flowRateLS! /
            (Math.PI * parseCatalogNumberExact(pipe.calculation!.realInternalDiameterMM)! ** 2);
    }

    getRealPipe(pipe: PipeEntity): PipeSpec | null {
        const pipeFilled = fillPipeDefaultFields(this.doc, 0, pipe);


        const table = this.catalog.pipes[pipeFilled.material!];

        if (!table) {
            throw new Error('Material doesn\'t exist anymore ' + JSON.stringify(pipeFilled));
        }

        const a = lowerBoundTable(table.pipesBySize, pipeFilled.calculation!.optimalInnerPipeDiameterMM!, (p) => {
            const v = parseCatalogNumberExact(p.diameterNominalMM);
            if (!v) {
                throw new Error('no nominal diameter');
            }
            return v;
        });

        if (!a) {
            // No pipe big enough
            this.extraWarnings.push({
                center: Popup.findCenter(this.objectStore.get(pipe.uid)!, this.centerWc),
                params: {
                    type: MessageType.WARNING,
                    text: 'No pipe with this material in the database is big enough to handle the required demand',
                },
                parentUid: null,
                targetUids: [pipe.uid],
                type: EntityType.RESULTS_MESSAGE,
                uid: uuid(),
            });
            return null;
        } else {
            return a;
        }
    }

    sizeDefinitePipes(roots: string[]) {
        const totalReachedLUs = this.getTotalReachedLUs(roots);

        // Go through all pipes
        this.objectStore.forEach((object) => {
            if (object.type !== EntityType.PIPE) {
                return;
            }
            const pipe = object.entity as PipeEntity;

            const reachedLUs = this.getTotalReachedLUs(roots, [], [pipe.uid]);
            const exclusiveLUs = totalReachedLUs - reachedLUs;


            if (exclusiveLUs > 0) {
                const [point] = this.getDryEndpoints(pipe, roots);
                const [wet] = this.getWetEndpoints(pipe, roots);
                const residualLUs = this.getTotalReachedLUs([point], [wet], [pipe.uid]);

                if (residualLUs > exclusiveLUs) {
                    // the LU for this pipe is ambiguous in this configuration.
                    this.extraWarnings.push({
                        center: Popup.findCenter(object, this.centerWc),
                        params: {
                            type: MessageType.WARNING,
                            text: 'Loading units for this pipe are ambiguous (but it is at least ' + exclusiveLUs + ')',
                        },
                        parentUid: null,
                        targetUids: [object.uid],
                        type: EntityType.RESULTS_MESSAGE,
                        uid: uuid(),
                    });
                } else {
                    // we have successfully calculated the pipe's loading units.
                    this.configurePipeForLoadingUnits(pipe, exclusiveLUs);
                }
            } else {
                // zero exclusive to us. Work out whether this is because we don't have any fixture demand.
                const wets = this.getWetEndpoints(pipe, roots);
                const demandA = this.getTotalReachedLUs([pipe.endpointUid[0]], [], [pipe.uid]);
                const demandB = this.getTotalReachedLUs([pipe.endpointUid[1]], [], [pipe.uid]);

                if (demandA === 0 && wets.indexOf(pipe.endpointUid[0]) === -1 ||
                    demandB === 0 && wets.indexOf(pipe.endpointUid[1]) === -1
                ) {
                    // redundant deadleg
                    this.extraWarnings.push({
                        center: Popup.findCenter(object, this.centerWc),
                        params: {
                            type: MessageType.WARNING,
                            text: 'Redundant deadleg',
                        },
                        parentUid: null,
                        targetUids: [object.uid],
                        type: EntityType.RESULTS_MESSAGE,
                        uid: uuid(),
                    });
                } else {
                    // ambiguous
                    this.extraWarnings.push({
                        center: Popup.findCenter(object, this.centerWc),
                        params: {
                            type: MessageType.WARNING,
                            text: 'Loading units for this pipe are ambiguous',
                        },
                        parentUid: null,
                        targetUids: [object.uid],
                        type: EntityType.RESULTS_MESSAGE,
                        uid: uuid(),
                    });
                }
            }

        });
    }

    getTotalReachedLUs(roots: string[], excludedNodes: string[] = [], excludedEdges: string[] = []): number {
        const seen = new Set<string>(excludedNodes);
        const seenEdges = new Set<string>(excludedEdges);

        let lu = 0;

        roots.forEach((r) => {
            this.luFlowGraph.dfs(r, (n) => {
                    lu += this.getTerminalLoadingUnits(this.objectStore.get(n)!.entity);
                    return false;
                },
                undefined,
                undefined,
                undefined,
                seen,
                seenEdges,
            );
        });

        return lu;
    }

    getWetEndpoints(pipe: PipeEntity, roots: string[]): string[] {
        const seen = new Set<string>();
        const seenEdges = new Set<string>([pipe.uid]);

        roots.forEach((r) => {
            this.luFlowGraph.dfs(r, undefined, undefined, undefined, undefined, seen, seenEdges);
        });

        return pipe.endpointUid.filter((ep) => {
            // to be dry, we have to not have any sources.
            return seen.has(ep);
        });
    }

    getDryEndpoints(pipe: PipeEntity, roots: string[]): string[] {
        const wet = this.getWetEndpoints(pipe, roots);
        return pipe.endpointUid.filter((ep) => {
            return wet.indexOf(ep) === -1;
        });
    }

    analyseGraph(): {sources: string[][], biconnected: string[][]} {
        const seen = new Set();
        const uf = new UnionFind<string>();

        this.objectStore.forEach((o) => {
            if (o.type === EntityType.FLOW_SOURCE) {
                const e = o.entity as FlowSourceEntity;

                this.flowGraph.reachable(e.uid)[0].forEach((ouid) => {
                    if (this.objectStore.get(ouid)!.type === EntityType.FLOW_SOURCE) {
                        uf.join(ouid, e.uid);
                    }
                });
            }
        });

        const roots = uf.groups();

        return {sources: roots, biconnected: []};
    }

    randomizeEntityCalculations(e: DrawableEntity) {
        if (e.type === EntityType.PIPE) {
            const te = e as PipeEntity;
            te.calculation = {
                flowRateLS: randInt(0, 10),
                optimalInnerPipeDiameterMM: randInt(0, 10),
                pressureDropKpa: randInt(0, 10),
                realNominalPipeDiameterMM: randInt(0, 10),
                realInternalDiameterMM: randInt(0, 10),
                velocityRealMS: randInt(0, 10),
                temperatureRange: randInt(0, 10) + ' to ' + randInt(0, 10),
                loadingUnits: randInt(0, 10),
            };
        } else if (e.type === EntityType.VALVE) {
            const te = e as ValveEntity;

            te.calculation = {
                flowRateLS: randInt(0, 10),
                pressureKPA: randInt(0, 10),
                pressureDropKPA: randInt(0, 10),
                valveAttributes: getValveAttributes(te),
            };
        } else if (e.type === EntityType.FLOW_SOURCE) {
            const te = e as FlowSourceEntity;
            te.calculation = {
                flowRateLS: randInt(0, 10),
                pressureKPA: randInt(0, 10),
                loadingUnits: randInt(0, 10),
            };
        } else if (e.type === EntityType.TMV) {
            const te = e as TmvEntity;
            te.calculation = {
                coldPressureKPA: randInt(0, 10),
                coldTemperatureC: randInt(0, 10),
                hotPressureKPA: randInt(0, 10),
                hotTemperatureC: randInt(0, 10),
                outputFlowRateLS: randInt(0, 10),
                outputPressureKPA: randInt(0, 10),
                outputTemperatureC: randInt(0, 10),
            };
        } else if (e.type === EntityType.FIXTURE) {
            const te = e as FixtureEntity;
            te.calculation = {
                coldPressureKPA: randInt(0, 10),
                warmPressureKPA: randInt(0, 10),
            };
        }
    }
}

function randInt(minInclusive: number, maxExclusive: number) {
    return Math.floor(Math.random() * (maxExclusive - minInclusive)) + minInclusive;
}


function getValveAttributes(e: ValveEntity): DeadlegAttribute | TwoConnectionAttribute | ThreeConnectionAttribute {
    if (e.connections.length === 1) {
        return { numConnections: 1 };
    } else if (e.connections.length === 2) {
        return {
            numConnections: 2,
            angle: randInt(0, 100),
            nominalDiameterAMM: randInt(0, 100),
            nominalDiameterBMM: randInt(0, 100),
        };
    } else if (e.connections.length === 3) {
        return {
            numConnections: 3,
            nominalDiameterMM: randInt(0, 100),
        };
    } else {
        throw new Error('I don\'t know how to deal with this yet, valve with ' + e.connections.length + ' connections');
    }
}

enum EquationValues {
    LoadingUnits = '.loadingUnits',
}
