import {DocumentState, DrawingState} from '@/store/document/types';
import {ObjectStore, SelectionTarget} from '@/htmlcanvas/lib/types';
import {EntityType} from '@/store/document/entities/types';
import PipeEntity, {fillPipeDefaultFields, makePipeFields} from '@/store/document/entities/pipe-entity';
import {makeValveFields} from '@/store/document/entities/fitting-entity';
import {makeFlowSourceFields} from '@/store/document/entities/flow-source-entity';
import TmvEntity, {makeTMVFields, SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import FixtureEntity, {fillFixtureFields, makeFixtureFields} from '@/store/document/entities/fixtures/fixture-entity';
import PopupEntity from '@/store/document/entities/calculations/popup-entity';
import {DemandType} from '@/calculations/types';
import Graph, {serializeValue} from '@/calculations/graph';
import EquationEngine from '@/calculations/equation-engine';
import {Catalog, PipeSpec} from '@/store/catalog/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {isCalculated} from '@/store/document/calculations';
import UnionFind from '@/calculations/union-find';
import {assertUnreachable, cloneSimple} from '@/lib/utils';
import {emptyPipeCalculation} from '@/store/document/calculations/pipe-calculation';
import {interpolateTable, lowerBoundTable, parseCatalogNumberExact, upperBoundTable} from '@/htmlcanvas/lib/utils';
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
import {isGermanStandard} from '@/config';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
// tslint:disable-next-line:max-line-length
import DirectedValveEntity, {
    determineConnectableSystemUid,
    makeDirectedValveFields,
} from '@/store/document/entities/directed-valves/directed-valve-entity';
import {ValveType} from '@/store/document/entities/directed-valves/valve-types';
import {lookupFlowRate} from '@/calculations/utils';
import {emptyFittingCalculation} from '@/store/document/calculations/fitting-calculation';
import {emptyFlowSourceCalculation} from '@/store/document/calculations/flow-source-calculation';
import {emptyDirectedValveCalculation} from '@/store/document/calculations/directed-valve-calculation';
import {emptySystemNodeCalculation} from '@/store/document/calculations/system-node-calculation';

export const SELF_CONNECTION = 'SELF_CONNECTION';



export default class CalculationEngine {

    objectStore!: ObjectStore;
    doc!: DocumentState;
    demandType!: DemandType;
    flowGraph!: Graph<FlowNode, FlowEdge>;
    equationEngine!: EquationEngine;
    catalog!: Catalog;
    extraErrors!: PopupEntity[];
    drawing!: DrawingState;
    ga!: number;

    calculate(
        objectStore: ObjectStore,
        doc: DocumentState,
        catalog: Catalog,
        demandType: DemandType,
        done: (entity: PopupEntity[]) => void,
    ) {
        this.objectStore = objectStore;
        this.doc = doc;
        this.catalog = catalog;
        this.demandType = demandType;
        this.extraErrors = [];
        this.drawing = this.doc.drawing;
        this.ga = this.doc.drawing.calculationParams.gravitationalAcceleration;

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
                case EntityType.FITTING:
                    fields = makeValveFields([], []);
                    break;
                case EntityType.TMV:
                    fields = makeTMVFields();
                    break;
                case EntityType.FIXTURE:
                    fields = makeFixtureFields();
                    break;
                case EntityType.DIRECTED_VALVE:
                    fields = makeDirectedValveFields(this.doc.drawing.flowSystems, obj.entity.valve);
                    break;
                case EntityType.SYSTEM_NODE:
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.RESULTS_MESSAGE:
                    break;
                default:
                    assertUnreachable(obj.entity);
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
        this.configureLUFlowGraph();

        const sanityCheckWarnings = this.sanityCheck(this.objectStore, this.doc);

        if (sanityCheckWarnings.length === 0) {
            // The remaining graph must be a rooted forest.
            const sources: FlowNode[] = Array.from(this.objectStore.values())
                .filter((o) => o.type === EntityType.FLOW_SOURCE)
                .map((o) => ({connectable: o.uid, connection: SELF_CONNECTION}));
            this.sizeDefiniteTransports(sources);
            this.sizeRingsAndRoots(sources);
            this.calculateAllPointPressures(sources);
        }

        if (!this.equationEngine.isComplete()) {
            throw new Error('Calculations could not complete \n');
        }

        return [];
    }

    calculateAllPointPressures(sources: FlowNode[]) {
        this.objectStore.forEach((obj) => {
            const entity = obj.entity;
            switch (entity.type) {
                case EntityType.FIXTURE:

                    if (!entity.calculation) {
                        entity.calculation = emptyFixtureCalculation();
                    }

                    entity.calculation.coldPressureKPA =
                        this.getAbsolutePressurePoint(
                            {connectable: entity.coldRoughInUid, connection: entity.uid},
                            sources,
                        );
                    if (entity.warmRoughInUid) {
                        entity.calculation.warmPressureKPA =
                            this.getAbsolutePressurePoint(
                                {connectable: entity.warmRoughInUid, connection: entity.uid},
                                sources,
                            );
                    }
                    break;
                case EntityType.TMV:
                    if (entity.calculation) {
                        entity.calculation.coldPressureKPA =
                            this.getAbsolutePressurePoint(
                                {connectable: entity.coldRoughInUid, connection: entity.uid},
                                sources,
                            );
                        entity.calculation.hotPressureKPA =
                            this.getAbsolutePressurePoint(
                                {connectable: entity.hotRoughInUid, connection: entity.uid},
                                sources,
                            );
                    }
                    break;
                case EntityType.FLOW_SOURCE:
                case EntityType.DIRECTED_VALVE:
                case EntityType.FITTING:
                case EntityType.SYSTEM_NODE:
                    const candidates = cloneSimple(entity.connections);
                    if (entity.type === EntityType.FLOW_SOURCE) {
                        candidates.push(SELF_CONNECTION);
                    } else if (entity.type === EntityType.SYSTEM_NODE) {
                        candidates.push(entity.parentUid!);
                    }
                    let maxPressure: number | null = null;
                    candidates.forEach((cuid) => {
                        const thisPressure = this.getAbsolutePressurePoint(
                            {connectable: entity.uid, connection: cuid},
                            sources,
                        );
                        if (thisPressure != null && (maxPressure === null || thisPressure > maxPressure)) {
                            maxPressure = thisPressure;
                        }
                    });
                    if (!entity.calculation) {
                        switch (entity.type) {
                            case EntityType.FITTING:
                                entity.calculation = emptyFittingCalculation();
                                break;
                            case EntityType.FLOW_SOURCE:
                                entity.calculation = emptyFlowSourceCalculation();
                                break;
                            case EntityType.DIRECTED_VALVE:
                                entity.calculation = emptyDirectedValveCalculation();
                                break;
                            case EntityType.SYSTEM_NODE:
                                entity.calculation = emptySystemNodeCalculation();
                                break;
                            default:
                                assertUnreachable(entity);
                        }
                    }
                    // For the entry, we have to get the highest pressure (the entry pressure)
                    entity.calculation!.pressureKPA = maxPressure;
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.PIPE:
                case EntityType.RESULTS_MESSAGE:
                    break;
                default:
                    assertUnreachable(entity);
            }
        });
    }

    getAbsolutePressurePoint(node: FlowNode, sources: FlowNode[]) {
        if (this.demandType === DemandType.PSD) {
            return this.getPeakDemandKPAWithShortestPath(node, sources);
        } else {
            const obj = this.objectStore.get(node.connectable)!;
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
                            case EntityType.DIRECTED_VALVE:
                            case EntityType.FITTING:
                            case EntityType.BACKGROUND_IMAGE:
                            case EntityType.FLOW_SOURCE:
                            case EntityType.RESULTS_MESSAGE:
                            case EntityType.SYSTEM_NODE:
                                throw new Error('don\'t know how to calculate static pressure for this');
                            default:
                                assertUnreachable(par.entity);
                        }
                    } else {
                        throw new Error('don\'t know how to calculate static pressure for an orphaned node');
                    }
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FLOW_SOURCE:
                case EntityType.PIPE:
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.TMV:
                case EntityType.FIXTURE:
                case EntityType.RESULTS_MESSAGE:
                    throw new Error('don\'t know how to calculate static pressure for that');
                default:
                    assertUnreachable(obj.entity);
            }
            return this.getStaticPressure(node, sources, height!);
        }
    }

    getStaticPressure(node: FlowNode, sources: FlowNode[], heightM: number): number {
        let highPressure: number | null = null;
        this.flowGraph.dfs(
            node,
            (n) => {
                if (sources.findIndex((s) => s.connectable === n.connectable) !== -1) {
                    const source = this.objectStore.get(n.connectable) as FlowSource;
                    const density = getFluidDensityOfSystem(source.entity.systemUid, this.doc, this.catalog)!;
                    const mh = source.entity.heightAboveFloor - heightM;
                    const thisPressure = Number(source.entity.pressureKPA!) + head2kpa(mh, density, this.ga);
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
    getPeakDemandKPAWithShortestPath(node: FlowNode, sources: FlowNode[]): number | null {
        const rPath = this.flowGraph.shortestPath(
            node,
            sources,
            (edge) => {
                const obj = this.objectStore.get(edge.value.uid)!;
                // Remember, this path is reversed
                const flowFrom = edge.to;
                const flowTo = edge.from;

                switch (edge.value.type) {
                    case EdgeType.PIPE:
                        if (obj instanceof Pipe) {
                            if (!obj.entity.calculation || obj.entity.calculation.pressureDropKpa === null) {
                                return Infinity;
                            }
                            return obj.entity.calculation.pressureDropKpa;
                        } else {
                            throw new Error('misconfigured flow graph');
                        }
                    case EdgeType.TMV_HOT_WARM:
                    case EdgeType.TMV_COLD_WARM:
                    case EdgeType.TMV_COLD_COLD: {
                        if (obj instanceof Tmv) {
                            if (!obj.entity.calculation) {
                                return Infinity;
                            }

                            let fr: number | null = null;

                            let systemUid: string = '';

                            if (edge.value.type === EdgeType.TMV_COLD_COLD &&
                                flowFrom.connectable === obj.entity.coldRoughInUid) {

                                fr = obj.entity.calculation.coldPeakFlowRate;
                                systemUid = (this.objectStore.get(obj.entity.coldRoughInUid)!
                                    .entity as SystemNodeEntity).systemUid;
                            } else if (edge.value.type === EdgeType.TMV_HOT_WARM &&
                                flowFrom.connectable === obj.entity.hotRoughInUid) {
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
                                this.ga,
                            );
                        } else {
                            throw new Error('misconfigured flow graph');
                        }
                    }
                    case EdgeType.FITTING_FLOW:
                    case EdgeType.CHECK_THROUGH:
                    case EdgeType.ISOLATION_THROUGH: {
                        const sourcePipe = this.objectStore.get(flowFrom.connection) as Pipe;
                        let dist = 0;
                        if (!sourcePipe || sourcePipe.type !== EntityType.PIPE) {
                            const destPipe = this.objectStore.get(flowTo.connection) as Pipe;
                            if (destPipe && destPipe.type === EntityType.PIPE) {
                                dist = destPipe.entity.calculation!.peakFlowRate!;
                            } else {
                                // no flow
                                throw new Error('can\'t find any flow on this edge');
                            }
                        } else {
                            dist = sourcePipe.entity.calculation!.peakFlowRate!;
                        }
                        const systemUid = determineConnectableSystemUid(
                            this.objectStore,
                            (obj.entity as DirectedValveEntity),
                        )!;
                        return head2kpa(
                            getObjectFrictionHeadLoss(
                                this,
                                obj,
                                dist,
                                flowFrom,
                                flowTo,
                            ),
                            getFluidDensityOfSystem(systemUid, this.doc, this.catalog)!,
                            this.ga,
                        );
                    }
                }
            },
            undefined,
            undefined,
            true,
            true,
        );
        if (rPath) {
            let sourceObj: FlowSource;
            if (rPath[0].length === 0) {
                if (this.objectStore.get(node.connectable)!.type !== EntityType.FLOW_SOURCE ||
                    node.connection !== SELF_CONNECTION) {
                    throw new Error('Unexpected empty path while searching for ' + JSON.stringify(node));
                }
                sourceObj = this.objectStore.get(node.connectable) as FlowSource;
            } else {
                sourceObj = this.objectStore.get(rPath[0][rPath[0].length - 1].to.connectable)! as FlowSource;
            }
            return sourceObj.entity.pressureKPA! - rPath[1];
        } else {
            return null;
        }
    }

    // Just like a flow graph, but only connects when loading units are transferred.
    configureLUFlowGraph() {
        this.flowGraph = new Graph<FlowNode, FlowEdge>();
        this.objectStore.forEach((obj) => {
            switch (obj.entity.type) {
                case EntityType.PIPE:
                    if (obj.entity.endpointUid[0] === null || obj.entity.endpointUid[1] === null) {
                        throw new Error('null found on ' + obj.entity.type + ' ' + obj.entity.uid);
                    }
                    const ev = {
                        type: EdgeType.PIPE,
                        uid: obj.entity.uid,
                    };
                    this.flowGraph.addEdge(
                        {
                            connectable: obj.entity.endpointUid[0],
                            connection: obj.entity.uid,
                        },
                        {
                            connectable: obj.entity.endpointUid[1],
                            connection: obj.entity.uid,
                        },
                        ev,
                        serializeValue(ev),
                    );
                    break;
                case EntityType.TMV:
                    const entity = obj.entity as TmvEntity;
                    if (entity.hotRoughInUid === null || entity.warmOutputUid === null) {
                        throw new Error('null found on ' + entity.type + ' ' + entity.uid);
                    }
                    const ev1 = {
                        type: EdgeType.TMV_HOT_WARM,
                        uid: entity.uid,
                    };
                    this.flowGraph.addDirectedEdge(
                        {
                            connectable: entity.hotRoughInUid,
                            connection: entity.uid,
                        },
                        {
                            connectable: entity.warmOutputUid,
                            connection: entity.uid,
                        },
                        ev1,
                        serializeValue(ev1),
                    );
                    if (entity.coldOutputUid !== null) {
                        if (entity.coldOutputUid === null || entity.coldRoughInUid === null) {
                            throw new Error('null found on ' + entity.type + ' ' + entity.uid);
                        }
                        const ev2 = {
                            type: EdgeType.TMV_COLD_COLD,
                            uid: entity.uid,
                        };
                        this.flowGraph.addDirectedEdge(
                            {
                                connectable: entity.coldRoughInUid,
                                connection: entity.uid,
                            },
                            {
                                connectable: entity.coldOutputUid,
                                connection: entity.uid,
                            },
                            ev2,
                            serializeValue(ev2),
                        );
                    }
                    break;
                case EntityType.FLOW_SOURCE:
                case EntityType.SYSTEM_NODE:
                case EntityType.FITTING:
                    const toConnect = cloneSimple(obj.entity.connections);
                    if ( obj.entity.type === EntityType.FLOW_SOURCE) {
                        this.flowGraph.addNode({connectable: obj.uid, connection: SELF_CONNECTION});
                        toConnect.push(SELF_CONNECTION);
                    } else if (obj.entity.type === EntityType.SYSTEM_NODE) {
                        if (!obj.entity.parentUid) {
                            throw new Error('invalid system node');
                        }
                        this.flowGraph.addNode({connectable: obj.uid, connection: obj.entity.parentUid});
                        toConnect.push(obj.entity.parentUid);
                    }
                    for (let i = 0; i < toConnect.length; i++) {
                        for (let j = i + 1; j < toConnect.length; j++) {
                            this.flowGraph.addEdge(
                                {
                                    connectable: obj.entity.uid,
                                    connection: toConnect[i],
                                },
                                {
                                    connectable: obj.entity.uid,
                                    connection: toConnect[j],
                                },
                                {
                                    type: EdgeType.FITTING_FLOW,
                                    uid: obj.entity.uid,
                                },
                            );
                        }
                    }
                    break;
                case EntityType.DIRECTED_VALVE:
                    this.configureDirectedValveLUGraph(obj.entity);
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.FIXTURE:
                    break;
                default:
                    assertUnreachable(obj.entity);
            }
        });
    }

    configureDirectedValveLUGraph(entity: DirectedValveEntity) {
        if (entity.connections.length === 2) {

            if (entity.sourceUid === null) {
                throw new Error('directed valve with unknown direction');
            }
            if (!entity.connections.includes(entity.sourceUid)) {
                throw new Error('directed valve with invalid direction');
            }
            const other = entity.connections.find((uid) => uid !== entity.sourceUid)!;

            switch (entity.valve.type) {
                case ValveType.RPZD:
                case ValveType.CHECK_VALVE:
                    // from start to finish only
                    this.flowGraph.addDirectedEdge(
                        {
                            connectable: entity.uid,
                            connection: entity.sourceUid,
                        },
                        {
                            connectable: entity.uid,
                            connection: other,
                        },
                        {
                            type: EdgeType.CHECK_THROUGH,
                            uid: entity.uid,
                        },
                    );
                    break;
                case ValveType.ISOLATION_VALVE:
                    // Only if it is open
                    if (!entity.valve.isClosed) {
                        this.flowGraph.addEdge(
                            {
                                connectable: entity.uid,
                                connection: entity.sourceUid,
                            },
                            {
                                connectable: entity.uid,
                                connection: other,
                            },
                            {
                                type: EdgeType.CHECK_THROUGH,
                                uid: entity.uid,
                            },
                        );
                    }
                    break;
                case ValveType.PRESSURE_RELIEF_VALVE:
                case ValveType.WATER_METER:
                case ValveType.STRAINER:
                    this.flowGraph.addEdge(
                        {
                            connectable: entity.uid,
                            connection: entity.sourceUid,
                        },
                        {
                            connectable: entity.uid,
                            connection: other,
                        },
                        {
                            type: EdgeType.CHECK_THROUGH,
                            uid: entity.uid,
                        },
                    );
                    break;
            }
        } else if (entity.connections.length > 2) {
            throw new Error('too many pipes coming out of this one');
        }
    }


    sizeRingsAndRoots(sources: FlowNode[]) {

        // For each connected component, find the total PsdUs, thus the flow rates, then distribute
        // the flow rate equally to each fixture. From these flow rates, we can then calculate the
        // flow network, and iteratively re-size the pipes.
        const leaf2PsdU = new Map<string, number>();
        const flowConnectedUF = new UnionFind<string>();
        sources.forEach((s) => {
            this.flowGraph.dfs(s, (n) => {
                const psdU = this.getTerminalPsdU(n);
                leaf2PsdU.set(n.connectable, psdU);
                flowConnectedUF.join(s.connectable, n.connectable);
            });
        });

        const demandLS = new Map<string, number>();
        const sourcesKPA = new Map<string, number>();

        sources.forEach((s) => {
            const source = this.objectStore.get(s.connectable)!;
            if (source.entity.type === EntityType.FLOW_SOURCE) {
                sourcesKPA.set(s.connectable, source.entity.pressureKPA!);
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
                const recommendedFlowRate = lookupFlowRate(totalPsdU, this.doc, this.catalog);
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
        this.flowGraph.edgeList.forEach((e) => {
            if (e.value.type !== EdgeType.PIPE) {
                return;
            }
            const pipeObj = this.objectStore.get(e.value.uid)!;
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

        const solver = new FlowSolver(this.flowGraph, this.objectStore, this.doc, this.catalog);

        let iters = 0;
        while (true) {
            iters++;
            if (iters > 5) {
                break;
            }
            const assignment = solver.solveFlowsLS(demandLS, sourcesKPA);
            let changed = false;

            pipesThatNeedSizing.forEach((target) => {
                const flow = assignment.getFlow(serializeValue({type: EdgeType.PIPE, uid: target}));

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

    getTerminalPsdU(flowNode: FlowNode): number {
        const node = this.objectStore.get(flowNode.connectable)!;

        if (node.type === EntityType.SYSTEM_NODE) {
            const parent = this.objectStore.get(flowNode.connection);
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
                case EntityType.FITTING:
                case EntityType.TMV:
                case EntityType.SYSTEM_NODE:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.DIRECTED_VALVE:
                    return 0;
                default:
                    assertUnreachable(parent.type);
            }
            // Sadly, typescript type checking for return value was not smart enough to avoid these two lines.
            throw new Error('parent type is not a correct value');
        } else {
            return 0;
        }
    }

    configureEntityForPSD(entity: DrawableEntityConcrete, psdU: number, flowEdge: FlowEdge) {
        switch (entity.type) {
            case EntityType.PIPE: {

                entity.calculation = emptyPipeCalculation();
                entity.calculation.psdUnits = psdU;

                const flowRate = lookupFlowRate(psdU, this.doc, this.catalog);

                if (flowRate === null) {
                    // Warn for no PSD
                } else {
                    this.sizePipeForFlowRate(entity, flowRate);
                }

                return;
            }
            case EntityType.TMV: {

                if (!entity.calculation) {
                    entity.calculation = emptyTmvCalculation();
                }
                const flowRate = lookupFlowRate(psdU, this.doc, this.catalog);

                if (flowEdge.type === EdgeType.TMV_COLD_COLD) {
                    entity.calculation.coldPsdUs = psdU;
                    entity.calculation.coldPeakFlowRate = flowRate;
                } else if (flowEdge.type === EdgeType.TMV_HOT_WARM) {
                    entity.calculation.hotPsdUs = psdU;
                    entity.calculation.hotPeakFlowRate = flowRate;
                } else {
                    throw new Error('invalid edge in TMV');
                }

                return;
            }
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FLOW_SOURCE:
            case EntityType.FITTING:
            case EntityType.DIRECTED_VALVE:
            case EntityType.SYSTEM_NODE:
            case EntityType.FIXTURE:
            case EntityType.RESULTS_MESSAGE:
                throw new Error('Cannot configure this entity to accept loading units');
            default:
                assertUnreachable(entity);
        }

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

            pipe.calculation!.pressureDropKpa = head2kpa(
                this.getPipePressureDropMH(pipe),
                getFluidDensityOfSystem(pipe.systemUid, this.doc, this.catalog)!,
                this.ga,
            );
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
            this.ga,
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
            // Todo: Warn No pipe big enough
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
            // Todo: Warn no pipe is big enough
            return null;
        } else {
            return a;
        }
    }

    sizeDefiniteTransports(roots: FlowNode[]) {
        const totalReachedPsdU = this.getTotalReachedPsdU(roots);

        // Go through all pipes
        this.objectStore.forEach((object) => {
            switch (object.entity.type) {
                case EntityType.TMV:
                    this.sizeDefiniteTransport(
                        object,
                        roots,
                        totalReachedPsdU,
                        {type: EdgeType.TMV_HOT_WARM, uid: object.uid},
                        [object.entity.hotRoughInUid, object.entity.warmOutputUid],
                    );

                    if (object.entity.coldOutputUid) {
                        this.sizeDefiniteTransport(
                            object,
                            roots,
                            totalReachedPsdU,
                            {type: EdgeType.TMV_COLD_COLD, uid: object.uid},
                            [object.entity.coldRoughInUid, object.entity.coldOutputUid!],
                        );
                    }
                    break;
                case EntityType.PIPE:
                    if (object.entity.endpointUid[0] === null || object.entity.endpointUid[1] === null) {
                        throw new Error('pipe has dry endpoint: '  + object.entity.uid);
                    }
                    this.sizeDefiniteTransport(
                        object,
                        roots,
                        totalReachedPsdU,
                        {type: EdgeType.PIPE, uid: object.uid},
                        object.entity.endpointUid,
                    );
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.FLOW_SOURCE:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.SYSTEM_NODE:
                case EntityType.FIXTURE:
                    break;
                default:
                    assertUnreachable(object.entity);
            }
        });
    }

    sizeDefiniteTransport(
        object: BaseBackedObject,
        roots: FlowNode[],
        totalReachedPsdU: number,
        flowEdge: FlowEdge,
        endpointUids: string[],
    ) {
        if (flowEdge.uid !== object.uid) {
            throw new Error('invalid args');
        }

        const reachedPsdU = this.getTotalReachedPsdU(roots, [], [serializeValue(flowEdge)]);
        const exclusivePsdU = totalReachedPsdU - reachedPsdU;


        if (exclusivePsdU > 0) {
            const [point] = this.getDryEndpoints(endpointUids, serializeValue(flowEdge), roots);
            const [wet] = this.getWetEndpoints(endpointUids, serializeValue(flowEdge), roots);
            const residualPsdU = this.getTotalReachedPsdU(
                [{connectable: point, connection: object.uid}],
                [wet],
                [serializeValue(flowEdge)],
            );

            if (residualPsdU > exclusivePsdU) {
                // TODO: Info that flow rate is ambiguous, but some flow is exclusive to us
            } else {
                // we have successfully calculated the pipe's loading units.
                this.configureEntityForPSD(object.entity, exclusivePsdU, flowEdge);
            }
        } else {
            // zero exclusive to us. Work out whether this is because we don't have any fixture demand.
            const wets = this.getWetEndpoints(endpointUids, serializeValue(flowEdge), roots);
            const demands = endpointUids.map((e) =>
                this.getTotalReachedPsdU([{connectable: e, connection: object.uid}], [], [serializeValue(flowEdge)]),
            );

            if (demands[0] === 0 && wets.indexOf(endpointUids[0]) === -1 ||
                demands[1] === 0 && wets.indexOf(endpointUids[1]) === -1
            ) {
                // TODO: Info no flow redundant deadleg
            } else {
                // ambiguous
                // TODO: Info that flow rate is ambiguous, and no flow is exclusive to us
            }
        }

    }

    getTotalReachedPsdU(roots: FlowNode[], excludedNodes: string[] = [], excludedEdges: string[] = []): number {
        const seen = new Set<string>(excludedNodes);
        const seenEdges = new Set<string>(excludedEdges);

        let psdUs = 0;

        roots.forEach((r) => {
            this.flowGraph.dfs(r, (n) => {
                    psdUs += this.getTerminalPsdU(n);
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

    getWetEndpoints(endpointUids: string[], edgeUid: string, roots: FlowNode[]): string[] {
        const seen = new Set<string>();
        const seenEdges = new Set<string>([edgeUid]);

        roots.forEach((r) => {
            this.flowGraph.dfs(
                r,
                undefined,
                undefined,
                undefined,
                undefined,
                seen,
                seenEdges,
            );
        });

        return endpointUids.filter((ep) => {
            // to be dry, we have to not have any sources.
            return seen.has(ep);
        });
    }

    getDryEndpoints(endpointUids: string[], edgeUid: string, roots: FlowNode[]): string[] {
        const wet = this.getWetEndpoints(endpointUids, edgeUid, roots);
        return endpointUids.filter((ep) => {
            return wet.indexOf(ep) === -1;
        });
    }
}

function randInt(minInclusive: number, maxExclusive: number) {
    return Math.floor(Math.random() * (maxExclusive - minInclusive)) + minInclusive;
}

export enum EdgeType {
    PIPE,
    TMV_HOT_WARM,
    TMV_COLD_WARM,
    TMV_COLD_COLD,
    FITTING_FLOW,

    // reserve some for check valve, pump and isolation types.
    CHECK_THROUGH,
    ISOLATION_THROUGH,
}

export interface FlowEdge {
    type: EdgeType;
    uid: string;
}

export interface FlowNode {
    connection: string;
    connectable: string;
}
