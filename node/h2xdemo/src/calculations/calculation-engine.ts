import {DocumentState, DrawableEntity} from '@/store/document/types';
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
import MessageEntity from '@/store/document/entities/calculations/message-entity';
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

export default class CalculationEngine {

    objectStore!: ObjectStore;
    doc!: DocumentState;
    demandType!: DemandType;
    graph!: Graph<string, string>;
    equationEngine!: EquationEngine;
    catalog!: Catalog;

    calculate(
        objectStore: ObjectStore,
        doc: DocumentState,
        catalog: Catalog,
        demandType: DemandType,
        done: (entity: MessageEntity[]) => void,
    ) {
        this.objectStore = objectStore;
        this.doc = doc;
        this.catalog = catalog;
        this.demandType = demandType;
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


    doRealCalculation(): MessageEntity[] {
        this.clearCalculations();
        this.generateFlowGraph();

        const sanityCheckWarnings = this.sanityCheck(this.objectStore, this.doc);
        const multipleRootWarnings = this.checkForMultipleSources(this.objectStore, this.doc);
        const cycles = this.checkForRingMains(this.objectStore, this.doc);

        if (sanityCheckWarnings.length === 0 && multipleRootWarnings.length === 0 && cycles.length === 0) {
            // The remaining graph must be a rooted forest.
            const {roots, biconnected} = this.analyseGraph();
            roots.forEach((a) => assert(a.length === 1));
            this.prepareEmptyCalculations(roots);
            this.calculatePsds(roots.map((a) => a[0]));
        }

        console.log(this.equationEngine.toString());

        if (!this.equationEngine.isComplete()) {
            throw new Error('Calculations could not complete \n');
        }


        return [];
    }

    prepareEmptyCalculations(roots: string[][]) {
        roots.forEach((a) => {
            const r = a[0];
            this.graph.reachable(r)[0].forEach((v) => {
                const e = this.objectStore.get(v)!.entity;
                this.randomizeEntityCalculations(e);
            });
        });
    }

    generateFlowGraph() {
        this.graph = new Graph<string, string>();
        this.objectStore.forEach((obj) => {
            if (obj.entity.type === EntityType.PIPE) {
                const entity = obj.entity as PipeEntity;
                this.graph.addEdge(entity.endpointUid[0], entity.endpointUid[1], entity.uid);
            } else if (obj.entity.type === EntityType.TMV) {
                const entity = obj.entity as TmvEntity;
                this.graph.addDirectedEdge(entity.hotRoughInUid, entity.outputUid, entity.uid);
                this.graph.addDirectedEdge(entity.coldRoughInUid, entity.outputUid, entity.uid);
            } else if (isConnectable(obj.entity.type)) {
                this.graph.addNode(obj.uid);
            }
        });
    }


    // Checks basic validity stuff, like hot water/cold water shouldn't mix, all fixtures have
    // required water sources filled in, etc.
    sanityCheck(objectStore: ObjectStore, doc: DocumentState): MessageEntity[] {
        return [];
    }

    checkForMultipleSources(objectStore: ObjectStore, doc: DocumentState): MessageEntity[] {
        return [];
    }

    checkForRingMains(objectStore: ObjectStore, doc: DocumentState): MessageEntity[] {
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

    getLoadingUnitTransfer(
        lu: number,
        curr: DrawableEntity,
        connector: DrawableEntity,
        nextNode: DrawableEntity): number
    {
        switch (connector.type) {
            case EntityType.PIPE:
                return lu;
            case EntityType.TMV:
                const tmv = connector as TmvEntity;
                if (curr.uid === tmv.coldRoughInUid) {
                    return 0;
                } else if (curr.uid === tmv.hotRoughInUid) {
                    if (nextNode.uid === tmv.outputUid) {
                        return lu;
                    } else {
                        throw new Error('Flow going out of TMV is not the output: ' + JSON.stringify(nextNode));
                    }
                } else {
                    throw new Error('Not using rough-in to flow into TMV: ' + JSON.stringify(curr));
                }
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FLOW_SOURCE:
            case EntityType.FLOW_RETURN:
            case EntityType.VALVE:
            case EntityType.INVISIBLE_NODE:
            case EntityType.SYSTEM_NODE:
            case EntityType.FIXTURE:
            case EntityType.RESULTS_MESSAGE:
                throw new Error('Invalid flow connector: ' + JSON.stringify(connector));
        }
    }

    calculatePsds(roots: string[]) {
        // from roots dp to ends.
        const traversal = this.graph.dagTraversal(roots);
        traversal.forEach((thisNode) => {
            console.log("Looking at " + this.objectStore.get(thisNode.node)!.type + " " + thisNode.node);
            const nodeObj = this.objectStore.get(thisNode.node)!;

            const downstream: Array<[string, DrawableEntity, DrawableEntity]> = [];

            thisNode.children.forEach((e) => {
                const connectorObject = this.objectStore.get(e.value);
                const nextNodeObject = this.objectStore.get(e.to);
                if (connectorObject && nextNodeObject) {
                    const connector = connectorObject.entity as DrawableEntity;
                    const nextNode = nextNodeObject.entity as DrawableEntity;

                    downstream.push([nextNode.uid + EquationValues.LoadingUnits, connector, nextNode]);
                } else {
                    throw new Error('pipe not found');
                }
            });

            console.log('node: ' + JSON.stringify(thisNode));
            console.log('children: ' + JSON.stringify(downstream.map((a) => a[0])));

            this.equationEngine.submitEquation({
                inputs: downstream.map((a) => a[0]),
                evaluate: (inputs: Map<string, any>) => {
                    let result: number = 0;

                    downstream.forEach(([inputField, connector, nextNode]) => {
                        console.log('checking lu transfer from ');
                        console.log(JSON.stringify(nodeObj));
                        console.log('to');
                        console.log(JSON.stringify(nextNode));
                        console.log('via');
                        console.log(JSON.stringify(connector));
                        const pr = result;
                        result += this.getLoadingUnitTransfer(
                            inputs.get(inputField),
                            nodeObj.entity,
                            connector,
                            nextNode,
                        );
                        console.log('got ' + (result - pr));
                    });

                    result += this.getTerminalLoadingUnits(nodeObj.entity);

                    if (nodeObj.type !== EntityType.SYSTEM_NODE) {
                        this.setLoadingUnits(nodeObj, result);
                    }
                    return [[nodeObj.uid + EquationValues.LoadingUnits, result]];
                },
            });
        });
    }

    analyseGraph(): {roots: string[][], biconnected: string[][]} {
        const seen = new Set();
        const uf = new UnionFind<string>();

        this.objectStore.forEach((o) => {
            if (o.type === EntityType.FLOW_SOURCE) {
                const e = o.entity as FlowSourceEntity;

                this.graph.reachable(e.uid)[0].forEach((ouid) => {
                    if (this.objectStore.get(ouid)!.type === EntityType.FLOW_SOURCE) {
                        uf.join(ouid, e.uid);
                    }
                });
            }
        });

        const roots = uf.groups();

        return {roots, biconnected: []};
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
                loadingUnitRange: randInt(0, 10) + ' to ' + randInt(0, 10),
            };
        } else if (e.type === EntityType.VALVE) {
            const te = e as ValveEntity;

            te.calculation = {
                flowRateLS: randInt(0, 10),
                pressureKPA: randInt(0, 10),
                pressureDropKPA: randInt(0, 10),
                valveAttributes: getValveAttributes(te),
                loadingUnits: randInt(0, 10),
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
                loadingUnits: randInt(0, 10),
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
