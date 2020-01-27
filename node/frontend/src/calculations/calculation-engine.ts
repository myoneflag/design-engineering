import { DocumentState } from "../../src/store/document/types";
import { SelectionTarget } from "../../src/htmlcanvas/lib/types";
import { EntityType } from "../../../common/src/api/document/entities/types";
import PipeEntity, {
    fillPipeDefaultFields,
    makePipeFields
} from "../../../common/src/api/document/entities/pipe-entity";
import { makeValveFields } from "../../../common/src/api/document/entities/fitting-entity";
import { makeRiserFields } from "../../../common/src/api/document/entities/riser-entity";
import {
    BigValveType,
    makeBigValveFields,
    SystemNodeEntity
} from "../../../common/src/api/document/entities/big-valve/big-valve-entity";
import FixtureEntity, {
    fillFixtureFields,
    makeFixtureFields
} from "../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DemandType } from "../../src/calculations/types";
import Graph, { Edge } from "../../src/calculations/graph";
import EquationEngine from "../../src/calculations/equation-engine";
import BaseBackedObject from "../../src/htmlcanvas/lib/base-backed-object";
import UnionFind from "../../src/calculations/union-find";
import Pipe from "../../src/htmlcanvas/objects/pipe";
import {
    getDarcyWeisbachMH,
    getFluidDensityOfSystem,
    getFrictionFactor,
    getReynoldsNumber,
    head2kpa
} from "../../src/calculations/pressure-drops";
import FlowSolver from "../../src/calculations/flow-solver";
import { PropertyField } from "../../../common/src/api/document/entities/property-field";
import { MainEventBus } from "../../src/store/main-event-bus";
import { getObjectFrictionHeadLoss } from "../../src/calculations/entity-pressure-drops";
import { DrawableEntityConcrete, isConnectableEntity } from "../../../common/src/api/document/entities/concrete-entity";
import BigValve from "../htmlcanvas/objects/big-valve/bigValve";
// tslint:disable-next-line:max-line-length
import DirectedValveEntity, { makeDirectedValveFields } from "../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { ValveType } from "../../../common/src/api/document/entities/directed-valves/valve-types";
import {
    addPsdCounts,
    comparePsdCounts,
    ContextualPCE,
    countPsdProfile,
    insertPsdProfile,
    isZeroPsdCounts,
    lookupFlowRate,
    PsdCountEntry,
    PsdProfile,
    subtractPsdProfiles,
    zeroContextualPCE,
    zeroPsdCounts
} from "../../src/calculations/utils";
import FittingCalculation from "../../src/store/document/calculations/fitting-calculation";
import DirectedValveCalculation from "../../src/store/document/calculations/directed-valve-calculation";
import SystemNodeCalculation from "../../src/store/document/calculations/system-node-calculation";
import { StandardFlowSystemUids } from "../../src/store/catalog";
import { isCalculated } from "../store/document/calculations";
import DrawableObjectFactory from "../htmlcanvas/lib/drawable-object-factory";
import { Calculated } from "../htmlcanvas/lib/object-traits/calculated-object";
import stringify from "json-stable-stringify";
import { makeLoadNodesFields, NodeType } from "../../../common/src/api/document/entities/load-node-entity";
import { GlobalStore } from "../htmlcanvas/lib/global-store";
import { ObjectStore } from "../htmlcanvas/lib/object-store";
import { makeFlowSourceFields } from "../../../common/src/api/document/entities/flow-source-entity";
import FlowSourceCalculation from "../store/document/calculations/flow-source-calculation";
import FlowSource from "../htmlcanvas/objects/flow-source";
import { makePlantEntityFields } from "../../../common/src/api/document/entities/plant-entity";
import Plant from "../htmlcanvas/objects/plant";
import { assertUnreachable, isGermanStandard } from "../../../common/src/api/config";
import { Catalog, PipeSpec } from "../../../common/src/api/catalog/types";
import { DrawingState } from "../../../common/src/api/document/drawing";
import {
    cloneSimple,
    interpolateTable,
    lowerBoundTable,
    parseCatalogNumberExact,
    parseCatalogNumberOrMax,
    parseCatalogNumberOrMin,
    upperBoundTable
} from "../../../common/src/lib/utils";
import { determineConnectableSystemUid } from "../store/document/entities/lib";

export const FLOW_SOURCE_EDGE = "FLOW_SOURCE_EDGE";
export const FLOW_SOURCE_ROOT = "FLOW_SOURCE_ROOT";
export const FLOW_SOURCE_ROOT_NODE: FlowNode = {connectable: FLOW_SOURCE_ROOT, connection: FLOW_SOURCE_EDGE};
export const FLOW_SOURCE_ROOT_BRIDGE: Edge<FlowNode | undefined, undefined> = { from: undefined, to: FLOW_SOURCE_ROOT_NODE, value: undefined, uid: "FLOW_SOURCE_ROOT_BRIDGE", isDirected: true, isReversed: false};

export enum EdgeType {
    PIPE,
    BIG_VALVE_HOT_HOT,
    BIG_VALVE_HOT_WARM,
    BIG_VALVE_COLD_WARM,
    BIG_VALVE_COLD_COLD,
    FITTING_FLOW,
    FLOW_SOURCE_EDGE,

    // reserve some for check valve, pump and isolation types.
    CHECK_THROUGH,
    ISOLATION_THROUGH,

    PLANT_THROUGH,
}

export interface FlowEdge {
    type: EdgeType;
    uid: string;
}

export interface FlowNode {
    connection: string;
    connectable: string;
}

export default class CalculationEngine {
    globalStore!: GlobalStore;
    networkObjectUids!: string[];
    drawableObjectUids!: string[];

    doc!: DocumentState;
    demandType!: DemandType;
    flowGraph!: Graph<FlowNode, FlowEdge>;
    equationEngine!: EquationEngine;
    catalog!: Catalog;
    drawing!: DrawingState;
    ga!: number;

    entityMaxPressuresKPA = new Map<string, number | null>();
    allBridges = new Map<string, Edge<FlowNode, FlowEdge>>();
    psdAfterBridgeCache = new Map<string, PsdProfile>();
    parentBridgeOfWetEdge = new Map<string, Edge<FlowNode | undefined, FlowEdge | undefined>>();
    globalReachedPsdUs = new PsdProfile();
    firstWet = new Map<string, FlowNode>();
    secondWet = new Map<string, FlowNode>();

    psdProfileWithinGroup = new Map<string, PsdProfile>();
    childBridges = new Map<string, Array<Edge<FlowNode, FlowEdge>>>();

    networkObjects(): BaseBackedObject[] {
        return this.networkObjectUids.map((u) => this.globalStore.get(u)!);
    }

    drawableObjects(): BaseBackedObject[] {
        return this.drawableObjectUids.map((u) => this.globalStore.get(u)!);
    }

    calculate(
        objectStore: GlobalStore,
        doc: DocumentState,
        catalog: Catalog,
        demandType: DemandType,
        done: (success: boolean) => void
    ) {
        this.networkObjectUids = [];
        this.drawableObjectUids = [];
        this.globalStore = objectStore;
        this.globalStore.forEach((o) => this.globalStore.bustDependencies(o.uid));
        if (this.globalStore.dependedBy.size) {
            throw new Error(
                "couldn't clear cache, dependedBy still " +
                    JSON.stringify(this.globalStore.dependedBy, (key, value) => {
                        if (value instanceof Map) {
                            return [...value];
                        }
                        return value;
                    })
            );
        }
        if (this.globalStore.dependsOn.size) {
            throw new Error(
                "couldn't clear cache, dependsOn still " +
                    JSON.stringify([...this.globalStore.dependsOn], (key, value) => {
                        if (value instanceof Map) {
                            return [...value];
                        }
                        return value;
                    })
            );
        }
        this.globalStore.forEach((o) => {
            if (o.cache.size) {
                throw new Error("couldn't clear cache");
            }
        });
        this.doc = doc;
        this.catalog = catalog;
        this.demandType = demandType;
        this.drawing = this.doc.drawing;
        this.ga = this.doc.drawing.metadata.calculationParams.gravitationalAcceleration;

        const success = this.preValidate();

        if (!success) {
            done(false);
            return;
        }

        this.equationEngine = new EquationEngine();
        this.doRealCalculation();
        done(true);
    }

    clearCalculations() {
        this.globalStore.clearCalculations();

        /*
        this.networkObjects().forEach((v) => {
            if (isCalculated(v.entity)) {
                this.globalStore.getOrCreateCalculation(v.entity);
            }
        });*/
    }

    preValidate(): boolean {
        let selectObject: SelectionTarget | null = null;

        this.globalStore.forEach((obj) => {
            let fields: PropertyField[] = [];
            switch (obj.entity.type) {
                case EntityType.RISER:
                    fields = makeRiserFields(obj.entity, this.catalog, this.drawing);
                    break;
                case EntityType.PIPE:
                    fields = makePipeFields(obj.entity, this.catalog, this.doc.drawing);
                    break;
                case EntityType.FITTING:
                    fields = makeValveFields([], []);
                    break;
                case EntityType.BIG_VALVE:
                    fields = makeBigValveFields(obj.entity);
                    break;
                case EntityType.FIXTURE:
                    fields = makeFixtureFields(this.doc.drawing, obj.entity);
                    break;
                case EntityType.DIRECTED_VALVE:
                    fields = makeDirectedValveFields(obj.entity, this.catalog, this.doc.drawing);
                    break;
                case EntityType.FLOW_SOURCE:
                    fields = makeFlowSourceFields([], []);
                    break;
                case EntityType.LOAD_NODE:
                    fields = makeLoadNodesFields([], obj.entity);
                    break;
                case EntityType.PLANT:
                    fields = makePlantEntityFields([]);
                    break;
                case EntityType.SYSTEM_NODE:
                case EntityType.BACKGROUND_IMAGE:
                    break;
                default:
                    assertUnreachable(obj.entity);
            }

            for (const field of fields) {
                if (!selectObject) {
                    if (
                        field.requiresInput &&
                        ((obj.entity as any)[field.property] === null || (obj.entity as any)[field.property] === "")
                    ) {
                        selectObject = {
                            uid: obj.uid,
                            property: field.property,
                            message: "Please enter a value for " + field.property,
                            variant: "danger",
                            title: "Missing required value",
                            recenter: true
                        };
                    }
                }
            };
        });

        this.globalStore.forEach((o) => {
            if (o.entity.type === EntityType.PLANT) {
                if (o.entity.pumpPressureKPA && o.entity.pressureLossKPA) {
                    selectObject = {
                        uid: o.uid,
                        property: 'pumpPressureKPA',
                        message: "Only Pump Pressure or Pressure Loss may be set, but not both",
                        variant: "danger",
                        title: "Please Choose Only One",
                        recenter: true
                    };
                }
            }
        });

        if (selectObject) {
            MainEventBus.$emit("select", selectObject);
            return false;
        }
        return true;
    }

    doRealCalculation() {
        this.clearCalculations();

        const sanityPassed = this.sanityCheck(this.globalStore, this.doc);

        try {
            if (sanityPassed) {
                this.buildNetworkObjects();
                this.configureLUFlowGraph();
                this.precomputeBridges();
                this.precomputePsdAfterBridge(FLOW_SOURCE_ROOT_BRIDGE, FLOW_SOURCE_ROOT_NODE, new Set<string>());
                console.log(this.psdAfterBridgeCache);


                this.preCompute();
                this.sizeDefiniteTransports();
                // this.sizeRingsAndRoots(sources);
                this.calculateAllPointPressures();
                this.fillPressureDropFields();
                this.createWarnings();


                this.collectResults();
            }
        } finally {
            this.removeNetworkObjects();
            this.networkObjectUids = undefined!;
            this.drawableObjectUids = undefined!;
            this.entityMaxPressuresKPA.clear();
        }

        if (!this.equationEngine.isComplete()) {
            throw new Error("Calculations could not complete \n");
        }
    }

    precomputeBridges() {
        const [bridges, components] = this.flowGraph.findBridgeSeparatedComponents();

        for (const e of bridges) {
            this.allBridges.set(e.uid, e);
        }

        console.log(bridges.length + ' ' + components.length);
        const lengths = components.map((c) => c[0].length + c[1].length);
        lengths.sort().reverse();
        console.log(JSON.stringify(lengths.slice(0, 60)));
        console.log(JSON.stringify(lengths.slice(Math.ceil(lengths.length / 2), Math.ceil(lengths.length / 2) + 60)));


        const bridgeStack: Array<Edge<FlowNode | undefined, FlowEdge | undefined>> = [FLOW_SOURCE_ROOT_BRIDGE];

        this.childBridges.set(FLOW_SOURCE_ROOT_BRIDGE.uid, []);

        this.flowGraph.dfsRecursive(
            FLOW_SOURCE_ROOT_NODE,
            (n) => {
                if (!this.psdProfileWithinGroup.has(bridgeStack[bridgeStack.length - 1].uid)) {
                    this.psdProfileWithinGroup.set(bridgeStack[bridgeStack.length - 1].uid, new PsdProfile());
                }
                const units = this.getTerminalPsdU(n);
                if (units) {
                    insertPsdProfile(this.psdProfileWithinGroup.get(bridgeStack[bridgeStack.length - 1].uid)!, units);
                    insertPsdProfile(this.globalReachedPsdUs, units);
                }
            },
            undefined,
            (e) => {
                if (this.allBridges.has(e.uid)) {
                    this.childBridges.get(bridgeStack[bridgeStack.length - 1].uid)!.push(e);
                    this.childBridges.set(e.uid, []);
                    bridgeStack.push(e);
                }
                this.parentBridgeOfWetEdge.set(e.uid, bridgeStack[bridgeStack.length - 1]);
                this.firstWet.set(e.uid, e.from);
                this.secondWet.set(e.uid, e.to);
            },
            (e) => {
                if (this.allBridges.has(e.uid)) {
                    if (e.uid !== bridgeStack.pop()!.uid) {
                        throw new Error('traversal error');
                    }
                }
            },
            undefined,
            undefined,
            true,
            false,
        );

        console.log(this.allBridges);
        console.log(this.globalReachedPsdUs);
        console.log(this.psdProfileWithinGroup);
        console.log(this.psdAfterBridgeCache);
        console.log(this.childBridges);
        console.log(this.parentBridgeOfWetEdge);
        console.log(this.firstWet);

    }

    // Take the calcs from the invisible network and collect them into the visible results.
    collectResults() {
        this.drawableObjects().forEach((o) => {
            if (isCalculated(o.entity)) {
                this.globalStore.setCalculation(o.uid, ((o as unknown) as Calculated).collectCalculations(this));
            }
        });
    }

    buildNetworkObjects() {
        this.drawableObjectUids = Array.from(this.globalStore.keys());
        // We assume we have a fresh globalstore with no pollutants.
        Array.from(this.globalStore.values()).forEach((o) => {
            const es = o.getCalculationEntities(this);
            es.forEach((e) => {
                if (this.globalStore.has(e.uid)) {
                    throw new Error("Projected entity already exists: " + JSON.stringify(e));
                }

                // all z coordinates are thingos.
                if (isConnectableEntity(e)) {
                    if (e.calculationHeightM === null) {
                        throw new Error("entities in the calculation phase must be 3d - " + e.uid + " " + e.type);
                    }
                }

                (e as any).__calc__ = true;
                DrawableObjectFactory.buildGhost(
                    e,
                    this.globalStore,
                    this.doc,
                    this.globalStore.levelOfEntity.get(o.uid)!,
                    undefined
                );
                // this.globalStore.set(e.uid, e); this is already done by DrawableObjectFactory

                this.networkObjectUids.push(e.uid);
            });
        });
    }

    removeNetworkObjects() {
        this.networkObjectUids.forEach((uid) => {
            this.globalStore.delete(uid);
        });
    }

    preCompute() {
        this.networkObjects().forEach((o) => {
            if (o.entity.type === EntityType.PIPE) {
                const c = this.globalStore.getOrCreateCalculation(o.entity);
                c.lengthM = o.entity.lengthM == null ? (o as Pipe).computedLengthM : o.entity.lengthM;
            }
        });
    }

    calculateAllPointPressures() {
        this.precomputePeakKPAPoints();

        this.networkObjects().forEach((obj) => {
            const entity = obj.entity;
            switch (entity.type) {
                case EntityType.FIXTURE: {
                    const calculation = this.globalStore.getOrCreateCalculation(entity);

                    for (const suid of entity.roughInsInOrder) {
                        calculation.pressures[suid] = this.getAbsolutePressurePoint(
                            { connectable: entity.roughIns[suid].uid, connection: entity.uid },
                        );
                    }
                    break;
                }
                case EntityType.BIG_VALVE: {
                    const calculation = this.globalStore.getOrCreateCalculation(entity);
                    calculation.coldPressureKPA = this.getAbsolutePressurePoint(
                        { connectable: entity.coldRoughInUid, connection: entity.uid },
                    );
                    calculation.hotPressureKPA = this.getAbsolutePressurePoint(
                        { connectable: entity.hotRoughInUid, connection: entity.uid },
                    );
                    break;
                }
                case EntityType.FLOW_SOURCE:
                case EntityType.DIRECTED_VALVE:
                case EntityType.FITTING:
                case EntityType.SYSTEM_NODE:
                case EntityType.LOAD_NODE: {
                    const calculation = this.globalStore.getOrCreateCalculation(entity) as
                        | FlowSourceCalculation
                        | DirectedValveCalculation
                        | FittingCalculation
                        | SystemNodeCalculation;
                    const candidates = cloneSimple(this.globalStore.getConnections(entity.uid));
                    if (entity.type === EntityType.FLOW_SOURCE) {
                        candidates.push(FLOW_SOURCE_EDGE);
                    } else if (entity.type === EntityType.SYSTEM_NODE) {
                        candidates.push(entity.parentUid!);
                    }
                    let maxPressure: number | null = null;
                    let minPressure: number | null = null;
                    candidates.forEach((cuid) => {
                        const thisPressure = this.getAbsolutePressurePoint(
                            { connectable: entity.uid, connection: cuid },
                        );
                        if (thisPressure != null && (maxPressure === null || thisPressure > maxPressure)) {
                            maxPressure = thisPressure;
                        }
                        if (minPressure === null || (thisPressure !== null && thisPressure < minPressure)) {
                            minPressure = thisPressure;
                        }
                    });
                    // For the entry, we have to get the highest pressure (the entry pressure)
                    calculation.pressureKPA = maxPressure;
                    break;
                }
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.PIPE:
                case EntityType.PLANT:
                case EntityType.RISER:
                    break;
                default:
                    assertUnreachable(entity);
            }
        });
    }

    getAbsolutePressurePoint(node: FlowNode) {
        if (this.demandType === DemandType.PSD) {
            const num = this.entityMaxPressuresKPA.get(node.connectable);
            return num === undefined ? null : num;
        } else {
            const obj = this.globalStore.get(node.connectable)!;
            let height: number;
            switch (obj.entity.type) {
                case EntityType.SYSTEM_NODE:
                    if (obj.entity.parentUid) {
                        const par = this.globalStore.get(obj.entity.parentUid)!;
                        switch (par.entity.type) {
                            case EntityType.PIPE:
                                height = par.entity.heightAboveFloorM;
                                break;
                            case EntityType.BIG_VALVE:
                                height = par.entity.heightAboveFloorM;
                                break;
                            case EntityType.FIXTURE:
                                const filled = fillFixtureFields(this.doc.drawing, this.catalog, par.entity);
                                height = filled.outletAboveFloorM!;
                                break;
                            case EntityType.PLANT:
                                height = par.entity.heightAboveFloorM;
                                break;
                            case EntityType.DIRECTED_VALVE:
                            case EntityType.FITTING:
                            case EntityType.BACKGROUND_IMAGE:
                            case EntityType.RISER:
                            case EntityType.SYSTEM_NODE:
                            case EntityType.FLOW_SOURCE:
                            case EntityType.LOAD_NODE:
                                throw new Error("don't know how to calculate static pressure for this");
                            default:
                                assertUnreachable(par.entity);
                        }
                    } else {
                        throw new Error("don't know how to calculate static pressure for an orphaned node");
                    }
                    break;
                case EntityType.LOAD_NODE:
                    height = obj.entity.calculationHeightM!;
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.RISER:
                case EntityType.PIPE:
                case EntityType.PLANT:
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.BIG_VALVE:
                case EntityType.FLOW_SOURCE:
                case EntityType.FIXTURE:
                    throw new Error("don't know how to calculate static pressure for that");
                default:
                    assertUnreachable(obj.entity);
            }
            return this.getStaticPressure(node, height!);
        }
    }

    getStaticPressure(node: FlowNode,  heightM: number): number {
        let highPressure: number | null = null;
        this.flowGraph.dfs(
            node,
            (n) => {
                if (this.globalStore.has(n.connectable) && this.globalStore.get(n.connectable)!.type === EntityType.FLOW_SOURCE) {
                    const source = this.globalStore.get(n.connectable) as FlowSource;
                    const density = getFluidDensityOfSystem(source.entity.systemUid, this.doc, this.catalog)!;
                    const mh = source.entity.heightAboveGroundM! - heightM;
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
            true
        );
        return highPressure == null ? -1 : highPressure;
    }

    /**
     * In a peak flow graph, flow paths don't represent a valid network flow state, and sometimes, don't
     * even have a direction for each pipe.
     * One strategy to get a sane pressure drop to a point is to find the smallest pressure drop from it to
     * any source along the least pressure drop path.
     */
    precomputePeakKPAPoints() {
        this.networkObjects().forEach((o) => {
            if (o.entity.type === EntityType.FLOW_SOURCE) {
                const e = o.entity;
                // Dijkstra to all objects, recording the max pressure that's arrived there.
                this.flowGraph.dijkstra(
                    { connectable: o.uid, connection: FLOW_SOURCE_EDGE },
                    (edge) => {
                        const obj = this.globalStore.get(edge.value.uid)!;
                        const flowFrom = edge.from;
                        const flowTo = edge.to;

                        switch (edge.value.type) {
                            case EdgeType.PIPE:
                                if (obj instanceof Pipe) {
                                    const calculation = this.globalStore.getOrCreateCalculation(obj.entity);

                                    // recalculate with height
                                    if (!calculation || calculation.peakFlowRate === null) {
                                        return -Infinity; // The following values are unknown, because this pressure
                                        // drop is unknown.
                                    }
                                    const headLoss = obj.getFrictionHeadLoss(
                                        this,
                                        calculation.peakFlowRate,
                                        edge.from,
                                        edge.to,
                                        true
                                    );
                                    if (headLoss === null) {
                                        return -Infinity;
                                    }

                                    return head2kpa(
                                        headLoss,
                                        getFluidDensityOfSystem(obj.entity.systemUid, this.doc, this.catalog)!,
                                        this.ga
                                    );
                                } else {
                                    throw new Error("misconfigured flow graph");
                                }
                            case EdgeType.BIG_VALVE_HOT_HOT:
                            case EdgeType.BIG_VALVE_HOT_WARM:
                            case EdgeType.BIG_VALVE_COLD_WARM:
                            case EdgeType.BIG_VALVE_COLD_COLD: {
                                if (obj instanceof BigValve) {
                                    const calculation = this.globalStore.getOrCreateCalculation(obj.entity);
                                    if (!calculation) {
                                        return Infinity;
                                    }

                                    let fr: number | null = null;

                                    let systemUid: string = "";

                                    if (
                                        edge.value.type === EdgeType.BIG_VALVE_COLD_COLD &&
                                        flowFrom.connectable === obj.entity.coldRoughInUid
                                    ) {
                                        fr = calculation.coldPeakFlowRate;
                                        systemUid = (this.globalStore.get(obj.entity.coldRoughInUid)!
                                            .entity as SystemNodeEntity).systemUid;
                                    } else if (
                                        (edge.value.type === EdgeType.BIG_VALVE_HOT_WARM ||
                                            edge.value.type === EdgeType.BIG_VALVE_HOT_HOT) &&
                                        flowFrom.connectable === obj.entity.hotRoughInUid
                                    ) {
                                        fr = calculation.hotPeakFlowRate;
                                        systemUid = (this.globalStore.get(obj.entity.hotRoughInUid)!
                                            .entity as SystemNodeEntity).systemUid;
                                    } else {
                                        throw new Error("Misused TMV");
                                    }

                                    if (fr === null) {
                                        return Infinity;
                                    }

                                    const hl = getObjectFrictionHeadLoss(this, obj, fr, flowFrom, flowTo);
                                    return hl === null
                                        ? -Infinity
                                        : head2kpa(
                                              hl,
                                              getFluidDensityOfSystem(systemUid, this.doc, this.catalog)!,
                                              this.ga
                                          );
                                } else {
                                    throw new Error("misconfigured flow graph");
                                }
                            }
                            case EdgeType.FITTING_FLOW:
                            case EdgeType.CHECK_THROUGH:
                            case EdgeType.ISOLATION_THROUGH: {
                                const sourcePipe = this.globalStore.get(flowFrom.connection);
                                const destPipe = this.globalStore.get(flowTo.connection);
                                let srcDist: number | null = null;
                                let destDist: number | null = null;
                                let dist: number | null = null;

                                if (sourcePipe instanceof Pipe) {
                                    const srcCalc = this.globalStore.getOrCreateCalculation(sourcePipe.entity);
                                    srcDist = srcCalc.peakFlowRate || 0;
                                }

                                if (destPipe instanceof Pipe) {
                                    const destCalc = this.globalStore.getOrCreateCalculation(destPipe.entity);
                                    destDist = destCalc.peakFlowRate || 0;
                                }

                                if (srcDist != null && destDist != null) {
                                    dist = Math.min(srcDist, destDist);
                                } else if (srcDist != null) {
                                    dist = srcDist;
                                } else {
                                    dist = destDist;
                                }

                                const systemUid = determineConnectableSystemUid(
                                    this.globalStore,
                                    obj.entity as DirectedValveEntity
                                )!;

                                if (dist !== null) {
                                    const hl = getObjectFrictionHeadLoss(this, obj, dist, flowFrom, flowTo);
                                    return hl === null
                                        ? -Infinity
                                        : head2kpa(
                                              hl,
                                              getFluidDensityOfSystem(systemUid, this.doc, this.catalog)!,
                                              this.ga
                                          );
                                } else {
                                    return 1000000;
                                }
                            }
                            case EdgeType.PLANT_THROUGH: {
                                const obj = this.globalStore.get(edge.value.uid) as Plant;
                                if (obj.entity.pumpPressureKPA !== null) {
                                    if (flowFrom.connectable === obj.entity.inletUid) {
                                        if (flowTo.connectable !== obj.entity.outletUid) {
                                            throw new Error('misconfigured flow graph');
                                        }
                                        return - obj.entity.pumpPressureKPA;
                                    } else {
                                        if (flowTo.connectable !== obj.entity.inletUid ||
                                            flowFrom.connectable !== obj.entity.outletUid) {
                                            throw new Error('misconfigured flow graph');
                                        }
                                        return + obj.entity.pumpPressureKPA;
                                    }
                                }
                                return 0;
                            }
                            case EdgeType.FLOW_SOURCE_EDGE:
                                throw new Error('oopsies');
                        }
                    },
                    (dijk) => {
                        // xTODO: Bellman Ford
                        let finalPressureKPA: number | null;
                        if (dijk.weight > -Infinity) {
                            finalPressureKPA = e.pressureKPA! - dijk.weight;
                        } else {
                            finalPressureKPA = null;
                        }
                        if (this.entityMaxPressuresKPA.has(dijk.node.connectable)) {
                            const existing = this.entityMaxPressuresKPA.get(dijk.node.connectable)!;
                            if (existing !== null && (finalPressureKPA === null || existing < finalPressureKPA)) {
                                // throw new Error('new size is larger than us ' + existing + ' ' + finalPressureKPA);
                            }
                        } else {
                            this.entityMaxPressuresKPA.set(dijk.node.connectable, finalPressureKPA);
                        }
                    }
                );
            }
        });
    }

    addDirectedEdge(type: EdgeType, connection: string, fromConnectable: string, toConnectable: string) {
        const ev = { type, uid: connection };
        this.flowGraph.addDirectedEdge(
            { connectable: fromConnectable, connection },
            { connectable: toConnectable, connection },
            ev,
            stringify(ev)
        );
    }

    serializeNode(node: FlowNode) {
        return node.connection + " " + node.connectable;
    }

    // Just like a flow graph, but only connects when loading units are transferred.
    configureLUFlowGraph() {
        this.flowGraph = new Graph<FlowNode, FlowEdge>(this.serializeNode);
        this.flowGraph.addNode(FLOW_SOURCE_ROOT_NODE);
        this.networkObjects().forEach((obj) => {
            switch (obj.entity.type) {
                case EntityType.PIPE:
                    if (obj.entity.endpointUid[0] === null || obj.entity.endpointUid[1] === null) {
                        throw new Error("null found on " + obj.entity.type + " " + obj.entity.uid);
                    }
                    const ev = {
                        type: EdgeType.PIPE,
                        uid: obj.entity.uid
                    };
                    this.flowGraph.addEdge(
                        {
                            connectable: obj.entity.endpointUid[0],
                            connection: obj.entity.uid
                        },
                        {
                            connectable: obj.entity.endpointUid[1],
                            connection: obj.entity.uid
                        },
                        ev,
                        stringify(ev)
                    );
                    break;
                case EntityType.BIG_VALVE:
                    const entity = obj.entity;
                    switch (entity.valve.type) {
                        case BigValveType.TMV:
                            this.addDirectedEdge(
                                EdgeType.BIG_VALVE_COLD_COLD,
                                entity.uid,
                                entity.coldRoughInUid,
                                entity.valve.coldOutputUid
                            );
                            this.addDirectedEdge(
                                EdgeType.BIG_VALVE_HOT_WARM,
                                entity.uid,
                                entity.hotRoughInUid,
                                entity.valve.warmOutputUid
                            );
                            break;
                        case BigValveType.TEMPERING:
                            this.addDirectedEdge(
                                EdgeType.BIG_VALVE_HOT_WARM,
                                entity.uid,
                                entity.hotRoughInUid,
                                entity.valve.warmOutputUid
                            );
                            break;
                        case BigValveType.RPZD_HOT_COLD:
                            this.addDirectedEdge(
                                EdgeType.BIG_VALVE_COLD_COLD,
                                entity.uid,
                                entity.coldRoughInUid,
                                entity.valve.coldOutputUid
                            );
                            this.addDirectedEdge(
                                EdgeType.BIG_VALVE_HOT_HOT,
                                entity.uid,
                                entity.hotRoughInUid,
                                entity.valve.hotOutputUid
                            );
                            break;
                        default:
                            assertUnreachable(entity.valve);
                    }
                    break;
                case EntityType.FLOW_SOURCE:
                case EntityType.LOAD_NODE:
                case EntityType.SYSTEM_NODE:
                case EntityType.FITTING:
                    const toConnect = cloneSimple(this.globalStore.getConnections(obj.entity.uid));
                    if (obj.entity.type === EntityType.FLOW_SOURCE) {
                        this.flowGraph.addNode({ connectable: obj.uid, connection: FLOW_SOURCE_EDGE });
                        toConnect.push(FLOW_SOURCE_EDGE);

                        this.flowGraph.addDirectedEdge(
                            FLOW_SOURCE_ROOT_NODE,
                            { connectable: obj.uid, connection: FLOW_SOURCE_EDGE },
                            {
                                type: EdgeType.FLOW_SOURCE_EDGE,
                                uid: obj.entity.uid,
                            },
                        );
                    } else if (obj.entity.type === EntityType.SYSTEM_NODE) {
                        if (!obj.entity.parentUid) {
                            throw new Error("invalid system node");
                        }
                        this.flowGraph.addNode({ connectable: obj.uid, connection: obj.entity.parentUid });
                        toConnect.push(obj.entity.parentUid);
                    }
                    for (let i = 0; i < toConnect.length; i++) {
                        for (let j = i + 1; j < toConnect.length; j++) {
                            this.flowGraph.addEdge(
                                {
                                    connectable: obj.entity.uid,
                                    connection: toConnect[i]
                                },
                                {
                                    connectable: obj.entity.uid,
                                    connection: toConnect[j]
                                },
                                {
                                    type: EdgeType.FITTING_FLOW,
                                    uid: obj.entity.uid
                                }
                            );
                        }
                    }
                    break;
                case EntityType.DIRECTED_VALVE:
                    this.configureDirectedValveLUGraph(obj.entity);
                    break;
                case EntityType.PLANT:
                    this.flowGraph.addDirectedEdge(
                        {
                            connectable: obj.entity.inletUid,
                            connection: obj.entity.uid,
                        },
                        {
                            connectable: obj.entity.outletUid,
                            connection: obj.entity.uid,
                        },
                        {
                            type: EdgeType.PLANT_THROUGH,
                            uid: obj.entity.uid,
                        }
                    );
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FIXTURE:
                case EntityType.RISER:
                    break;
                default:
                    assertUnreachable(obj.entity);
            }
        });
    }

    configureDirectedValveLUGraph(entity: DirectedValveEntity) {
        const connections = this.globalStore.getConnections(entity.uid);
        if (connections.length === 2) {
            if (entity.sourceUid === null) {
                throw new Error("directed valve with unknown direction");
            }
            if (!connections.includes(entity.sourceUid)) {
                throw new Error("directed valve with invalid direction");
            }
            const other = connections.find((uid) => uid !== entity.sourceUid)!;

            switch (entity.valve.type) {
                case ValveType.RPZD_SINGLE:
                case ValveType.RPZD_DOUBLE_ISOLATED:
                case ValveType.RPZD_DOUBLE_SHARED:
                case ValveType.CHECK_VALVE:
                    // from start to finish only
                    this.flowGraph.addDirectedEdge(
                        {
                            connectable: entity.uid,
                            connection: entity.sourceUid
                        },
                        {
                            connectable: entity.uid,
                            connection: other
                        },
                        {
                            type: EdgeType.CHECK_THROUGH,
                            uid: entity.uid
                        }
                    );
                    break;
                case ValveType.ISOLATION_VALVE:
                    // Only if it is open
                    if (!entity.valve.isClosed) {
                        this.flowGraph.addEdge(
                            {
                                connectable: entity.uid,
                                connection: entity.sourceUid
                            },
                            {
                                connectable: entity.uid,
                                connection: other
                            },
                            {
                                type: EdgeType.CHECK_THROUGH,
                                uid: entity.uid
                            }
                        );
                    }
                    break;
                case ValveType.PRESSURE_RELIEF_VALVE:
                case ValveType.WATER_METER:
                case ValveType.STRAINER:
                    this.flowGraph.addEdge(
                        {
                            connectable: entity.uid,
                            connection: entity.sourceUid
                        },
                        {
                            connectable: entity.uid,
                            connection: other
                        },
                        {
                            type: EdgeType.CHECK_THROUGH,
                            uid: entity.uid
                        }
                    );
                    break;
                default:
                    assertUnreachable(entity.valve);
            }
        } else if (connections.length > 2) {
            throw new Error("too many pipes coming out of this one");
        }
    }

    sizeRingsAndRoots(sources: FlowNode[]) {
        // For each connected component, find the total PsdUs, thus the flow rates, then distribute
        // the flow rate equally to each fixture. From these flow rates, we can then calculate the
        // flow network, and iteratively re-size the pipes.
        const leaf2PsdU = new Map<string, PsdCountEntry>();
        const flowConnectedUF = new UnionFind<string>();
        sources.forEach((s) => {
            this.flowGraph.dfs(s, (n) => {
                const psdU = this.getTerminalPsdU(n);
                if (psdU) {
                    leaf2PsdU.set(n.connectable, psdU);
                }
                flowConnectedUF.join(s.connectable, n.connectable);
            });
        });

        const demandLS = new Map<string, number>();
        const sourcesKPA = new Map<string, number>();

        sources.forEach((s) => {
            const source = this.globalStore.get(s.connectable)!;
            if (source.entity.type === EntityType.FLOW_SOURCE) {
                sourcesKPA.set(s.connectable, source.entity.pressureKPA!);
            } else {
                throw new Error("Flow coming in from an entity that isn't a source");
            }
        });

        const flowComponents = flowConnectedUF.groups();
        flowComponents.forEach((group) => {
            let totalPsdU = zeroPsdCounts();
            group.forEach((n) => {
                if (leaf2PsdU.has(n)) {
                    totalPsdU = addPsdCounts(totalPsdU, leaf2PsdU.get(n)!);
                }
            });

            let systemUid: string | undefined;
            for (const uid of group) {
                const o = this.globalStore.get(uid);
                if (o) {
                    if (isConnectableEntity(o.entity)) {
                        systemUid = determineConnectableSystemUid(this.globalStore, o.entity);
                    } else if (o.entity.type === EntityType.PIPE) {
                        systemUid = o.entity.systemUid;
                    }
                    if (systemUid) {
                        break;
                    }
                }
            }

            if (!isZeroPsdCounts(totalPsdU)) {
                if (!systemUid) {
                    throw new Error("Cannot determine system UID but we need it");
                }

                const frFromUnits = lookupFlowRate(
                    {
                        units: totalPsdU.units,
                        dwellings: 0,
                        continuousFlowLS: 0
                    },
                    this.doc,
                    this.catalog,
                    systemUid
                );

                const frFromDwellings = lookupFlowRate(
                    {
                        units: 0,
                        dwellings: totalPsdU.dwellings,
                        continuousFlowLS: 0
                    },
                    this.doc,
                    this.catalog,
                    systemUid
                );

                if (frFromUnits === null) {
                    throw new Error("Could not get flow rate from loading units");
                }
                if (frFromDwellings === null) {
                    throw new Error("Could not get flow rate from dwellings");
                }

                const perUnit = frFromUnits / totalPsdU.units;
                const perDwelling = totalPsdU.dwellings ? frFromDwellings / totalPsdU.dwellings : 0;

                group.forEach((n) => {
                    if (leaf2PsdU.has(n) && !isZeroPsdCounts(leaf2PsdU.get(n)!)) {
                        demandLS.set(
                            n,
                            perUnit * leaf2PsdU.get(n)!.units +
                                perDwelling * leaf2PsdU.get(n)!.dwellings +
                                leaf2PsdU.get(n)!.continuousFlowLS
                        );
                    }
                });
            }
        });

        // Now that we have flows, we can iteratively sizing of pipes.
        const pipesThatNeedSizing = new Set<string>();
        this.flowGraph.edgeList.forEach((e) => {
            if (e.value.type !== EdgeType.PIPE) {
                return;
            }
            const pipeObj = this.globalStore.get(e.value.uid)!;
            if (pipeObj instanceof Pipe) {
                let calculation = this.globalStore.getOrCreateCalculation(pipeObj.entity);
                if (calculation === undefined) {
                    calculation = this.globalStore.getOrCreateCalculation(pipeObj.entity);
                    const filled = fillPipeDefaultFields(this.doc.drawing, pipeObj.computedLengthM, pipeObj.entity);
                    let initialSize = lowerBoundTable(this.catalog.pipes[filled.material!].pipesBySize, 0)!;
                    if (pipeObj.entity.diameterMM) {
                        // there is a custom diameter
                        initialSize = this.getPipeByNominal(pipeObj.entity, pipeObj.entity.diameterMM)!;
                    }
                    Object.assign(calculation, {
                        peakFlowRate: null,
                        psdUnits: null,
                        optimalInnerPipeDiameterMM: null,
                        pressureDropKpa: null,
                        realInternalDiameterMM: parseCatalogNumberExact(initialSize.diameterInternalMM),
                        realNominalPipeDiameterMM: parseCatalogNumberExact(initialSize.diameterNominalMM),
                        temperatureRange: null,
                        velocityRealMS: null,
                        warning: null
                    });
                    pipesThatNeedSizing.add(pipeObj.entity.uid);
                } else if (calculation.realInternalDiameterMM === null) {
                    const filled = fillPipeDefaultFields(this.doc.drawing, pipeObj.computedLengthM, pipeObj.entity);
                    const initialSize = lowerBoundTable(this.catalog.pipes[filled.material!].pipesBySize, 0)!;

                    calculation.realInternalDiameterMM = parseCatalogNumberExact(initialSize.diameterInternalMM);
                    calculation.realNominalPipeDiameterMM = parseCatalogNumberExact(initialSize.diameterNominalMM);

                    pipesThatNeedSizing.add(pipeObj.entity.uid);
                }
            }
        });

        const solver = new FlowSolver(this.flowGraph, this.globalStore, this.doc, this.catalog);

        let iters = 0;
        while (true) {
            iters++;
            if (iters > 5) {
                break;
            }
            const assignment = solver.solveFlowsLS(demandLS, sourcesKPA);
            let changed = false;

            pipesThatNeedSizing.forEach((target) => {
                const flow = assignment.getFlow(stringify({ type: EdgeType.PIPE, uid: target }));

                // TODO: Size ring mains properly
                // But for now, just size this main by this flow.
                const pipe = this.globalStore.get(target) as Pipe;
                const calculation = this.globalStore.getOrCreateCalculation(pipe.entity);
                const oldSize = calculation.realInternalDiameterMM;
                this.sizePipeForFlowRate(pipe.entity, flow);
                const newSize = calculation.realInternalDiameterMM;

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
    sanityCheck(objectStore: ObjectStore, doc: DocumentState): boolean {
        return true;
    }

    // Returns PSD of node and correlation group ID
    getTerminalPsdU(flowNode: FlowNode): ContextualPCE | null {
        if (flowNode.connectable === FLOW_SOURCE_ROOT) {
            return null;
        }

        const node = this.globalStore.get(flowNode.connectable)!;

        if (node.type === EntityType.SYSTEM_NODE) {
            const parent = this.globalStore.get(node.entity.parentUid!);
            if (parent === undefined) {
                throw new Error("System node is missing parent. " + JSON.stringify(node));
            }
            if (parent.uid !== flowNode.connection) {
                return null;
            }
            switch (parent.type) {
                case EntityType.FIXTURE:
                    const fixture = parent.entity as FixtureEntity;
                    const mainFixture = fillFixtureFields(this.doc.drawing, this.catalog, fixture);

                    for (const suid of fixture.roughInsInOrder) {
                        if (node.uid === fixture.roughIns[suid].uid) {
                            if (isGermanStandard(this.doc.drawing.metadata.calculationParams.psdMethod)) {
                                return {
                                        units: Number(mainFixture.roughIns[suid].designFlowRateLS),
                                        continuousFlowLS: mainFixture.roughIns[suid].continuousFlowLS!,
                                        dwellings: 0,
                                        entity: node.entity.uid,
                                        correlationGroup: fixture.uid,
                                    };

                            } else {
                                return {
                                        units: Number(mainFixture.roughIns[suid].loadingUnits),
                                        continuousFlowLS: mainFixture.roughIns[suid].continuousFlowLS!,
                                        dwellings: 0,
                                        entity: node.entity.uid,
                                        correlationGroup: fixture.uid,
                                    };
                            }
                        }
                    }
                    throw new Error("Invalid connection to fixture");
                case EntityType.LOAD_NODE:
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.RISER:
                case EntityType.FLOW_SOURCE:
                case EntityType.RETURN:
                case EntityType.PIPE:
                case EntityType.FITTING:
                case EntityType.PLANT:
                case EntityType.BIG_VALVE:
                case EntityType.SYSTEM_NODE:
                case EntityType.DIRECTED_VALVE:
                    return zeroContextualPCE(node.entity.uid, node.entity.uid);
                default:
            }
            assertUnreachable(parent.type);
            // Sadly, typescript type checking for return value was not smart enough to avoid these two lines.
            throw new Error("parent type is not a correct value");
        } else if (node.entity.type === EntityType.LOAD_NODE) {
            switch (node.entity.node.type) {
                case NodeType.LOAD_NODE:
                    if (isGermanStandard(this.doc.drawing.metadata.calculationParams.psdMethod)) {
                        return {
                                units: node.entity.node.designFlowRateLS,
                                continuousFlowLS: node.entity.node.continuousFlowLS,
                                dwellings: 0,
                                entity: node.entity.uid,
                                correlationGroup: node.entity.uid,
                            };
                    } else {
                        return {
                                units: node.entity.node.loadingUnits,
                                continuousFlowLS: node.entity.node.continuousFlowLS,
                                dwellings: 0,
                                entity: node.entity.uid,
                                correlationGroup: node.entity.uid,
                            };
                    }
                case NodeType.DWELLING:
                    return {
                            units: 0,
                            continuousFlowLS: 0,
                            dwellings: node.entity.node.dwellings,
                            entity: node.entity.uid,
                            correlationGroup: node.entity.uid,
                        };
                default:
            }
            assertUnreachable(node.entity.node);
            throw new Error("invalid node type");
        } else {
            return zeroContextualPCE(node.entity.uid, node.entity.uid);
        }
    }

    configureEntityForPSD(entity: DrawableEntityConcrete, psdU: PsdCountEntry, flowEdge: FlowEdge) {
        switch (entity.type) {
            case EntityType.PIPE: {
                const calculation = this.globalStore.getOrCreateCalculation(entity);
                calculation.psdUnits = psdU;

                const flowRate = lookupFlowRate(psdU, this.doc, this.catalog, entity.systemUid);

                if (flowRate === null) {
                    // Warn for no PSD
                    if (isZeroPsdCounts(psdU)) {
                        this.sizePipeForFlowRate(entity, 0);
                    }
                } else {
                    this.sizePipeForFlowRate(entity, flowRate);
                }

                return;
            }
            case EntityType.BIG_VALVE: {
                const calculation = this.globalStore.getOrCreateCalculation(entity);

                const systemUid =
                    flowEdge.type === EdgeType.BIG_VALVE_COLD_COLD
                        ? StandardFlowSystemUids.ColdWater
                        : StandardFlowSystemUids.HotWater;
                const flowRate = lookupFlowRate(psdU, this.doc, this.catalog, systemUid);

                if (entity.valve.type === BigValveType.RPZD_HOT_COLD && flowRate !== null) {
                    if (flowEdge.type === EdgeType.BIG_VALVE_HOT_HOT) {
                        calculation.rpzdSizeMM![StandardFlowSystemUids.HotWater] = this.sizeRpzdForFlowRate(
                            entity.valve.catalogId,
                            ValveType.RPZD_SINGLE,
                            flowRate
                        );
                    } else if (flowEdge.type === EdgeType.BIG_VALVE_COLD_COLD) {
                        calculation.rpzdSizeMM![StandardFlowSystemUids.ColdWater] = this.sizeRpzdForFlowRate(
                            entity.valve.catalogId,
                            ValveType.RPZD_SINGLE,
                            flowRate
                        );
                    } else {
                        throw new Error("Invalid edge on hot-cold RPZD");
                    }
                }

                if (flowEdge.type === EdgeType.BIG_VALVE_COLD_COLD) {
                    calculation.coldPsdUs = psdU;
                    calculation.coldPeakFlowRate = flowRate;
                } else if (
                    flowEdge.type === EdgeType.BIG_VALVE_HOT_WARM ||
                    flowEdge.type === EdgeType.BIG_VALVE_HOT_HOT
                ) {
                    calculation.hotPsdUs = psdU;
                    calculation.hotPeakFlowRate = flowRate;
                } else {
                    throw new Error("invalid edge in TMV");
                }

                return;
            }
            case EntityType.LOAD_NODE:
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.RISER:
            case EntityType.FLOW_SOURCE:
            case EntityType.FITTING:
            case EntityType.PLANT:
            case EntityType.DIRECTED_VALVE:
            case EntityType.SYSTEM_NODE:
            case EntityType.FIXTURE:
                throw new Error("Cannot configure this entity to accept loading units");
            default:
                assertUnreachable(entity);
        }
    }

    sizePipeForFlowRate(pipe: PipeEntity, flowRateLS: number) {
        const cpipe = fillPipeDefaultFields(this.doc.drawing, 0, pipe);

        // apply spare capacity
        const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === cpipe.systemUid!);
        const rawFlowRate = flowRateLS;
        if (system) {
            flowRateLS = flowRateLS * (1 + system.networks[pipe.network].spareCapacityPCT / 100);
        }

        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        calculation.peakFlowRate = flowRateLS;
        calculation.rawPeakFlowRate = rawFlowRate;

        let page: PipeSpec | null = null;

        calculation.optimalInnerPipeDiameterMM = this.calculateInnerDiameter(pipe);
        if (pipe.diameterMM === null) {
            page = this.getRealPipe(pipe);
        } else {
            calculation.realNominalPipeDiameterMM = pipe.diameterMM;
            page = this.getPipeByNominal(pipe, pipe.diameterMM);
        }
        if (!page) {
            page = this.getBiggestPipe(pipe);
        }
        calculation.realNominalPipeDiameterMM = parseCatalogNumberExact(page!.diameterNominalMM);
        calculation.realInternalDiameterMM = parseCatalogNumberExact(page!.diameterInternalMM);

        if (calculation.realNominalPipeDiameterMM) {
            calculation.velocityRealMS = this.getVelocityRealMs(pipe);

            calculation.pressureDropKpa = head2kpa(
                this.getPipePressureDropMH(pipe),
                getFluidDensityOfSystem(pipe.systemUid, this.doc, this.catalog)!,
                this.ga
            );
        }
    }

    calculateInnerDiameter(pipe: PipeEntity): number {
        const computed = fillPipeDefaultFields(this.doc.drawing, 0, pipe);

        const calculation = this.globalStore.getOrCreateCalculation(pipe);

        // depends on pipe sizing method
        if (this.doc.drawing.metadata.calculationParams.pipeSizingMethod === "velocity") {
            // http://www.1728.org/flowrate.htm
            return Math.sqrt((4000 * calculation.peakFlowRate!) / (Math.PI * computed.maximumVelocityMS!));
        } else {
            throw new Error("Pipe sizing strategy not supported");
        }
    }

    getPipePressureDropMH(pipe: PipeEntity): number {
        const obj = this.globalStore.get(pipe.uid) as Pipe;
        const filled = fillPipeDefaultFields(this.doc.drawing, obj.computedLengthM, pipe);

        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        const realPipe = lowerBoundTable(
            this.catalog.pipes[filled.material!].pipesBySize,
            calculation.realInternalDiameterMM!
        )!;

        const roughness = parseCatalogNumberExact(realPipe.colebrookWhiteCoefficient);
        const realInternalDiameter = parseCatalogNumberExact(realPipe.diameterInternalMM);

        const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === pipe.systemUid)!;

        const fluidDensity = parseCatalogNumberExact(this.catalog.fluids[system.fluid].densityKGM3);
        const dynamicViscosity = parseCatalogNumberExact(
            interpolateTable(
                this.catalog.fluids[system.fluid].dynamicViscosityByTemperature,
                system.temperature // TOOD: Use pipe's temperature
            )
        );

        return getDarcyWeisbachMH(
            getFrictionFactor(
                realInternalDiameter!,
                roughness!,
                getReynoldsNumber(fluidDensity!, calculation.velocityRealMS!, realInternalDiameter!, dynamicViscosity!)
            ),
            calculation.lengthM!,
            realInternalDiameter!,
            calculation.velocityRealMS!,
            this.ga
        );
    }

    getVelocityRealMs(pipe: PipeEntity) {
        // http://www.1728.org/flowrate.htm

        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        return (
            (4000 * calculation.peakFlowRate!) /
            (Math.PI * parseCatalogNumberExact(calculation.realInternalDiameterMM)! ** 2)
        );
    }

    getPipeByNominal(pipe: PipeEntity, maxNominalMM: number): PipeSpec | null {
        const pipeFilled = fillPipeDefaultFields(this.doc.drawing, 0, pipe);
        const table = this.catalog.pipes[pipeFilled.material!];

        const a = upperBoundTable(table.pipesBySize, maxNominalMM, (p, isMax) => {
            if (isMax) {
                return parseCatalogNumberOrMax(p.diameterNominalMM)!;
            } else {
                return parseCatalogNumberOrMin(p.diameterNominalMM)!;
            }
        });
        if (!a) {
            // Todo: Warn No pipe big enough
            return null;
        } else {
            return a;
        }
    }

    getRealPipe(pipe: PipeEntity): PipeSpec | null {
        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        const pipeFilled = fillPipeDefaultFields(this.doc.drawing, 0, pipe);
        const table = this.catalog.pipes[pipeFilled.material!];

        if (!table) {
            throw new Error("Material doesn't exist anymore " + JSON.stringify(pipeFilled));
        }

        const a = lowerBoundTable(table.pipesBySize, calculation.optimalInnerPipeDiameterMM!, (p) => {
            const v = parseCatalogNumberExact(p.diameterInternalMM);
            if (!v) {
                throw new Error("no nominal diameter");
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
        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        const pipeFilled = fillPipeDefaultFields(this.doc.drawing, 0, pipe);
        const table = this.catalog.pipes[pipeFilled.material!];

        if (!table) {
            throw new Error("Material doesn't exist anymore " + JSON.stringify(pipeFilled));
        }

        const a = upperBoundTable(table.pipesBySize, Infinity, (p) => {
            const v = parseCatalogNumberExact(p.diameterInternalMM);
            if (!v) {
                throw new Error("no nominal diameter");
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

    calculateDefiniteLoads(roots: FlowNode[]) {
        // N = edges + vertices, S = sources, T = sinks (or fixtures).
        // 1. Create a strictly directed graph from the mixed-directed one, sourced by roots. This creates a DAG.
        // 2. For every edge, record the set of all roots with flow into them. O(N*S)
        // 3. Backtrack the graph, to record the sets of loads that each edge flow into. O(N*T)
        // 4. For each edge, check all its fixtures to see if any of them are supplied by sources that don't supply
        //    that edge. If there are AND by removing them, it decreases the flow rate, then it is ambiguous. O(N*T).
    }

    sizeDefiniteTransports() {
        const totalReachedPsdU = this.globalReachedPsdUs;

        // Size all pipes first
        this.networkObjects().forEach((object) => {
            switch (object.entity.type) {
                case EntityType.BIG_VALVE:
                    switch (object.entity.valve.type) {
                        case BigValveType.TMV:
                            this.sizeDefiniteTransport(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_HOT_WARM, uid: object.uid },
                                [object.entity.hotRoughInUid, object.entity.valve.warmOutputUid]
                            );
                            this.sizeDefiniteTransport(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_COLD_COLD, uid: object.uid },
                                [object.entity.coldRoughInUid, object.entity.valve.coldOutputUid]
                            );
                            break;
                        case BigValveType.TEMPERING:
                            this.sizeDefiniteTransport(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_HOT_WARM, uid: object.uid },
                                [object.entity.hotRoughInUid, object.entity.valve.warmOutputUid]
                            );
                            break;
                        case BigValveType.RPZD_HOT_COLD:
                            this.sizeDefiniteTransport(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_COLD_COLD, uid: object.uid },
                                [object.entity.coldRoughInUid, object.entity.valve.coldOutputUid]
                            );
                            this.sizeDefiniteTransport(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_HOT_HOT, uid: object.uid },
                                [object.entity.hotRoughInUid, object.entity.valve.hotOutputUid]
                            );
                            break;
                        default:
                            assertUnreachable(object.entity.valve);
                    }
                    break;
                case EntityType.PIPE:
                    if (object.entity.endpointUid[0] === null || object.entity.endpointUid[1] === null) {
                        throw new Error("pipe has dry endpoint: " + object.entity.uid);
                    }
                    this.sizeDefiniteTransport(
                        object,
                        totalReachedPsdU,
                        { type: EdgeType.PIPE, uid: object.uid },
                        [object.entity.endpointUid[0], object.entity.endpointUid[1]]
                    );
                    break;
                case EntityType.DIRECTED_VALVE:
                case EntityType.LOAD_NODE:
                case EntityType.FLOW_SOURCE:
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FITTING:
                case EntityType.PLANT:
                case EntityType.RISER:
                case EntityType.SYSTEM_NODE:
                case EntityType.FIXTURE:
                    break;
                default:
                    assertUnreachable(object.entity);
            }
        });

        // Now size RPZD's, based on pipe peak flow rates
        this.networkObjects().forEach((obj) => {
            switch (obj.entity.type) {
                case EntityType.DIRECTED_VALVE:
                    const conns = this.globalStore.getConnections(obj.entity.uid);
                    switch (obj.entity.valve.type) {
                        case ValveType.RPZD_SINGLE:
                        case ValveType.RPZD_DOUBLE_SHARED:
                        case ValveType.RPZD_DOUBLE_ISOLATED:
                            if (conns.length === 2) {
                                const p = this.globalStore.get(conns[0]) as Pipe;
                                const pCalc = this.globalStore.getOrCreateCalculation(p.entity);

                                if (pCalc.peakFlowRate !== null) {
                                    const size = this.sizeRpzdForFlowRate(
                                        obj.entity.valve.catalogId,
                                        obj.entity.valve.type,
                                        pCalc.peakFlowRate
                                    );
                                    if (size !== null) {
                                        const calc = this.globalStore.getOrCreateCalculation(obj.entity);
                                        calc.sizeMM = size;
                                    }
                                }
                            }
                            break;
                        case ValveType.CHECK_VALVE:
                        case ValveType.ISOLATION_VALVE:
                        case ValveType.PRESSURE_RELIEF_VALVE:
                        case ValveType.WATER_METER:
                        case ValveType.STRAINER:
                            break;
                        default:
                            assertUnreachable(obj.entity.valve);
                    }
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FITTING:
                case EntityType.PIPE:
                case EntityType.RISER:
                case EntityType.SYSTEM_NODE:
                case EntityType.BIG_VALVE:
                case EntityType.FIXTURE:
                case EntityType.LOAD_NODE:
                    break;
            }
        });
    }

    sizeRpzdForFlowRate(
        catalogId: string,
        type: ValveType.RPZD_SINGLE | ValveType.RPZD_DOUBLE_ISOLATED | ValveType.RPZD_DOUBLE_SHARED,
        fr: number
    ): number | null {
        if (type === ValveType.RPZD_DOUBLE_SHARED) {
            fr = fr / 2;
        }
        const entry = lowerBoundTable(
            this.catalog.backflowValves[catalogId].valvesBySize,
            fr,
            (t, m) => parseCatalogNumberExact(m ? t.maxFlowRateLS : t.minFlowRateLS)!
        );

        if (entry) {
            return parseCatalogNumberExact(entry.sizeMM);
        }
        return null;
    }

    sizeDefiniteTransport(
        object: BaseBackedObject,
        totalReachedPsdU: PsdProfile,
        flowEdge: FlowEdge,
        endpointUids: string[]
    ) {
        if (flowEdge.uid !== object.uid) {
            throw new Error("invalid args");
        }

        const exclusiveProfile = this.getExcludedPsdUs(flowEdge);

        if (exclusiveProfile === false) {
            // No flow source.
            this.configureEntityForPSD(object.entity, zeroPsdCounts(), flowEdge);
        } else {
            const exclusivePsdU = countPsdProfile(exclusiveProfile);


            const wet = this.firstWet.get(stringify(flowEdge))!;
            const dryUids = endpointUids.filter((ep) => ep !== wet.connectable);
            if (dryUids.length !== 1) {
                throw new Error('dry is neigh');
            }
            const dryUid = dryUids[0];

            const residualPsdProfile = this.getDownstreamPsdUs(
                [{ connectable: dryUid, connection: object.uid }],
                [],
                [stringify(flowEdge)]
            );
            const residualPsdU = countPsdProfile(residualPsdProfile);

            if (!isZeroPsdCounts(exclusivePsdU)) {

                const cmp = comparePsdCounts(residualPsdU, exclusivePsdU);
                if (cmp === null) {
                    throw new Error("Impossible PSD situation");
                }
                if (cmp > 0) {
                    // TODO: Info that flow rate is ambiguous, but some flow is exclusive to us
                } else {
                    if (cmp < 0) {
                        throw new Error("Invalid PSD situation");
                    }
                    // we have successfully calculated the pipe's loading units.
                    this.configureEntityForPSD(object.entity, exclusivePsdU, flowEdge);
                }
            } else {
                if (isZeroPsdCounts(residualPsdU)) {
                    this.configureEntityForPSD(object.entity, zeroPsdCounts(), flowEdge);
                } else {
                    // TODO: flow rate is ambiguous, and no flow is exclusive to us.
                }
            }
        }
    }

    fillPressureDropFields() {
        for (const o of this.networkObjects()) {
            switch (o.entity.type) {
                case EntityType.BIG_VALVE: {
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);

                    switch (o.entity.valve.type) {
                        case BigValveType.TMV: {
                            const fr = calculation.coldPeakFlowRate;
                            if (fr !== null) {
                                const hl = o.getFrictionHeadLoss(
                                    this,
                                    fr,
                                    { connection: o.uid, connectable: o.entity.coldRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.coldOutputUid },
                                    true
                                );
                                calculation.outputs[StandardFlowSystemUids.ColdWater].pressureDropKPA =
                                    hl === null
                                        ? hl
                                        : head2kpa(
                                        hl,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.ColdWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga
                                        );
                            }
                        }
                        /* fall through */
                        case BigValveType.TEMPERING: {
                            const frw = calculation.hotPeakFlowRate;
                            if (frw !== null) {
                                const hl = o.getFrictionHeadLoss(
                                    this,
                                    frw,
                                    { connection: o.uid, connectable: o.entity.hotRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.warmOutputUid },
                                    true
                                );
                                calculation.outputs[StandardFlowSystemUids.WarmWater].pressureDropKPA =
                                    hl === null
                                        ? null
                                        : head2kpa(
                                        hl,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.WarmWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga
                                        );
                            }
                            break;
                        }
                        case BigValveType.RPZD_HOT_COLD: {
                            const fr = calculation.coldPeakFlowRate;
                            if (fr !== null) {
                                const hl = o.getFrictionHeadLoss(
                                    this,
                                    fr,
                                    { connection: o.uid, connectable: o.entity.coldRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.coldOutputUid },
                                    true
                                );
                                calculation.outputs[StandardFlowSystemUids.ColdWater].pressureDropKPA =
                                    hl === null
                                        ? hl
                                        : head2kpa(
                                        hl,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.ColdWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga
                                        );
                            }

                            const frh = calculation.hotPeakFlowRate;
                            if (frh !== null) {
                                const hl = o.getFrictionHeadLoss(
                                    this,
                                    frh,
                                    { connection: o.uid, connectable: o.entity.hotRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.hotOutputUid },
                                    true
                                );
                                calculation.outputs[StandardFlowSystemUids.HotWater].pressureDropKPA =
                                    hl === null
                                        ? hl
                                        : head2kpa(
                                        hl,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.HotWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga
                                        );
                            }
                            break;
                        }
                    }

                    break;
                }
                case EntityType.PIPE: {
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);
                    if (calculation.peakFlowRate !== null) {
                        const hl = o.getFrictionHeadLoss(
                            this,
                            calculation.peakFlowRate,
                            { connection: o.uid, connectable: o.entity.endpointUid[0] },
                            { connection: o.uid, connectable: o.entity.endpointUid[1] },
                            true
                        );
                        calculation.pressureDropKpa =
                            hl === null
                                ? null
                                : head2kpa(
                                hl,
                                getFluidDensityOfSystem(
                                    StandardFlowSystemUids.ColdWater,
                                    this.doc,
                                    this.catalog
                                )!,
                                this.ga
                                );
                    }
                    break;
                }
                case EntityType.FITTING:
                case EntityType.LOAD_NODE:
                case EntityType.DIRECTED_VALVE: {
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity) as
                        | FittingCalculation
                        | SystemNodeCalculation
                        | DirectedValveCalculation;
                    const connections = this.globalStore.getConnections(o.entity.uid);

                    if (connections.length === 2) {
                        const p1 = this.globalStore.get(connections[0])!;
                        const p2 = this.globalStore.get(connections[1])!;
                        if (p1 instanceof Pipe && p2 instanceof Pipe) {
                            const pipeCalc1 = this.globalStore.getOrCreateCalculation(p1.entity);
                            const pipeCalc2 = this.globalStore.getOrCreateCalculation(p2.entity);
                            if (pipeCalc1!.peakFlowRate !== null && pipeCalc2!.peakFlowRate !== null) {
                                calculation.flowRateLS = Math.min(pipeCalc1!.peakFlowRate, pipeCalc2!.peakFlowRate);

                                const hl1 = o.getFrictionHeadLoss(
                                    this,
                                    calculation.flowRateLS,
                                    { connectable: o.uid, connection: connections[0] },
                                    { connectable: o.uid, connection: connections[1] },
                                    true
                                );
                                const dir1 =
                                    hl1 === null
                                        ? null
                                        : head2kpa(
                                        hl1,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.ColdWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga
                                        );
                                const hl2 = o.getFrictionHeadLoss(
                                    this,
                                    calculation.flowRateLS,
                                    { connectable: o.uid, connection: connections[1] },
                                    { connectable: o.uid, connection: connections[0] },
                                    true
                                );
                                const dir2 =
                                    hl2 === null
                                        ? null
                                        : head2kpa(
                                        hl2,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.ColdWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga
                                        );
                                if (dir1 === null || dir2 === null) {
                                    (calculation as any).pressureDropKPA = null;
                                } else {
                                    (calculation as any).pressureDropKPA = Math.min(dir1, dir2);
                                }
                            }
                        }
                    }
                    break;
                }
                case EntityType.SYSTEM_NODE:
                case EntityType.FLOW_SOURCE: {
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity) as
                        FlowSourceCalculation | SystemNodeCalculation;

                    const conns = this.globalStore.getConnections(o.entity.uid);

                    calculation.flowRateLS = 0;
                    for (const conn of conns) {
                        const p = this.globalStore.get(conn) as Pipe
                        const pCalc = this.globalStore.getOrCreateCalculation(p.entity);
                        if (pCalc.peakFlowRate) {
                            calculation.flowRateLS += pCalc.peakFlowRate;
                        }
                    }

                    if (o.entity.type === EntityType.SYSTEM_NODE) {
                        const sc = calculation as SystemNodeCalculation;

                        sc.psdUnits = this.getTerminalPsdU(
                            { connectable: o.entity.uid, connection: o.entity.parentUid! }
                        );
                    }
                    break;
                }
                case EntityType.PLANT: {
                    const calc = this.globalStore.getOrCreateCalculation(o.entity);
                    if (o.entity.pumpPressureKPA === null) {
                        calc.pressureDropKPA = o.entity.pressureLossKPA || 0;
                    } else {
                        calc.pressureDropKPA = -o.entity.pumpPressureKPA;
                    }
                    break;
                }
                case EntityType.FIXTURE:
                case EntityType.RISER:
                case EntityType.BACKGROUND_IMAGE:
                    break;
                default:
                    assertUnreachable(o.entity);
            }
        }
    }

    createWarnings() {
        for (const o of this.networkObjects()) {
            switch (o.entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    break;
                case EntityType.FITTING:
                    break;
                case EntityType.PIPE:
                    break;
                case EntityType.FLOW_SOURCE:
                    break;
                case EntityType.SYSTEM_NODE:
                    break;
                case EntityType.BIG_VALVE:
                    break;
                case EntityType.FIXTURE:
                    const e = fillFixtureFields(this.doc.drawing, this.catalog, o.entity);
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);

                    for (const suid of e.roughInsInOrder) {
                        if ((calculation.pressures[suid] || 0) < e.roughIns[suid].minPressureKPA!) {
                            const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === suid)!;
                            calculation.warning =
                                "Not enough " +
                                system.name +
                                " pressure. Required: " +
                                e.roughIns[suid].minPressureKPA!.toFixed(0) +
                                " kPa";
                        } else if ((calculation.pressures[suid] || 0) > e.roughIns[suid].maxPressureKPA!) {
                            const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === suid)!;
                            calculation.warning =
                                system.name +
                                " pressure overload. Max: " +
                                e.roughIns[suid].maxPressureKPA!.toFixed(0) +
                                " kPa";
                        }
                    }
                    break;
                case EntityType.DIRECTED_VALVE:
                case EntityType.RISER:
                case EntityType.PLANT:
                case EntityType.LOAD_NODE:
                    break;
                default:
                    assertUnreachable(o.entity);
            }
        }
    }

    serializeDirectedEdge(edge: Edge<FlowNode | undefined, FlowEdge | undefined>, dst: FlowNode) {
        return dst.connection + ' ' + dst.connectable + ' ' + edge.uid;
    }

    precomputePsdAfterBridge(
        bridge: Edge<FlowNode | undefined, FlowEdge | undefined>,
        dst: FlowNode,
        visitedEdges: Set<string>,
    ): PsdProfile {

        const key = this.serializeDirectedEdge(bridge, dst);
        const visited = new Set<string>();

        visitedEdges.add(bridge.uid);

        if (!this.psdAfterBridgeCache.has(key)) {
            const retVal = new PsdProfile();
            this.flowGraph.dfs(
                dst,
                (node) => {
                    const res = this.getTerminalPsdU(node);
                    if (res) {
                        insertPsdProfile(retVal, res);
                    }
                },
                undefined,
                (edge) => {
                    if (this.allBridges.has(edge.uid)) {
                        const res = this.precomputePsdAfterBridge(edge, edge.to, visitedEdges);
                        for (const r of res.values()) {
                            // this can potentially be faster with immutable inplace, like in OCaml
                            insertPsdProfile(retVal, r);
                        }
                        return true;
                    }
                },
                undefined,
                visited,
                visitedEdges,
                true,
                false,
            );
            this.psdAfterBridgeCache.set(key, retVal);
        }


        visitedEdges.delete(bridge.uid);
        return this.psdAfterBridgeCache.get(key)!;
    }

    getExcludedPsdUs(excludedEdge: FlowEdge): PsdProfile | false {
        const key = stringify(excludedEdge);
        if (this.parentBridgeOfWetEdge.has(key)) {
            if (this.allBridges.has(key)) {
                const visitedEdges = new Set<string>();
                return this.precomputePsdAfterBridge(this.allBridges.get(key)!, this.secondWet.get(key)!, visitedEdges);
            }

            const start = this.parentBridgeOfWetEdge.get(key)!;
            const visitedEdges = new Set<string>([start.uid, key]);

            const inThisGroup = new PsdProfile();
            const seenBridges = new Set<string>();

            this.flowGraph.dfs(
                start.to!,
                (n) => {
                    const units = this.getTerminalPsdU(n);
                    if (units) {
                        insertPsdProfile(inThisGroup, units);
                    }
                },
                undefined,
                (e) => {
                    if (this.allBridges.has(e.uid)) {
                        seenBridges.add(e.uid);
                        return true;
                    }
                },
                undefined,
                undefined,
                visitedEdges,
                true,
                false,
            );

            const excludedProfile = new PsdProfile();
            const existing = this.psdProfileWithinGroup.get(start.uid)!;
            for (const f of existing.values()) {
                insertPsdProfile(excludedProfile, f);
            }
            subtractPsdProfiles(excludedProfile, inThisGroup);

            for (const child of this.childBridges.get(start.uid)!) {
                if (!seenBridges.has(child.uid)) {
                    console.log('we are ' + JSON.stringify(excludedEdge) + ' and we are missing bridge ' + JSON.stringify(child));
                    const cpsd = this.psdAfterBridgeCache.get(this.serializeDirectedEdge(child, child.to))!;
                    for (const f of cpsd.values()) {
                        insertPsdProfile(excludedProfile, f);
                    }
                }
            }
            console.log(excludedProfile);
            return excludedProfile;
        } else {
            // there was no flow to this edge anyway.
            console.log('false');
            return false;
        }
    }

    // This will be correct, with the bridge group cache optimization, as long as the excluded nodes and excluded
    // edges are in the same bi-connected component. If not, then this function will use the cache to potentially fetch
    // results from groups that would have changed if the nodes or edges were excluded.
    getDownstreamPsdUs(
        starts: FlowNode[],
        excludedNodes: string[] = [],
        excludedEdges: string[] = []
    ): PsdProfile {
        const seen = new Set<string>(excludedNodes);
        const seenEdges = new Set<string>(excludedEdges);

        const psdUs = new PsdProfile();

        for (const r of starts) {
            this.flowGraph.dfs(
                r,
                (n) => {
                    const thisTerminal = this.getTerminalPsdU(n);
                    if (thisTerminal) {
                        insertPsdProfile(psdUs, thisTerminal);
                    }
                },
                undefined,
                (e) => {
                    if (this.allBridges.has(e.uid)) {
                        const result = this.precomputePsdAfterBridge(e, e.to, seenEdges);
                        for (const r of result.values()) {
                            insertPsdProfile(psdUs, r);
                        }
                        return true;
                    }
                },
                undefined,
                seen,
                seenEdges
            );
        }

        return psdUs;
    }
}
