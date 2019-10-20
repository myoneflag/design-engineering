import {Coord, DocumentState, DrawableEntity, DrawingState} from '@/store/document/types';
import {ObjectStore, SelectionTarget} from '@/htmlcanvas/lib/types';
import {EntityType} from '@/store/document/entities/types';
import PipeEntity, {fillPipeDefaultFields, makePipeFields} from '@/store/document/entities/pipe-entity';
import ValveEntity, {makeValveFields} from '@/store/document/entities/valve-entity';
import FlowSourceEntity, {makeFlowSourceFields} from '@/store/document/entities/flow-source-entity';
import TmvEntity, {makeTMVFields, SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
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
import {interpolateTable, lowerBoundTable, parseCatalogNumberExact, upperBoundTable} from '@/htmlcanvas/lib/utils';
import Popup from '@/htmlcanvas/objects/popup';
import Pipe from '@/htmlcanvas/objects/pipe';
import {
    getDarcyWeisbachMH,
    getFluidDensityOfSystem,
    getFrictionFactor,
    getReynoldsNumber,
    head2kpa,
} from '@/calculations/pressure-drops';
import FlowSolver from '@/calculations/flow-solver';
import {PropertyField} from '@/store/document/entities/property-field';
import {MainEventBus} from '@/store/main-event-bus';
import {emptyFixtureCalculation} from '@/store/document/calculations/fixture-calculation';
import {getObjectFrictionHeadLoss} from '@/calculations/entity-pressure-drops';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {emptyTmvCalculation} from '@/store/document/calculations/tmv-calculation';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import {PsdStandard, PSDStandardType} from '@/store/catalog/psd-standard/types';
import assert from 'assert';
import {isGermanStandard} from '@/config';

const HOT_WARM_EDGE_ID = ':hot-warm';
const COLD_COLD_EDGE_ID = ':cold-cold';
const COLD_WARM_EDGE_ID = ':cold-warm';

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
    drawing!: DrawingState;

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
        this.drawing = this.doc.drawing;

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
            const {sources} = this.analyseGraph();
            this.sizeDefiniteTransports(sources.flat());
            this.sizeRingsAndRoots(sources.flat());
            this.calculateAllFixturesAbsolutePressure(sources.flat());
        }

        if (!this.equationEngine.isComplete()) {
            throw new Error('Calculations could not complete \n');
        }

        return [];
    }

    calculateAllFixturesAbsolutePressure(sources: string[]) {
        this.objectStore.forEach((obj): null => {
            const entity = obj.entity;
            switch (entity.type) {
                case EntityType.FIXTURE:

                    if (!entity.calculation) {
                        entity.calculation = emptyFixtureCalculation();
                    }

                    entity.calculation.coldPressureKPA =
                        this.getAbsolutePressureFixture(entity.coldRoughInUid, sources);
                    if (entity.warmRoughInUid) {
                        entity.calculation.warmPressureKPA =
                            this.getAbsolutePressureFixture(entity.warmRoughInUid, sources);
                    }
                    return null;
                case EntityType.TMV:
                    if (entity.calculation) {
                        entity.calculation.coldPressureKPA =
                            this.getAbsolutePressureFixture(entity.coldRoughInUid, sources);
                        entity.calculation.hotPressureKPA =
                            this.getAbsolutePressureFixture(entity.hotRoughInUid, sources);
                    }
                    return null;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.VALVE:
                case EntityType.PIPE:
                case EntityType.FLOW_SOURCE:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.SYSTEM_NODE:
                    return null;
            }
        });
    }

    getAbsolutePressureFixture(uid: string, sources: string[]) {
        if (this.demandType === DemandType.PSD) {
            return this.getPeakDemandKPAWithShortestPath(uid, sources);
        } else {
            const obj = this.objectStore.get(uid)!;
            let height: number;
            switch (obj.entity.type) {
                case EntityType.SYSTEM_NODE:
                    if (obj.entity.parentUid) {
                        const par = this.objectStore.get(obj.entity.parentUid)!;
                        switch (par.entity.type) {
                            case EntityType.PIPE:
                                height = par.entity.heightAboveFloorM;
                                break;
                            case EntityType.TMV:
                                height = par.entity.heightAboveFloorM;
                                break;
                            case EntityType.FIXTURE:
                                const filled = fillFixtureFields(this.doc, this.catalog, par.entity);
                                height = filled.outletAboveFloorM!;
                                break;
                            case EntityType.VALVE:
                            case EntityType.BACKGROUND_IMAGE:
                            case EntityType.FLOW_SOURCE:
                            case EntityType.RESULTS_MESSAGE:
                            case EntityType.SYSTEM_NODE:
                                throw new Error('don\'t know how to calculate static pressure for this');
                        }
                    } else {
                        throw new Error('don\'t know how to calculate static pressure for an orphaned node');
                    }
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FLOW_SOURCE:
                case EntityType.PIPE:
                case EntityType.VALVE:
                case EntityType.TMV:
                case EntityType.FIXTURE:
                case EntityType.RESULTS_MESSAGE:
                    throw new Error('don\'t know how to calculate static pressure for that');
            }
            return this.getStaticPressure(uid, sources, height!);
        }
    }

    getStaticPressure(uid: string, sources: string[], heightM: number): number {
        let highPressure: number | null = null;
        this.luFlowGraph.dfs(
            uid,
            (n) => {
                if (sources.indexOf(n) !== -1) {
                    const source = this.objectStore.get(n) as FlowSource;
                    const density = getFluidDensityOfSystem(source.entity.systemUid, this.doc, this.catalog)!;
                    const mh = source.entity.heightAboveFloorM - heightM;
                    const thisPressure = Number(source.entity.pressureKPA!) + head2kpa(mh, density);
                    if (highPressure === null || thisPressure > highPressure) {
                        highPressure = thisPressure;
                    }
                }
            },
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            true,
        );
        return highPressure == null ? -1 : highPressure;
    }

    /**
     * In a peak flow graph, flow paths don't represent a valid network flow state, and sometimes, don't
     * even have a direction for each pipe.
     * One strategy to get a sane pressure drop to a point is to find the smallest pressure drop from it to
     * any source along the least pressure drop path.
     */
    getPeakDemandKPAWithShortestPath(uid: string, sources: string[]): number | null {
        const rPath = this.luFlowGraph.shortestPath(
            uid,
            sources,
            (edge) => {
                const obj = this.objectStore.get(edge.value)!;
                switch (obj.entity.type) {
                    case EntityType.TMV:
                        if (!obj.entity.calculation) {
                            return Infinity;
                        }

                        // Remember, this path is reversed
                        const flowFrom = edge.to;
                        const flowTo = edge.from;

                        let systemUid: string = '';

                        let fr: number | null = null;
                        if (edge.uid.endsWith(COLD_COLD_EDGE_ID) && flowFrom === obj.entity.coldRoughInUid) {

                            fr = obj.entity.calculation.coldPeakFlowRate;
                            systemUid = (this.objectStore.get(obj.entity.coldRoughInUid)!
                                .entity as SystemNodeEntity).systemUid;
                        } else if (edge.uid.endsWith(HOT_WARM_EDGE_ID) && flowFrom === obj.entity.hotRoughInUid) {
                            fr = obj.entity.calculation.hotPeakFlowRate;
                            systemUid = (this.objectStore.get(obj.entity.hotRoughInUid)!
                                .entity as SystemNodeEntity).systemUid;
                        } else {
                            throw new Error('Misused TMV');
                        }

                        if (fr === null) {
                            return Infinity;
                        }

                        return head2kpa(
                            getObjectFrictionHeadLoss(
                                this,
                                obj,
                                fr,
                                flowFrom,
                                flowTo,
                            ),
                            getFluidDensityOfSystem(systemUid, this.doc, this.catalog)!,
                        );
                    case EntityType.PIPE:
                        if (!obj.entity.calculation || obj.entity.calculation.pressureDropKpa === null) {
                            return Infinity;
                        }
                        return obj.entity.calculation.pressureDropKpa;
                    case EntityType.FLOW_SOURCE:
                    case EntityType.SYSTEM_NODE:
                    case EntityType.FIXTURE:
                    case EntityType.VALVE:
                        return 0;
                    case EntityType.RESULTS_MESSAGE:
                    case EntityType.BACKGROUND_IMAGE:
                        throw new Error('Invalid entity in network');
                }
            },
            undefined,
            undefined,
            true,
            true,
        );
        if (rPath) {
            const sourceObj = this.objectStore.get(rPath[0][rPath[0].length - 1].to)! as FlowSource;
            return sourceObj.entity.pressureKPA! - rPath[1];
        } else {
            return null;
        }
    }

    generateFlowGraph() {
        this.flowGraph = new Graph<string, string>();
        this.objectStore.forEach((obj) => {
            if (obj.entity.type === EntityType.PIPE) {
                const entity = obj.entity as PipeEntity;
                this.flowGraph.addEdge(entity.endpointUid[0], entity.endpointUid[1], entity.uid, entity.uid);
            } else if (obj.entity.type === EntityType.TMV) {
                const entity = obj.entity as TmvEntity;
                this.flowGraph.addDirectedEdge(
                    entity.hotRoughInUid,
                    entity.warmOutputUid,
                    entity.uid,
                    entity.uid + HOT_WARM_EDGE_ID,
                );
                this.flowGraph.addDirectedEdge(
                    entity.coldRoughInUid,
                    entity.warmOutputUid,
                    entity.uid,
                    entity.uid + COLD_WARM_EDGE_ID,
                );
                if (entity.coldOutputUid) {
                    this.flowGraph.addDirectedEdge(
                        entity.coldRoughInUid,
                        entity.coldOutputUid,
                        entity.uid,
                        entity.uid + COLD_WARM_EDGE_ID,
                    );
                }
                if (entity.coldOutputUid) {
                    this.flowGraph.addDirectedEdge(
                        entity.coldRoughInUid,
                        entity.coldOutputUid,
                        entity.uid,
                        entity.uid + COLD_COLD_EDGE_ID,
                    );
                }
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
                this.luFlowGraph.addDirectedEdge(
                    entity.hotRoughInUid,
                    entity.warmOutputUid,
                    entity.uid,
                    entity.uid + HOT_WARM_EDGE_ID,
                );
                if (entity.coldOutputUid !== null) {
                    this.luFlowGraph.addDirectedEdge(
                        entity.coldRoughInUid,
                        entity.coldOutputUid,
                        entity.uid,
                        entity.uid + COLD_COLD_EDGE_ID,
                    );
                }
            } else if (isConnectable(obj.entity.type)) {
                this.luFlowGraph.addNode(obj.uid);
            }
        });
    }


    sizeRingsAndRoots(sources: string[]) {

        // For each connected component, find the total PsdUs, thus the flow rates, then distribute
        // the flow rate equally to each fixture. From these flow rates, we can then calculate the
        // flow network, and iteratively re-size the pipes.
        const leaf2PsdU = new Map<string, number>();
        const flowConnectedUF = new UnionFind<string>();
        sources.forEach((s) => {
            this.luFlowGraph.dfs(s, (n) => {
               const psdU = this.getTerminalPsdU(this.objectStore.get(n)!.entity);
               leaf2PsdU.set(n, psdU);
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
            let totalPsdU = 0;
            group.forEach((n) => {
                if (leaf2PsdU.has(n)) {
                    totalPsdU += leaf2PsdU.get(n)!;
                }
            });

            if (totalPsdU) {
                const recommendedFlowRate = this.lookupFlowRate(totalPsdU);
                if (recommendedFlowRate === null) {
                    throw new Error('Could not get flow rate from loading units');
                }

                const perUnit = recommendedFlowRate / totalPsdU;

                group.forEach((n) => {
                    if (leaf2PsdU.has(n) && leaf2PsdU.get(n)! > 0) {
                        demandLS.set(n, perUnit * leaf2PsdU.get(n)!);
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
                    const filled = fillPipeDefaultFields(this.doc.drawing, pipeObj.computedLengthM, pipeObj.entity);
                    const initialSize = lowerBoundTable(this.catalog.pipes[filled.material!].pipesBySize, 0)!;
                    pipeObj.entity.calculation = {
                        peakFlowRate: null,
                        psdUnits: null,
                        optimalInnerPipeDiameterMM: null,
                        pressureDropKpa: null,
                        realInternalDiameterMM: parseCatalogNumberExact(initialSize.diameterInternalMM),
                        realNominalPipeDiameterMM: parseCatalogNumberExact(initialSize.diameterNominalMM),
                        temperatureRange: null,
                        velocityRealMS: null,
                    };
                    pipesThatNeedSizing.add(pipeObj.entity.uid);
                } else if (pipeObj.entity.calculation.realInternalDiameterMM === null) {
                    const filled = fillPipeDefaultFields(this.doc.drawing, pipeObj.computedLengthM, pipeObj.entity);
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

        let iters = 0;
        while (true) {
            iters++;
            if (iters > 20) {
                break;
            }
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

    getTerminalPsdU(node: DrawableEntity): number {
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
                        if (isGermanStandard(this.doc.drawing.calculationParams.psdMethod)) {
                            return Number(mainFixture.designFlowRateCold);
                        } else {
                            return Number(mainFixture.loadingUnitsCold!);
                        }
                    } else if (node.uid === fixture.warmRoughInUid) {
                        if (isGermanStandard(this.doc.drawing.calculationParams.psdMethod)) {
                            return Number(mainFixture.designFlowRateHot);
                        } else {
                            return Number(mainFixture.loadingUnitsHot!);
                        }
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

    configureEntityForPSD(entity: DrawableEntityConcrete, psdU: number, edgeUid: string) {
        switch (entity.type) {
            case EntityType.PIPE: {

                entity.calculation = emptyPipeCalculation();
                entity.calculation.psdUnits = psdU;

                const flowRate = this.lookupFlowRate(psdU);

                if (flowRate === null) {
                    // out of range
                    this.extraWarnings.push({
                        center: Popup.findCenter(this.objectStore.get(entity.uid)!, this.centerWc),
                        params: {
                            type: MessageType.WARNING,
                            text: 'Could not get flow rate for this entity using the current PSD standard',
                        },
                        parentUid: null,
                        targetUids: [entity.uid],
                        type: EntityType.RESULTS_MESSAGE,
                        uid: uuid(),
                    });
                } else {
                    this.sizePipeForFlowRate(entity, flowRate);
                }

                return;
            }
            case EntityType.TMV: {

                if (!entity.calculation) {
                    entity.calculation = emptyTmvCalculation();
                }
                const flowRate = this.lookupFlowRate(psdU);

                if (edgeUid.endsWith(COLD_COLD_EDGE_ID)) {
                    entity.calculation.coldPsdUs = psdU;
                    entity.calculation.coldPeakFlowRate = flowRate;
                } else if (edgeUid.endsWith(HOT_WARM_EDGE_ID)) {
                    entity.calculation.hotPsdUs = psdU;
                    entity.calculation.hotPeakFlowRate = flowRate;
                } else {
                    throw new Error('invalid edge in TMV');
                }

                return;
            }
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FLOW_SOURCE:
            case EntityType.VALVE:
            case EntityType.SYSTEM_NODE:
            case EntityType.FIXTURE:
            case EntityType.RESULTS_MESSAGE:
                throw new Error('Cannot configure this entity to accept loading units');
        }
        assertUnreachable(entity);

    }

    sizePipeForFlowRate(pipe: PipeEntity, flowRateLS: number) {
        pipe.calculation!.peakFlowRate = flowRateLS;

        pipe.calculation!.optimalInnerPipeDiameterMM = this.calculateInnerDiameter(pipe);
        let page = this.getRealPipe(pipe);
        if (!page) {
            page = this.getBiggestPipe(pipe);
        }
        pipe.calculation!.realNominalPipeDiameterMM = parseCatalogNumberExact(page!.diameterNominalMM);
        pipe.calculation!.realInternalDiameterMM = parseCatalogNumberExact(page!.diameterInternalMM);

        if (pipe.calculation!.realNominalPipeDiameterMM) {
            pipe.calculation!.velocityRealMS = this.getVelocityRealMs(pipe);

            console.log('pipe mh is ' + this.getPipePressureDropMH(pipe));

            pipe.calculation!.pressureDropKpa = head2kpa(
                this.getPipePressureDropMH(pipe),
                getFluidDensityOfSystem(pipe.systemUid, this.doc, this.catalog)!,
            );
        }
    }

    lookupFlowRate(psdU: number): number | null {
        const psd = this.doc.drawing.calculationParams.psdMethod;
        const standard = this.catalog.psdStandards[psd];
        if (standard.type === PSDStandardType.LU_LOOKUP_TABLE) {
            const table = standard.table;
            return interpolateTable(table, psdU, true);
        } else if (standard.type === PSDStandardType.EQUATION) {
            if (standard.equation !== 'a*(sum(Q,q))^b-c') {
                throw new Error('Only the german equation a*(sum(Q,q))^b-c is currently supported');
            }
            const a = parseCatalogNumberExact(standard.variables.a)!;
            const b = parseCatalogNumberExact(standard.variables.b)!;
            const c = parseCatalogNumberExact(standard.variables.c)!;

            return a * (psdU ** b) - c;
        } else {
            throw new Error('PSD not supported');
        }
    }

    calculateInnerDiameter(pipe: PipeEntity): number {
        const computed = fillPipeDefaultFields(this.doc.drawing, 0, pipe);

        // depends on pipe sizing method
        if (this.doc.drawing.calculationParams.pipeSizingMethod === 'velocity') {
            // http://www.1728.org/flowrate.htm
            return Math.sqrt(
                4000 * pipe.calculation!.peakFlowRate! / (Math.PI * computed.maximumVelocityMS!),
            );
        } else {
            throw new Error('Pipe sizing strategy not supported');
        }
    }

    getPipePressureDropMH(pipe: PipeEntity): number {
        const obj = this.objectStore.get(pipe.uid) as Pipe;
        const filled = fillPipeDefaultFields(this.doc.drawing, obj.computedLengthM, pipe);
        const realPipe = lowerBoundTable(
            this.catalog.pipes[filled.material!].pipesBySize,
            pipe.calculation!.optimalInnerPipeDiameterMM!,
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

        return 4000 * pipe.calculation!.peakFlowRate! /
            (Math.PI * parseCatalogNumberExact(pipe.calculation!.realInternalDiameterMM)! ** 2);
    }

    getRealPipe(pipe: PipeEntity): PipeSpec | null {
        const pipeFilled = fillPipeDefaultFields(this.doc.drawing, 0, pipe);
        const table = this.catalog.pipes[pipeFilled.material!];

        if (!table) {
            throw new Error('Material doesn\'t exist anymore ' + JSON.stringify(pipeFilled));
        }

        const a = lowerBoundTable(table.pipesBySize, pipeFilled.calculation!.optimalInnerPipeDiameterMM!, (p) => {
            const v = parseCatalogNumberExact(p.diameterInternalMM);
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

    getBiggestPipe(pipe: PipeEntity): PipeSpec | null {
        const pipeFilled = fillPipeDefaultFields(this.doc.drawing, 0, pipe);
        const table = this.catalog.pipes[pipeFilled.material!];

        if (!table) {
            throw new Error('Material doesn\'t exist anymore ' + JSON.stringify(pipeFilled));
        }

        const a = upperBoundTable(table.pipesBySize, Infinity, (p) => {
            const v = parseCatalogNumberExact(p.diameterInternalMM);
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

    sizeDefiniteTransports(roots: string[]) {
        const totalReachedPsdU = this.getTotalReachedPsdU(roots);

        // Go through all pipes
        this.objectStore.forEach((object): null => {
            switch (object.entity.type) {
                case EntityType.TMV:
                    this.sizeDefiniteTransport(
                        object,
                        roots,
                        totalReachedPsdU,
                        object.uid + HOT_WARM_EDGE_ID,
                        [object.entity.hotRoughInUid, object.entity.warmOutputUid],
                    );

                    if (object.entity.coldRoughInUid) {
                        this.sizeDefiniteTransport(
                            object,
                            roots,
                            totalReachedPsdU,
                            object.uid + COLD_COLD_EDGE_ID,
                            [object.entity.coldRoughInUid, object.entity.coldOutputUid!],
                        );
                    }
                    return null;
                case EntityType.PIPE:
                    this.sizeDefiniteTransport(object, roots, totalReachedPsdU, object.uid, object.entity.endpointUid);
                    return null;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.VALVE:
                case EntityType.FLOW_SOURCE:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.SYSTEM_NODE:
                case EntityType.FIXTURE:
                    return null;
            }
        });
    }

    sizeDefiniteTransport(
        object: BaseBackedObject,
        roots: string[],
        totalReachedPsdU: number,
        edgeUid: string,
        endpointUids: string[],
    ) {

        const reachedPsdU = this.getTotalReachedPsdU(roots, [], [edgeUid]);
        const exclusivePsdU = totalReachedPsdU - reachedPsdU;


        if (exclusivePsdU > 0) {
            const [point] = this.getDryEndpoints(endpointUids, edgeUid, roots);
            const [wet] = this.getWetEndpoints(endpointUids, edgeUid, roots);
            const residualPsdU = this.getTotalReachedPsdU([point], [wet], [edgeUid]);

            if (residualPsdU > exclusivePsdU) {
                // the PSD Units for this pipe is ambiguous in this configuration.
                this.extraWarnings.push({
                    center: Popup.findCenter(object, this.centerWc),
                    params: {
                        type: MessageType.WARNING,
                        text: 'Loading units for this pipe are ambiguous (but it is at least ' + exclusivePsdU + ')',
                    },
                    parentUid: null,
                    targetUids: [object.uid],
                    type: EntityType.RESULTS_MESSAGE,
                    uid: uuid(),
                });
            } else {
                // we have successfully calculated the pipe's loading units.
                this.configureEntityForPSD(object.entity, exclusivePsdU, edgeUid);
            }
        } else {
            // zero exclusive to us. Work out whether this is because we don't have any fixture demand.
            const wets = this.getWetEndpoints(endpointUids, edgeUid, roots);
            const demandA = this.getTotalReachedPsdU([endpointUids[0]], [], [edgeUid]);
            const demandB = this.getTotalReachedPsdU([endpointUids[1]], [], [edgeUid]);

            if (demandA === 0 && wets.indexOf(endpointUids[0]) === -1 ||
                demandB === 0 && wets.indexOf(endpointUids[1]) === -1
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

    }

    getTotalReachedPsdU(roots: string[], excludedNodes: string[] = [], excludedEdges: string[] = []): number {
        const seen = new Set<string>(excludedNodes);
        const seenEdges = new Set<string>(excludedEdges);

        let psdUs = 0;

        roots.forEach((r) => {
            this.luFlowGraph.dfs(r, (n) => {
                    psdUs += this.getTerminalPsdU(this.objectStore.get(n)!.entity);
                    return false;
                },
                undefined,
                undefined,
                undefined,
                seen,
                seenEdges,
            );
        });

        return psdUs;
    }

    getWetEndpoints(endpointUids: string[], edgeUid: string, roots: string[]): string[] {
        const seen = new Set<string>();
        const seenEdges = new Set<string>([edgeUid]);

        roots.forEach((r) => {
            this.luFlowGraph.dfs(r, undefined, undefined, undefined, undefined, seen, seenEdges);
        });

        return endpointUids.filter((ep) => {
            // to be dry, we have to not have any sources.
            return seen.has(ep);
        });
    }

    getDryEndpoints(endpointUids: string[], edgeUid: string, roots: string[]): string[] {
        const wet = this.getWetEndpoints(endpointUids, edgeUid, roots);
        return endpointUids.filter((ep) => {
            return wet.indexOf(ep) === -1;
        });
    }

    analyseGraph(): {sources: string[][], biconnected: string[][]} {
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
}

function randInt(minInclusive: number, maxExclusive: number) {
    return Math.floor(Math.random() * (maxExclusive - minInclusive)) + minInclusive;
}

enum EquationValues {
    LoadingUnits = '.loadingUnits',
}
