import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import {EntityType} from '@/store/document/entities/types';
import PipeEntity from '@/store/document/entities/pipe-entity';
import ValveEntity from '@/store/document/entities/valve-entity';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import TmvEntity from '@/store/document/entities/tmv/tmv-entity';
import FixtureEntity, {fillFixtureFields} from '@/store/document/entities/fixtures/fixture-entity';
import {
    DeadlegAttribute,
    ThreeConnectionAttribute,
    TwoConnectionAttribute,
} from '@/store/document/calculations/valve-calculation';
import PopupEntity, {MessageType} from '@/store/document/entities/calculations/popup-entity';
import {DemandType} from '@/calculations/types';
import assert from 'assert';
import Graph from '@/calculations/graph';
import {isConnectable} from '@/store/document';
import EquationEngine from '@/calculations/equation-engine';
import {Catalog} from '@/store/catalog/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {isCalculated} from '@/store/document/calculations';
import UnionFind from '@/calculations/union-find';
import {assertUnreachable} from '@/lib/utils';
import uuid from 'uuid';
import {emptyPipeCalculation} from '@/store/document/calculations/pipe-calculation';

export default class CalculationEngine {

    objectStore!: ObjectStore;
    doc!: DocumentState;
    demandType!: DemandType;
    flowGraph!: Graph<string, string>;
    luFlowGraph!: Graph<string, string>;
    equationEngine!: EquationEngine;
    catalog!: Catalog;
    centerWc!: Coord;

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


    doRealCalculation(): PopupEntity[] {
        this.clearCalculations();
        this.generateFlowGraph();
        this.generateLUFlowGraph();

        const sanityCheckWarnings = this.sanityCheck(this.objectStore, this.doc);

        if (sanityCheckWarnings.length === 0) {
            // The remaining graph must be a rooted forest.
            const {sources, biconnected} = this.analyseGraph();
            const warnings = this.calculatePsds(sources.flat());
        }

        console.log(this.equationEngine.toString());

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
                case EntityType.INVISIBLE_NODE:
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


    calculatePsds(roots: string[]) {
        const totalReachedLUs = this.getTotalReachedLUs(roots);
        console.log('reached LUs: ' + totalReachedLUs);
        const warnings: PopupEntity[] = [];

        // Go through all pipes
        this.objectStore.forEach((object) => {
            if (object.type !== EntityType.PIPE) {
                return;
            }
            const pipe = object.entity as PipeEntity;
            console.log(JSON.stringify(pipe));

            const reachedLUs = this.getTotalReachedLUs(roots, [], [pipe.uid]);
            const exclusiveLUs = totalReachedLUs - reachedLUs;


            if (exclusiveLUs > 0) {
                const [point] = this.getDryEndpoints(pipe, roots);
                const [wet] = this.getWetEndpoints(pipe, roots);
                const residualLUs = this.getTotalReachedLUs([point], [wet], [pipe.uid]);

                console.log('exclusive: ' + exclusiveLUs + ' vs residual: ' + residualLUs);

                if (residualLUs > exclusiveLUs) {
                    // the LU for this pipe is ambiguous in this configuration.
                    warnings.push({
                        center: this.centerWc,
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
                    pipe.calculation = emptyPipeCalculation();
                    pipe.calculation.loadingUnits = residualLUs;
                }
            } else {
                console.log('no exclusive fixtures found. total: ' + totalReachedLUs + ' reached: ' + reachedLUs);

                // zero exclusive to us. Work out whether this is because we don't have any fixture demand.
                const wets = this.getWetEndpoints(pipe, roots);
                const demandA = this.getTotalReachedLUs([pipe.endpointUid[0]], [], [pipe.uid]);
                const demandB = this.getTotalReachedLUs([pipe.endpointUid[1]], [], [pipe.uid]);

                if (demandA === 0 && wets.indexOf(pipe.endpointUid[0]) === -1 ||
                    demandB === 0 && wets.indexOf(pipe.endpointUid[1]) === -1
                ) {
                    // redundant deadleg
                    warnings.push({
                        center: this.centerWc,
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
                    warnings.push({
                        center: this.centerWc,
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
        console.log(JSON.stringify(Array.from(seenEdges.entries())));

        let lu = 0;

        roots.forEach((r) => {
            this.luFlowGraph.dfs(r, seen, null, (n, v) => {
                console.log('visiting point ' + n);
                lu += this.getTerminalLoadingUnits(this.objectStore.get(n)!.entity);
            }, (e, v) => {
            }, seenEdges);
        });

        return lu;
    }

    getWetEndpoints(pipe: PipeEntity, roots: string[]): string[] {
        const seen = new Set<string>();
        const seenEdges = new Set<string>([pipe.uid]);

        roots.forEach((r) => {
            this.luFlowGraph.dfs(r, seen, null, (n) => {}, (e) => {}, seenEdges);
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
                velocityOptimalPipeDiameterMS: randInt(0, 10),
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
