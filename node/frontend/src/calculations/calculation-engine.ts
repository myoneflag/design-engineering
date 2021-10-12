import { NetworkType, SelectedMaterialManufacturer } from './../../../common/src/api/document/drawing';
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
import {CalculationContext, PressurePushMode} from "../../src/calculations/types";
import Graph, {Edge} from "../../src/calculations/graph";
import EquationEngine from "../../src/calculations/equation-engine";
import BaseBackedObject from "../../src/htmlcanvas/lib/base-backed-object";
import Pipe from "../../src/htmlcanvas/objects/pipe";
import {
    getDarcyWeisbachMH,
    getFluidDensityOfSystem,
    getFrictionFactor,
    getReynoldsNumber,
    head2kpa
} from "../../src/calculations/pressure-drops";
import {PropertyField, ChoiceField, FieldType} from "../../../common/src/api/document/entities/property-field";
import {MainEventBus} from "../../src/store/main-event-bus";
import {getObjectFrictionHeadLoss} from "../../src/calculations/entity-pressure-drops";
import {DrawableEntityConcrete, isConnectableEntity} from "../../../common/src/api/document/entities/concrete-entity";
import BigValve from "../htmlcanvas/objects/big-valve/bigValve";
// tslint:disable-next-line:max-line-length
import DirectedValveEntity, {makeDirectedValveFields} from "../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import {ValveType} from "../../../common/src/api/document/entities/directed-valves/valve-types";
import {
    addCosts,
    addPsdCounts,
    compareWaterPsdCounts,
    ContextualPCE,
    countPsdProfile,
    FinalPsdCountEntry,
    insertPsdProfile,
    isZeroWaterPsdCounts,
    lookupFlowRate,
    PsdProfile,
    subtractPsdProfiles,
    zeroContextualPCE,
    zeroCost,
    zeroFinalPsdCounts,
    zeroPsdCounts,
} from "../../src/calculations/utils";
import FittingCalculation from "../../src/store/document/calculations/fitting-calculation";
import DirectedValveCalculation from "../../src/store/document/calculations/directed-valve-calculation";
import SystemNodeCalculation from "../../src/store/document/calculations/system-node-calculation";
import {isCalculated} from "../store/document/calculations";
import DrawableObjectFactory from "../htmlcanvas/lib/drawable-object-factory";
import {Calculated} from "../htmlcanvas/lib/object-traits/calculated-object";
import stringify from "json-stable-stringify";
import {makeLoadNodesFields, NodeType} from "../../../common/src/api/document/entities/load-node-entity";
import {GlobalStore} from "../htmlcanvas/lib/global-store";
import {ObjectStore} from "../htmlcanvas/lib/object-store";
import {makeFlowSourceFields} from "../../../common/src/api/document/entities/flow-source-entity";
import FlowSourceCalculation from "../store/document/calculations/flow-source-calculation";
import {fillPlantDefaults, makePlantEntityFields} from "../../../common/src/api/document/entities/plants/plant-entity";
import Plant from "../htmlcanvas/objects/plant";
import {
    assertUnreachable,
    isDrainage,
    isGermanStandard,
    StandardFlowSystemUids,
    SupportedDrainageMethods,
    SupportedPsdStandards
} from "../../../common/src/api/config";
import {Catalog, PipeSpec} from "../../../common/src/api/catalog/types";
import {DrawingState} from "../../../common/src/api/document/drawing";
import {
    cloneSimple,
    interpolateTable,
    lowerBoundTable,
    parseCatalogNumberExact,
    parseCatalogNumberOrMax,
    parseCatalogNumberOrMin,
    upperBoundTable
} from "../../../common/src/lib/utils";
import {determineConnectableSystemUid} from "../store/document/entities/lib";
import {getPropertyByString} from "../lib/utils";
import {flowSystemsFlowTogether, getPlantPressureLossKPA} from "../htmlcanvas/lib/utils";
import {RingMainCalculator} from "./ring-main-calculator";
import {Configuration, NoFlowAvailableReason} from "../store/document/calculations/pipe-calculation";
import {
    identifyReturns,
    MINIMUM_BALANCING_VALVE_PRESSURE_DROP_KPA,
    returnBalanceValves,
    returnFlowRates
} from "./returns";
import DirectedValve from "../htmlcanvas/objects/directed-valve";
import SystemNode from "../htmlcanvas/objects/big-valve/system-node";
import Fixture from "../htmlcanvas/objects/fixture";
import LoadNodeCalculation from "../store/document/calculations/load-node-calculation";
import {fillDefaultLoadNodeFields} from "../store/document/entities/fillDefaultLoadNodeFields";
import {PriceTable} from "../../../common/src/api/catalog/price-table";
import {makeGasApplianceFields} from "../../../common/src/api/document/entities/gas-appliance";
import {calculateGas} from "./gas";
import {PlantType, ReturnSystemPlant} from "../../../common/src/api/document/entities/plants/plant-types";
import {NodeProps} from '../../../common/src/models/CustomEntity';
import {processDrainage, sizeDrainagePipe} from "./drainage";
import { convertMeasurementSystem, convertMeasurementToMetric, Units } from "../../../common/src/lib/measurements";

export const FLOW_SOURCE_EDGE = "FLOW_SOURCE_EDGE";
export const FLOW_SOURCE_ROOT = "FLOW_SOURCE_ROOT";
export const FLOW_SOURCE_ROOT_NODE: FlowNode = { connectable: FLOW_SOURCE_ROOT, connection: FLOW_SOURCE_EDGE };
export const FLOW_SOURCE_ROOT_BRIDGE: Edge<FlowNode | undefined, undefined> = {
    from: undefined,
    to: FLOW_SOURCE_ROOT_NODE,
    value: undefined,
    uid: "FLOW_SOURCE_ROOT_BRIDGE",
    isDirected: true,
    isReversed: false
};

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
    BALANCING_THROUGH,

    PLANT_THROUGH,
    RETURN_PUMP,
}

export interface FlowEdge {
    type: EdgeType;
    uid: string;
}

export interface FlowNode {
    connection: string;
    connectable: string;
}

export default class CalculationEngine implements CalculationContext {
    globalStore!: GlobalStore;
    networkObjectUids!: string[];
    drawableObjectUids!: string[];

    doc!: DocumentState;
    flowGraph!: Graph<FlowNode, FlowEdge>;
    equationEngine!: EquationEngine;
    catalog!: Catalog;
    drawing!: DrawingState;
    ga!: number;
    nodes!: NodeProps[];

    entityMaxPressuresKPA = new Map<string, number | null>();
    nodePressureKPA = new Map<string, number | null>();
    entityStaticPressureKPA = new Map<string, number | null>();
    nodeStaticPressureKPA = new Map<string, number | null>();
    allBridges = new Map<string, Edge<FlowNode, FlowEdge>>();
    psdAfterBridgeCache = new Map<string, PsdProfile>();
    parentBridgeOfWetEdge = new Map<string, Edge<FlowNode | undefined, FlowEdge | undefined>>();
    globalReachedPsdUs = new PsdProfile();
    firstWet = new Map<string, FlowNode>();
    secondWet = new Map<string, FlowNode>();

    psdProfileWithinGroup = new Map<string, PsdProfile>();
    childBridges = new Map<string, Array<Edge<FlowNode, FlowEdge>>>();

    priceTable: PriceTable;
    combineLUs: boolean;

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
        done: (success: boolean) => void,
        priceTable: PriceTable,
        nodes: NodeProps[],
    ) {
        this.networkObjectUids = [];
        this.drawableObjectUids = [];
        this.globalStore = objectStore;
        this.priceTable = priceTable;
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
        this.drawing = this.doc.drawing;
        this.ga = this.doc.drawing.metadata.calculationParams.gravitationalAcceleration;
        this.nodes = nodes;
        this.combineLUs = doc.drawing.metadata.calculationParams.combineLUs;

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
                    fields = makeValveFields([]);
                    break;
                case EntityType.GAS_APPLIANCE:
                    fields = makeGasApplianceFields(this.doc.drawing, obj.entity);
                    break;
                case EntityType.BIG_VALVE:
                    fields = makeBigValveFields(obj.entity);
                    break;
                case EntityType.FIXTURE:
                    fields = makeFixtureFields(this.doc.drawing, obj.entity, this.doc.locale);
                    break;
                case EntityType.DIRECTED_VALVE:
                    fields = makeDirectedValveFields(obj.entity, this.catalog, this.doc.drawing);
                    break;
                case EntityType.FLOW_SOURCE:
                    fields = makeFlowSourceFields([], obj.entity,undefined);
                    break;
                case EntityType.LOAD_NODE:
                    const systemUid = determineConnectableSystemUid(obj.globalStore, obj.entity);
                    fields = makeLoadNodesFields(this.doc.drawing, obj.entity, this.catalog, this.doc.locale, systemUid || null);
                    break;
                case EntityType.PLANT:
                    fields = makePlantEntityFields(this.catalog, this.drawing, obj.entity, []);
                    break;
                case EntityType.SYSTEM_NODE:
                case EntityType.BACKGROUND_IMAGE:
                    break;
                default:
                    assertUnreachable(obj.entity);
            }

            for (const field of fields) {
                if (!selectObject) {
                    if (field.requiresInput) {
                        const val = getPropertyByString(obj.entity, field.property);
                        if (val === null || val === "") {
                            selectObject = {
                                uid: obj.uid,
                                property: field.property,
                                message: "Please enter a value for " + field.property,
                                variant: "danger",
                                title: "Missing required value",
                                recenter: true
                            };
                        }
                    } else if (field.type == FieldType.Choice) {
                        const val = getPropertyByString(obj.entity, field.property);
                        const choices = (field as ChoiceField).params.choices;
                        if ( val && val !== "" && 
                             choices && choices.length > 0 && !choices.find( c => c.key == val) ) {
                            selectObject = {
                                uid: obj.uid,
                                property: field.property,
                                message: "Please select a valid option for " + field.property,
                                variant: "danger",
                                title: "Valid value required",
                                recenter: true
                            };
                        }
                    }
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
                const returns = identifyReturns(this);
                this.precomputeBridges();
                this.precomputePsdAfterBridge(FLOW_SOURCE_ROOT_BRIDGE, FLOW_SOURCE_ROOT_NODE, new Set<string>());
                this.preCompute();
                this.configureComponentsWithExactPSD();
                this.sizeRingMains();

                returnFlowRates(this, returns);
                returnBalanceValves(this, returns);  // balance valves before calculating point pressures so that balancing valve pressure drops are accounted for.

                processDrainage(this);

                this.calculateHotWaterDeadlegs();


                this.calculateAllPointPressures();
                this.calculateStaticPressures();

                calculateGas(this);

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

    calculateHotWaterDeadlegs() {
        // complete another Dijkstra around town for this one.
        for (const o of this.networkObjects()) {
            let startNode: FlowNode | null = null;
            if (o.entity.type === EntityType.PLANT) {
                if (o.entity.outletSystemUid === StandardFlowSystemUids.HotWater) {
                    startNode = {
                        connectable: o.entity.outletUid,
                        connection: o.entity.uid,
                    };
                }
            } else if (o.entity.type === EntityType.FLOW_SOURCE) {
                if (o.entity.systemUid === StandardFlowSystemUids.HotWater) {
                    startNode = {
                        connectable: o.entity.uid,
                        connection: FLOW_SOURCE_EDGE,
                    };
                }
            }

            if (startNode) {
                // length
                this.flowGraph.dijkstra(
                    startNode,
                    (e, w) => {
                        switch (e.value.type) {
                            case EdgeType.PIPE:
                                const o = this.globalStore.get(e.value.uid) as Pipe;
                                const pCalc = this.globalStore.getOrCreateCalculation(o.entity);

                                if (pCalc.configuration === Configuration.RETURN) {
                                    return 0;
                                } else {
                                    const filled = fillPipeDefaultFields(this.drawing, o.computedLengthM, o.entity);
                                    return filled.lengthM!;
                                }
                            case EdgeType.BIG_VALVE_HOT_HOT:
                            case EdgeType.BIG_VALVE_HOT_WARM:
                            case EdgeType.FITTING_FLOW:
                            case EdgeType.CHECK_THROUGH:
                            case EdgeType.ISOLATION_THROUGH:
                            case EdgeType.BALANCING_THROUGH:
                                // ok, pass through
                                return 0;
                            case EdgeType.BIG_VALVE_COLD_WARM:
                            case EdgeType.BIG_VALVE_COLD_COLD:
                            case EdgeType.FLOW_SOURCE_EDGE:
                            case EdgeType.RETURN_PUMP:
                                // yeah nah
                                throw new Error('unexpected edge');
                            case EdgeType.PLANT_THROUGH:
                                // shouldn't continue or be here really
                                return Infinity;
                        }
                        assertUnreachable(e.value.type);
                    },
                    (dijk) => {
                        const o = this.globalStore.get(dijk.node.connectable);
                        if (o instanceof SystemNode) {
                            const po = this.globalStore.get(o.entity.parentUid!);
                            if (po instanceof Fixture) {
                                const fCalc = this.globalStore.getOrCreateCalculation(po.entity);
                                fCalc.inlets[o.entity.systemUid].deadlegLengthM = dijk.weight;
                            }
                        }
                    }
                );

                // volume
                this.flowGraph.dijkstra(
                    startNode,
                    (e, w) => {
                        switch (e.value.type) {
                            case EdgeType.PIPE:
                                const o = this.globalStore.get(e.value.uid) as Pipe;
                                const pCalc = this.globalStore.getOrCreateCalculation(o.entity);

                                if (pCalc.configuration === Configuration.RETURN) {
                                    return 0;
                                } else {
                                    if (pCalc.realInternalDiameterMM !== null) {
                                        const filled = fillPipeDefaultFields(this.drawing, o.computedLengthM, o.entity);
                                        return (filled.lengthM! * 10) * (pCalc.realInternalDiameterMM / 100 / 2) ** 2 * Math.PI;
                                    } else {
                                        return Infinity;
                                    }
                                }
                            case EdgeType.BIG_VALVE_HOT_HOT:
                            case EdgeType.BIG_VALVE_HOT_WARM:
                            case EdgeType.FITTING_FLOW:
                            case EdgeType.CHECK_THROUGH:
                            case EdgeType.ISOLATION_THROUGH:
                            case EdgeType.BALANCING_THROUGH:
                                // ok, pass through
                                return 0;
                            case EdgeType.BIG_VALVE_COLD_WARM:
                            case EdgeType.BIG_VALVE_COLD_COLD:
                            case EdgeType.FLOW_SOURCE_EDGE:
                            case EdgeType.RETURN_PUMP:
                                // yeah nah
                                throw new Error('unexpected edge');
                            case EdgeType.PLANT_THROUGH:
                                // shouldn't continue or be here really
                                return Infinity;
                        }
                        assertUnreachable(e.value.type);
                    },
                    (dijk) => {
                        const o = this.globalStore.get(dijk.node.connectable);
                        if (o instanceof SystemNode) {
                            const po = this.globalStore.get(o.entity.parentUid!);
                            if (po instanceof Fixture) {
                                const fCalc = this.globalStore.getOrCreateCalculation(po.entity);
                                fCalc.inlets[o.entity.systemUid].deadlegVolumeL = dijk.weight;
                            }
                        }
                    }
                );
            }
        }
    }

    sizeRingMains() {
        const rmc = new RingMainCalculator(this);
        rmc.calculateAllRings();
    }

    precomputeBridges() {
        const [bridges, components] = this.flowGraph.findBridgeSeparatedComponents();

        for (const e of bridges) {
            this.allBridges.set(e.uid, e);
        }

        const lengths = components.map((c) => c[0].length + c[1].length);
        lengths.sort().reverse();

        const bridgeStack: Array<Edge<FlowNode | undefined, FlowEdge | undefined>> = [FLOW_SOURCE_ROOT_BRIDGE];

        this.childBridges.set(FLOW_SOURCE_ROOT_BRIDGE.uid, []);
        const seenEdges = new Set<string>();

        this.flowGraph.dfsRecursive(
            FLOW_SOURCE_ROOT_NODE,
            (n) => {
                if (!this.psdProfileWithinGroup.has(bridgeStack[bridgeStack.length - 1].uid)) {
                    this.psdProfileWithinGroup.set(bridgeStack[bridgeStack.length - 1].uid, new PsdProfile());
                }
                const units = this.getTerminalPsdU(n);
                for (var i = 0; i < units.length; i++) {
                    insertPsdProfile(this.psdProfileWithinGroup.get(bridgeStack[bridgeStack.length - 1].uid)!, units[i]);
                    insertPsdProfile(this.globalReachedPsdUs, units[i]);
                }
            },
            undefined,
            (e) => {
                const pc = this.globalStore.getOrCreateCalculation((this.globalStore.get(e.value.uid) as Pipe).entity);

                // Edge case: Do not push flow, including sewer flow, through vents.
                if (e.value.type === EdgeType.PIPE) {
                    const pipe = this.globalStore.get(e.value.uid);
                    if (pipe && pipe.entity.type === EntityType.PIPE && isDrainage(pipe.entity.systemUid)) {
                        if (pipe.entity.network === NetworkType.CONNECTIONS) {
                            return true;
                        }
                    }
                }

                // Some pipes may have their flow directions fixed in an earlier step (such as return systems)
                if (pc.flowFrom) {
                    if (e.from.connectable !== pc.flowFrom) {
                        seenEdges.delete(e.uid);
                        return true;
                    }
                }

                if (this.allBridges.has(e.uid)) {
                    this.childBridges.get(bridgeStack[bridgeStack.length - 1].uid)!.push(e);
                    this.childBridges.set(e.uid, []);
                    bridgeStack.push(e);
                }
                this.parentBridgeOfWetEdge.set(e.uid, bridgeStack[bridgeStack.length - 1]);
                this.firstWet.set(e.uid, e.from);
                this.secondWet.set(e.uid, e.to);
            },
            (e, wasCancelled) => {
                if (wasCancelled) {
                    return;
                }
                if (this.allBridges.has(e.uid)) {
                    if (e.uid !== bridgeStack.pop()!.uid) {
                        throw new Error("traversal error");
                    }
                }
            },
            undefined,
            seenEdges,
            true,
            false
        );
    }


    // Take the calcs from the invisible network and collect them into the visible results.
    collectResults() {
        this.drawableObjects().forEach((o) => {
            if (isCalculated(o.entity)) {
                const calc = ((o as unknown) as Calculated).collectCalculations(this);
                const childEntities = o.getCalculationEntities(this);
                calc.cost = zeroCost();
                calc.expandedEntities = childEntities;
                for (const e of childEntities) {
                    const thisCost = this.globalStore.get(e.uid)!.costBreakdown(this);
                    if (thisCost !== null) {
                        calc.cost = addCosts(calc.cost, {value: thisCost.cost, exact: true});
                        if (calc.costBreakdown === null) {
                            calc.costBreakdown = [];
                        }
                        calc.costBreakdown.push(...thisCost.breakdown);
                    } else {
                        calc.cost = addCosts(calc.cost, null);
                    }
                }

                this.globalStore.setCalculation(o.uid, calc);
            }
        });
    }

    buildNetworkObjects() {
        this.drawableObjectUids = Array.from(this.globalStore.keys());
        // We assume we have a fresh globalstore with no pollutants.
        // DO NOT refactor this into a traversal of the this.globalStore.values()
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
                c.heightM = o.entity.heightAboveFloorM;
            } else if (o.entity.type === EntityType.GAS_APPLIANCE) {
                const c = this.globalStore.getOrCreateCalculation(o.entity);
                c.demandMJH = o.entity.flowRateMJH;
            } else if (o.entity.type === EntityType.PLANT && o.entity.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
                const c = this.globalStore.getOrCreateCalculation(o.entity);
                const manufacturer = this.drawing.metadata.catalog.greaseInterceptorTrap![0]?.manufacturer || 'generic';
                const manufacturerName = manufacturer !== 'generic' && this.catalog.greaseInterceptorTrap!.manufacturer.find(i => i.uid === manufacturer)!.name || '';
                const location = o.entity.plant.location;
                const position = o.entity.plant.position;
                const size = this.catalog.greaseInterceptorTrap!.size[manufacturer][location][position][o.entity.plant.capacity];
                const capacity = manufacturer === 'generic' 
                    ? o.entity.plant.capacity
                    : '';
                const product = size?.product || '';
                
                c.size = `${size.lengthMM}mm (L) x ${size.widthMM}mm (W) x ${size.heightMM}mm (H)`;
                c.model = `${manufacturerName.toLocaleUpperCase()} ${product}${capacity}`.trim();
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
                        calculation.inlets[suid].pressureKPA = this.getAbsolutePressurePoint({
                            connectable: entity.roughIns[suid].uid,
                            connection: entity.uid
                        });
                    }
                    break;
                }
                case EntityType.BIG_VALVE: {
                    const calculation = this.globalStore.getOrCreateCalculation(entity);
                    calculation.coldPressureKPA = this.getAbsolutePressurePoint({
                        connectable: entity.coldRoughInUid,
                        connection: entity.uid
                    });
                    calculation.hotPressureKPA = this.getAbsolutePressurePoint({
                        connectable: entity.hotRoughInUid,
                        connection: entity.uid
                    });
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
                        const thisPressure = this.getAbsolutePressurePoint({
                            connectable: entity.uid,
                            connection: cuid
                        });
                        if (thisPressure != null && (maxPressure === null || thisPressure > maxPressure)) {
                            maxPressure = thisPressure;
                        }
                        if (minPressure === null || (thisPressure !== null && thisPressure < minPressure)) {
                            minPressure = thisPressure;
                        }
                        if (entity.type === EntityType.FITTING) {
                            const fCalc = this.globalStore.getOrCreateCalculation(entity);
                            fCalc.pressureByEndpointKPA[cuid] = thisPressure;
                        }
                    });
                    // For the entry, we have to get the highest pressure (the entry pressure)
                    calculation.pressureKPA = maxPressure;
                    break;
                }
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.PIPE:
                case EntityType.PLANT:
                case EntityType.GAS_APPLIANCE:
                case EntityType.RISER:
                    break;
                default:
                    assertUnreachable(entity);
            }
        });
    }

    calculateStaticPressures() {
        this.networkObjects().forEach((o) => {
            if (o.entity.type === EntityType.FLOW_SOURCE) {
                const n = { connectable: o.uid, connection: FLOW_SOURCE_EDGE };
                this.pushPressureThroughNetwork(n, o.entity.maxPressureKPA!, this.entityStaticPressureKPA, this.nodeStaticPressureKPA, PressurePushMode.Static);
            }
        });

        this.networkObjects().forEach((obj) => {
            const entity = obj.entity;
            switch (entity.type) {
                case EntityType.FIXTURE: {
                    const calculation = this.globalStore.getOrCreateCalculation(entity);

                    for (const suid of entity.roughInsInOrder) {
                        calculation.inlets[suid].staticPressureKPA = this.getAbsolutePressurePoint({
                            connectable: entity.roughIns[suid].uid,
                            connection: entity.uid
                        }, this.nodeStaticPressureKPA);
                    }
                    break;
                }
                case EntityType.BIG_VALVE: {
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
                        const thisPressure = this.getAbsolutePressurePoint({
                            connectable: entity.uid,
                            connection: cuid
                        }, this.nodeStaticPressureKPA);
                        if (thisPressure != null && (maxPressure === null || thisPressure > maxPressure)) {
                            maxPressure = thisPressure;
                        }
                        if (minPressure === null || (thisPressure !== null && thisPressure < minPressure)) {
                            minPressure = thisPressure;
                        }
                    });
                    calculation.staticPressureKPA = maxPressure;
                    break;
                }
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.PIPE:
                case EntityType.PLANT:
                case EntityType.GAS_APPLIANCE:
                case EntityType.RISER:
                    break;
                default:
                    assertUnreachable(entity);
            }
        });
    }

    getAbsolutePressurePoint(node: FlowNode, nodePressureKPA?: Map<string, number | null>) {
        const num = (nodePressureKPA || this.nodePressureKPA).get(this.serializeNode(node));
        return num === undefined ? null : num;
    }

    pushPressureThroughNetwork(start: FlowNode, pressureKPA: number, entityMaxPressuresKPA: Map<string, number | null>, nodePressureKPA: Map<string, number | null>, pressurePushMode: PressurePushMode) {
        // Dijkstra to all objects, recording the max pressure that's arrived there.
        this.flowGraph.dijkstra(
            start,
            (edge, weight): number => {
                const obj = this.globalStore.get(edge.value.uid)!;
                const flowFrom = edge.from;
                const flowTo = edge.to;

                let finalPressureKPA: number | null;
                if (weight > -Infinity) {
                    finalPressureKPA = pressureKPA! - weight;
                } else {
                    finalPressureKPA = null;
                }

                switch (edge.value.type) {
                    case EdgeType.PIPE:
                        if (obj instanceof Pipe) {
                            const calculation = this.globalStore.getOrCreateCalculation(obj.entity);

                            // recalculate with height
                            if (!calculation) {
                                return -Infinity; // The following values are unknown, because this pressure
                                // drop is unknown.
                            }

                            let flowRate: number;
                            switch (pressurePushMode) {
                                case PressurePushMode.PSD:
                                    if (calculation.totalPeakFlowRateLS === null) {
                                        return -Infinity;
                                    }
                                    flowRate = calculation.totalPeakFlowRateLS;
                                    break;
                                case PressurePushMode.CirculationFlowOnly:
                                    // also take care of direction
                                    if (calculation.flowFrom !== flowFrom.connectable) {
                                        return (1e10 + (calculation.totalPeakFlowRateLS || 0));
                                    }

                                    if (calculation.rawReturnFlowRateLS === null) {
                                        return -Infinity;
                                    }
                                    flowRate = calculation.rawReturnFlowRateLS;
                                    break;
                                case PressurePushMode.Static:
                                    flowRate = 0;
                                    break;
                                default:
                                    flowRate = 0; // typechecker
                                    assertUnreachable(pressurePushMode);
                            }

                            const headLoss = getObjectFrictionHeadLoss(
                                this,
                                obj,
                                flowRate,
                                edge.from,
                                edge.to,
                                true,
                                finalPressureKPA,
                                pressurePushMode,
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

                            switch (pressurePushMode) {
                                case PressurePushMode.PSD:
                                    break;
                                case PressurePushMode.CirculationFlowOnly:
                                case PressurePushMode.Static:
                                    fr = 0;
                                    break;
                                default:
                                    assertUnreachable(pressurePushMode);
                            }

                            if (fr === null) {
                                return Infinity;
                            }

                            const hl = getObjectFrictionHeadLoss(
                                this,
                                obj,
                                fr,
                                flowFrom,
                                flowTo,
                                true,
                                finalPressureKPA,
                                pressurePushMode,
                            );
                            let pressure = ( hl === null ) ? -Infinity : head2kpa(
                                    hl,
                                    getFluidDensityOfSystem(systemUid, this.doc, this.catalog)!,
                                    this.ga
                                );
                            return pressure
                        } else {
                            throw new Error("misconfigured flow graph");
                        }
                    }
                    case EdgeType.FITTING_FLOW:
                    case EdgeType.CHECK_THROUGH:
                    case EdgeType.RETURN_PUMP:
                    case EdgeType.ISOLATION_THROUGH: {
                        const sourcePipe = this.globalStore.get(flowFrom.connection);
                        const destPipe = this.globalStore.get(flowTo.connection);
                        let srcDist: number | null = null;
                        let destDist: number | null = null;
                        let dist: number | null = null;

                        if (sourcePipe instanceof Pipe) {
                            const srcCalc = this.globalStore.getOrCreateCalculation(sourcePipe.entity);

                            switch (pressurePushMode) {
                                case PressurePushMode.PSD:
                                    srcDist = srcCalc.totalPeakFlowRateLS || 0;
                                    break;
                                case PressurePushMode.CirculationFlowOnly:
                                    srcDist = srcCalc.rawReturnFlowRateLS || 0;
                                    break;
                                case PressurePushMode.Static:
                                    srcDist = 0;
                                    break;
                                default:
                                    assertUnreachable(pressurePushMode);
                            }
                        }

                        if (destPipe instanceof Pipe) {
                            const destCalc = this.globalStore.getOrCreateCalculation(destPipe.entity);

                            switch (pressurePushMode) {
                                case PressurePushMode.PSD:
                                    destDist = destCalc.totalPeakFlowRateLS || 0;
                                    break;
                                case PressurePushMode.CirculationFlowOnly:
                                    destDist = destCalc.rawReturnFlowRateLS || 0;
                                    break;
                                case PressurePushMode.Static:
                                    destDist = 0;
                                    break;
                                default:
                                    assertUnreachable(pressurePushMode);
                            }
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
                            const hl = getObjectFrictionHeadLoss(
                                this,
                                obj,
                                dist,
                                flowFrom,
                                flowTo,
                                true,
                                finalPressureKPA,
                                pressurePushMode,
                            );
                            let pressure = ( hl === null ) ? -Infinity : head2kpa(
                                    hl,
                                    getFluidDensityOfSystem(systemUid, this.doc, this.catalog)!,
                                    this.ga
                                );
                            return pressure
                        } else {
                            return 1000000;
                        }
                    }
                    case EdgeType.PLANT_THROUGH: {
                        const plant = obj as Plant;

                        const conns = this.globalStore.getConnections(plant.entity.inletUid);
                        let flowLS: number | null = 0;
                        if (conns.length === 1) {
                            const calc = this.globalStore.getOrCreateCalculation(
                                this.globalStore.get(conns[0])!.entity as PipeEntity
                            );

                            switch (pressurePushMode) {
                                case PressurePushMode.PSD:
                                    flowLS = calc.totalPeakFlowRateLS || 0;
                                    break;
                                case PressurePushMode.CirculationFlowOnly:
                                    flowLS = calc.rawReturnFlowRateLS || 0;
                                    break;
                                case PressurePushMode.Static:
                                    flowLS = 0;
                                    break;
                                default:
                                    assertUnreachable(pressurePushMode);
                            }
                        }

                        const hl = getObjectFrictionHeadLoss(
                            this,
                            obj,
                            flowLS!,
                            flowFrom,
                            flowTo,
                            true,
                            finalPressureKPA,
                            pressurePushMode,
                        );
                        return hl === null
                            ? -Infinity
                            : head2kpa(
                                hl,
                                getFluidDensityOfSystem(plant.entity.inletSystemUid, this.doc, this.catalog)!,
                                this.ga
                            );
                    }
                    case EdgeType.BALANCING_THROUGH:
                        switch (pressurePushMode) {
                            case PressurePushMode.PSD:
                                const afterPipe = this.globalStore.get(flowTo.connection) as Pipe;
                                const afterPCalc = this.globalStore.getOrCreateCalculation(afterPipe.entity);
                                if (afterPCalc.flowFrom !== edge.value.uid) {
                                    // opposite direction
                                    return (1e10 + (afterPCalc.totalPeakFlowRateLS || 0));
                                }

                                const vCalc = this.globalStore.getOrCreateCalculation(
                                    (this.globalStore.get(edge.value.uid) as DirectedValve).entity,
                                );
                                if (vCalc.pressureDropKPA === null) {
                                    return -Infinity;
                                } else {
                                    return vCalc.pressureDropKPA;
                                }
                            case PressurePushMode.CirculationFlowOnly:
                                // direction is always correct - assuming balancing valves were placed correctly.
                                return MINIMUM_BALANCING_VALVE_PRESSURE_DROP_KPA;
                            case PressurePushMode.Static:
                                return 0;
                            default:
                                assertUnreachable(pressurePushMode);
                        }
                    case EdgeType.FLOW_SOURCE_EDGE:
                        throw new Error("oopsies");
                }
                assertUnreachable(edge.value.type);
            },
            (dijk) => {
                // xTODO: Bellman Ford
                let finalPressureKPA: number | null;
                if (dijk.weight > -Infinity) {
                    finalPressureKPA = pressureKPA! - dijk.weight;
                } else {
                    finalPressureKPA = null;
                }
                if (entityMaxPressuresKPA.has(dijk.node.connectable)) {
                    const existing = entityMaxPressuresKPA.get(dijk.node.connectable)!;
                    if (existing !== null && (finalPressureKPA === null || existing < finalPressureKPA)) {
                        // throw new Error('new size is larger than us ' + existing + ' ' + finalPressureKPA);
                    }
                } else {
                    entityMaxPressuresKPA.set(dijk.node.connectable, finalPressureKPA);
                }
                nodePressureKPA.set(this.serializeNode(dijk.node), finalPressureKPA);
            }
        );
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
                const n = { connectable: o.uid, connection: FLOW_SOURCE_EDGE };
                this.pushPressureThroughNetwork(n, o.entity.minPressureKPA!, this.entityMaxPressuresKPA, this.nodePressureKPA, PressurePushMode.PSD);
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
                                uid: obj.entity.uid
                            }
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

                            // For nodes, that might connect things of two different
                            const p1 = this.globalStore.get(toConnect[i]);
                            const p2 = this.globalStore.get(toConnect[j]);
                            if (p1 && p2 && p1 instanceof Pipe && p2 instanceof Pipe) {
                                if (!flowSystemsFlowTogether(
                                    p1.entity.systemUid,
                                    p2.entity.systemUid,
                                    this.doc,
                                    this.catalog,
                                )) {
                                    // Cannot enable this yet. Because can't make this work with
                                    // towered calculations yet.
                                    continue;
                                }
                            }

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
                    // sewer pits are reversed
                    if (isDrainage(obj.entity.inletSystemUid)) {

                        this.flowGraph.addDirectedEdge(
                            {
                                connectable: obj.entity.outletUid,
                                connection: obj.entity.uid
                            },
                            {
                                connectable: obj.entity.inletUid,
                                connection: obj.entity.uid
                            },
                            {
                                type: EdgeType.PLANT_THROUGH,
                                uid: obj.entity.uid
                            }
                        );
                    } else {

                        this.flowGraph.addDirectedEdge(
                            {
                                connectable: obj.entity.inletUid,
                                connection: obj.entity.uid
                            },
                            {
                                connectable: obj.entity.outletUid,
                                connection: obj.entity.uid
                            },
                            {
                                type: EdgeType.PLANT_THROUGH,
                                uid: obj.entity.uid
                            }
                        );
                    }
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FIXTURE:
                case EntityType.GAS_APPLIANCE:
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
                case ValveType.PRV_SINGLE:
                case ValveType.PRV_DOUBLE:
                case ValveType.PRV_TRIPLE:
                case ValveType.GAS_REGULATOR:
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
                                type: EdgeType.ISOLATION_THROUGH,
                                uid: entity.uid
                            }
                        );
                    }
                    break;
                case ValveType.BALANCING:

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
                            type: EdgeType.BALANCING_THROUGH,
                            uid: entity.uid
                        }
                    );
                    break;

                case ValveType.WATER_METER:
                case ValveType.FILTER:
                case ValveType.STRAINER:
                case ValveType.FLOOR_WASTE:
                case ValveType.INSPECTION_OPENING:
                case ValveType.REFLUX_VALVE:
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

    // Checks basic validity stuff, like hot water/cold water shouldn't mix, all fixtures have
    // required water sources filled in, etc.
    sanityCheck(objectStore: ObjectStore, doc: DocumentState): boolean {
        // TODO come up with all sanity checks that are required
        return true;
    }

    // Returns PSD of node and correlation group ID
    getTerminalPsdU(flowNode: FlowNode): ContextualPCE[] {
        if (flowNode.connectable === FLOW_SOURCE_ROOT) {
            return [];
        }

        const node = this.globalStore.get(flowNode.connectable)!;

        if (node.entity.type === EntityType.SYSTEM_NODE) {
            const parent = this.globalStore.get(node.entity.parentUid!);
            if (parent === undefined) {
                throw new Error("System node is missing parent. " + JSON.stringify(node));
            }
            if (parent.uid !== flowNode.connection) {
                return [];
            }
            const parentEntity = parent.entity;
            switch (parentEntity.type) {
                case EntityType.FIXTURE: {
                    const fixture = parentEntity as FixtureEntity;
                    const mainFixture = fillFixtureFields(this.doc.drawing, this.catalog, fixture);

                    let drainageUnits = undefined;
                    switch (this.doc.drawing.metadata.calculationParams.drainageMethod) {
                        case SupportedDrainageMethods.AS2018FixtureUnits:
                            drainageUnits = mainFixture.asnzFixtureUnits;
                            break;
                        case SupportedDrainageMethods.EN1205622000DischargeUnits:
                            drainageUnits = mainFixture.enDischargeUnits;
                            break;
                        case SupportedDrainageMethods.UPC2018DrainageFixtureUnits:
                            drainageUnits = mainFixture.upcFixtureUnits;
                            break;
                        default:
                            assertUnreachable(this.doc.drawing.metadata.calculationParams.drainageMethod)
                    }

                    for (const suid of fixture.roughInsInOrder) {
                        if (node.uid === fixture.roughIns[suid].uid || (isDrainage(node.entity.systemUid) && isDrainage(suid))) {
                            if (isGermanStandard(this.doc.drawing.metadata.calculationParams.psdMethod)) {
                                return [{
                                    units: Number(mainFixture.roughIns[suid].designFlowRateLS),
                                    continuousFlowLS: mainFixture.roughIns[suid].continuousFlowLS!,
                                    dwellings: 0,
                                    entity: node.entity.uid,
                                    correlationGroup: fixture.uid,
                                    drainageUnits: isDrainage(suid) ? drainageUnits! : 0,
                                    gasMJH: 0,
                                }];
                            } else {
                                return [{
                                    units: Number(mainFixture.roughIns[suid].loadingUnits),
                                    continuousFlowLS: mainFixture.roughIns[suid].continuousFlowLS!,
                                    dwellings: 0,
                                    entity: node.entity.uid,
                                    gasMJH: 0,
                                    correlationGroup: fixture.uid,
                                    drainageUnits: isDrainage(suid) ? drainageUnits! : 0,
                                }];
                            }
                        }
                    }
                    //throw new Error("Invalid connection to fixture");
                    return [zeroContextualPCE(node.entity.uid, node.entity.uid)];
                }
                case EntityType.GAS_APPLIANCE: {
                    return [{
                        units: 0,
                        continuousFlowLS: 0,
                        dwellings: 0,
                        entity: parentEntity.uid,
                        correlationGroup: parentEntity.uid,
                        gasMJH: parentEntity.flowRateMJH!,
                        drainageUnits: 0,
                    }];
                }
                case EntityType.PLANT: {
                    switch (parentEntity.plant.type) {
                        case PlantType.RETURN_SYSTEM:
                            const filled = fillPlantDefaults(parentEntity, this.drawing).plant as ReturnSystemPlant;
                            if (filled.gasConsumptionMJH !== null && node.uid === filled.gasNodeUid) {
                                return [{
                                    units: 0,
                                    continuousFlowLS: 0,
                                    dwellings: 0,
                                    entity: node.entity.uid,
                                    correlationGroup: parentEntity.uid,
                                    gasMJH: filled.gasConsumptionMJH,
                                    drainageUnits: 0,
                                }];
                            }
                            break;
                        case PlantType.TANK:
                        case PlantType.CUSTOM:
                        case PlantType.PUMP:
                        case PlantType.DRAINAGE_PIT:
                        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                            break;
                        default:
                            assertUnreachable(parentEntity.plant);
                    }
                    return [zeroContextualPCE(node.entity.uid, node.entity.uid)];
                }
                case EntityType.LOAD_NODE:
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.RISER:
                case EntityType.FLOW_SOURCE:
                case EntityType.PIPE:
                case EntityType.FITTING:
                case EntityType.BIG_VALVE:
                case EntityType.SYSTEM_NODE:
                case EntityType.DIRECTED_VALVE:
                    return [zeroContextualPCE(node.entity.uid, node.entity.uid)];
                default:
                    assertUnreachable(parentEntity);
            }
            assertUnreachable(parentEntity);
            // Sadly, typescript type checking for return value was not smart enough to avoid these two lines.
            throw new Error("parent type is not a correct value");
        } else if (node.entity.type === EntityType.LOAD_NODE) {
            const correlationGroup = node.entity.linkedToUid || node.entity.uid;
            const filled = fillDefaultLoadNodeFields(this.doc, this.globalStore, node.entity, this.catalog, this.nodes);
            
            const selectedMaterialManufacturer = this.doc.drawing.metadata.catalog.fixtures.find(obj => obj.uid === filled.uid);
            const manufacturer = selectedMaterialManufacturer?.manufacturer || 'generic';
            const selectedOption = selectedMaterialManufacturer?.selected || 'default';

            const psdStandard = this.doc.drawing.metadata.calculationParams.psdMethod;
            if (typeof filled.customNodeId !== "undefined" && psdStandard === SupportedPsdStandards.bs806) {
                const nodeProp = this.nodes.find((node: NodeProps) => node.id === filled.customNodeId || node.uid === filled.customNodeId);

                if (nodeProp !== undefined) {
                    // Special case for bs806 because it requires individual fixture information.
                    const returnData: ContextualPCE[] = [];
                    for (let i = 0; i < nodeProp.fixtures.length; i++) {
                        let loadingUnits = 0;
                        let designFlowRateLS = 0;
                        let fixtureUnits = 0;
                        switch (this.doc.drawing.metadata.calculationParams.drainageMethod) {
                            case SupportedDrainageMethods.AS2018FixtureUnits:
                                fixtureUnits = parseCatalogNumberExact(this.catalog.fixtures[nodeProp.fixtures[i]].asnzFixtureUnits)!;
                                break;
                            case SupportedDrainageMethods.EN1205622000DischargeUnits:
                                fixtureUnits = parseCatalogNumberExact(this.catalog.fixtures[nodeProp.fixtures[i]].enDrainageSystem[this.doc.drawing.metadata.calculationParams.drainageSystem])!;
                                break;
                            case SupportedDrainageMethods.UPC2018DrainageFixtureUnits:
                                fixtureUnits = parseCatalogNumberExact(this.catalog.fixtures[nodeProp.fixtures[i]].upcFixtureUnits)!;
                                break;
                            default:
                                assertUnreachable(this.doc.drawing.metadata.calculationParams.drainageMethod);
                        }

                        if (isGermanStandard(psdStandard)) {
                            let systemChk = null;
                            if (!!(this.catalog.fixtures[nodeProp.fixtures[i]].qLS[psdStandard])) {
                                systemChk = filled.systemUidOption;
                            } else if (filled.systemUidOption === 'hot-water' && !!(this.catalog.fixtures[nodeProp.fixtures[i]].qLS['warm-water'])) {
                                systemChk = 'warm-water';
                            }
                            if (systemChk) {
                                loadingUnits = parseCatalogNumberOrMin(this.catalog.fixtures[nodeProp.fixtures[i]].loadingUnits[SupportedPsdStandards.bs806][systemChk])!;
                                designFlowRateLS = parseCatalogNumberOrMin(this.catalog.fixtures[nodeProp.fixtures[i]].qLS[manufacturer][selectedOption][systemChk])!;
                                loadingUnits = parseCatalogNumberExact(this.catalog.fixtures[nodeProp.fixtures[i]].loadingUnits[SupportedPsdStandards.bs806][systemChk])!;

                                returnData.push({
                                    units: designFlowRateLS,
                                    continuousFlowLS: filled.node.continuousFlowLS!,
                                    dwellings: 0,
                                    entity: filled.uid + '-' + i,
                                    gasMJH: filled.node.gasFlowRateMJH,
                                    drainageUnits: fixtureUnits,
                                    correlationGroup: correlationGroup + '-' + i,
                                });
                            }
                        } else {
                            let systemChk = null;
                            if (!!(this.catalog.fixtures[nodeProp.fixtures[i]].loadingUnits[psdStandard][filled.systemUidOption!])) {
                                systemChk = filled.systemUidOption;
                            } else if (filled.systemUidOption === 'hot-water' && !!(this.catalog.fixtures[nodeProp.fixtures[i]].loadingUnits[psdStandard]['warm-water'])) {
                                systemChk = 'warm-water';
                            }

                            let loadingUnits = 0;
                            if (systemChk) {
                                loadingUnits = parseCatalogNumberExact(this.catalog.fixtures[nodeProp.fixtures[i]].loadingUnits[psdStandard][systemChk])!;

                                returnData.push({
                                    units: loadingUnits,
                                    continuousFlowLS: filled.node.continuousFlowLS!,
                                    dwellings: 0,
                                    entity: filled.uid + '-' + i,
                                    gasMJH: filled.node.gasFlowRateMJH,
                                    drainageUnits: fixtureUnits,
                                    correlationGroup: correlationGroup + '-' + i,
                                });
                            }
                        }
                    }

                    return returnData;
                }
            } else {
                let drainageUnits: number | null = null;
                switch (this.doc.drawing.metadata.calculationParams.drainageMethod) {
                    case SupportedDrainageMethods.AS2018FixtureUnits:
                        drainageUnits = filled.node.asnzFixtureUnits;
                        break;
                    case SupportedDrainageMethods.EN1205622000DischargeUnits:
                        drainageUnits = filled.node.enDischargeUnits;
                        break;
                    case SupportedDrainageMethods.UPC2018DrainageFixtureUnits:
                        drainageUnits = filled.node.upcFixtureUnits;
                        break;
                    default:
                        assertUnreachable(this.doc.drawing.metadata.calculationParams.drainageMethod);
                }
                switch (filled.node.type) {
                    case NodeType.LOAD_NODE:
                        if (isGermanStandard(this.doc.drawing.metadata.calculationParams.psdMethod)) {
                            return [{
                                units: filled.node.designFlowRateLS!,
                                continuousFlowLS: filled.node.continuousFlowLS!,
                                dwellings: 0,
                                entity: filled.uid,
                                gasMJH: filled.node.gasFlowRateMJH,
                                drainageUnits: drainageUnits!,
                                correlationGroup
                            }];
                        } else {
                            return [{
                                units: filled.node.loadingUnits!,
                                continuousFlowLS: filled.node.continuousFlowLS!,
                                dwellings: 0,
                                entity: filled.uid,
                                gasMJH: filled.node.gasFlowRateMJH,
                                drainageUnits: drainageUnits!,
                                correlationGroup
                            }];
                        }
                    case NodeType.DWELLING:
                        if (!!this.doc.drawing.metadata.calculationParams.dwellingMethod) {
                            return [{
                                units: 0,
                                continuousFlowLS: filled.node.continuousFlowLS!,
                                dwellings: filled.node.dwellings,
                                entity: filled.uid,
                                gasMJH: filled.node.gasFlowRateMJH * filled.node.dwellings!,
                                drainageUnits: drainageUnits!,
                                correlationGroup
                            }];
                        } else if (isGermanStandard(this.doc.drawing.metadata.calculationParams.psdMethod)) {
                            return [{
                                units: filled.node.designFlowRateLS!,
                                continuousFlowLS: filled.node.continuousFlowLS!,
                                dwellings: filled.node.dwellings,
                                entity: filled.uid,
                                gasMJH: filled.node.gasFlowRateMJH * filled.node.dwellings!,
                                drainageUnits: drainageUnits!,
                                correlationGroup
                            }];
                        } else {
                            return [{
                                units: filled.node.loadingUnits!,
                                continuousFlowLS: filled.node.continuousFlowLS!,
                                dwellings: filled.node.dwellings,
                                entity: filled.uid,
                                gasMJH: filled.node.gasFlowRateMJH * filled.node.dwellings!,
                                drainageUnits: drainageUnits!,
                                correlationGroup
                            }];
                        }
                    default:
                        assertUnreachable(filled.node);
                }
            }
            throw new Error("invalid node type");
        } else {
            return [zeroContextualPCE(node.entity.uid, node.entity.uid)];
        }
    }

    configureEntityForPSD(
        entity: DrawableEntityConcrete,
        psdU: FinalPsdCountEntry,
        flowEdge: FlowEdge,
        wet: FlowNode | null,
        profile: PsdProfile,
        noFlowReason: NoFlowAvailableReason | null
    ) {
        switch (entity.type) {
            case EntityType.PIPE: {

                const calculation = this.globalStore.getOrCreateCalculation(entity);

                calculation.psdUnits = psdU;
                calculation.psdProfile = profile;
                if (!calculation.flowFrom) {
                    calculation.flowFrom = wet ? wet.connectable : null;
                }
                calculation.noFlowAvailableReason = noFlowReason;

                const isGas = entity.systemUid === StandardFlowSystemUids.Gas;
                if (isGas) {
                    // Gas calculation done elsewhere
                } else if (isDrainage(entity.systemUid)) {
                    // TODO: Drainage sizing
                    sizeDrainagePipe(entity, this);
                } else {

                    const flowRate = lookupFlowRate(psdU, this.doc, this.catalog, entity.systemUid);

                    if (flowRate === null) {
                        // Warn for no PSD
                        if (isZeroWaterPsdCounts(psdU)) {
                            this.setPipePSDFlowRate(entity, 0);
                        } else {
                            calculation.noFlowAvailableReason = NoFlowAvailableReason.LOADING_UNITS_OUT_OF_BOUNDS;
                            calculation.warning = "Change the Peak Flow Rate Calculation Method";
                        }
                    } else {
                        this.setPipePSDFlowRate(entity, flowRate.flowRateLS);
                    }
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

                // size is based on the warm water flow rate on the outlet of the TMV
                if (entity.valve.type !== BigValveType.RPZD_HOT_COLD && systemUid === StandardFlowSystemUids.HotWater) {
                    const manufacturer = this.doc.drawing.metadata.catalog.mixingValves.find((material: SelectedMaterialManufacturer) => material.uid === entity.valve.catalogId)?.manufacturer || 'generic';

                    calculation.mixingValveSizeMM = this.sizeMixingValveForFlowRate(!!(flowRate?.flowRateLS) ? flowRate.flowRateLS : 0, manufacturer);
                }

                if (entity.valve.type === BigValveType.RPZD_HOT_COLD && flowRate !== null) {
                    if (flowEdge.type === EdgeType.BIG_VALVE_HOT_HOT) {
                        calculation.rpzdSizeMM![StandardFlowSystemUids.HotWater] = this.sizeRpzdForFlowRate(
                            entity.valve.catalogId,
                            ValveType.RPZD_SINGLE,
                            flowRate.flowRateLS
                        );
                    } else if (flowEdge.type === EdgeType.BIG_VALVE_COLD_COLD) {
                        calculation.rpzdSizeMM![StandardFlowSystemUids.ColdWater] = this.sizeRpzdForFlowRate(
                            entity.valve.catalogId,
                            ValveType.RPZD_SINGLE,
                            flowRate.flowRateLS
                        );
                    } else {
                        throw new Error("Invalid edge on hot-cold RPZD");
                    }
                }

                if (flowEdge.type === EdgeType.BIG_VALVE_COLD_COLD) {
                    calculation.coldPsdUs = psdU;
                    calculation.coldPeakFlowRate = flowRate ? flowRate.flowRateLS : null;
                } else if (
                    flowEdge.type === EdgeType.BIG_VALVE_HOT_WARM ||
                    flowEdge.type === EdgeType.BIG_VALVE_HOT_HOT
                ) {
                    calculation.hotPsdUs = psdU;
                    calculation.hotPeakFlowRate = flowRate ? flowRate.flowRateLS : null;
                    calculation.hotTotalFlowRateLS = calculation.hotPeakFlowRate;
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
            case EntityType.GAS_APPLIANCE:
                throw new Error("Cannot configure this entity to accept loading units");
            default:
                assertUnreachable(entity);
        }
    }

    setPipePSDFlowRate(pipe: PipeEntity, flowRateLS: number) {
        const cpipe = fillPipeDefaultFields(this.doc.drawing, 0, pipe);

        // apply spare capacity
        const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === cpipe.systemUid!);
        const rawFlowRate = flowRateLS;
        if (system) {
            flowRateLS = flowRateLS * (1 + Number(system.networks[pipe.network].spareCapacityPCT) / 100);
        }

        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        calculation.PSDFlowRateLS = flowRateLS;
        calculation.totalPeakFlowRateLS = flowRateLS;
        calculation.rawPSDFlowRateLS = rawFlowRate;

        this.sizePipeForFlowRate(pipe, [[flowRateLS, cpipe.maximumVelocityMS!]]);
    }

    sizePipeForFlowRate(pipe: PipeEntity, requirements: Array<[number | null, number]>) {
        const calculation = this.globalStore.getOrCreateCalculation(pipe);

        let sizeMM = -Infinity;
        for (const [flowRate, maxVel] of requirements) {
            if (flowRate === null) {
                // one of the requirements contains an undefined value. Not possible.
                return;
            }
            const thisSizeMM = this.calculateInnerDiameter(pipe, flowRate, maxVel);
            if (thisSizeMM > sizeMM) {
                sizeMM = thisSizeMM;
            }
        }

        calculation.optimalInnerPipeDiameterMM = sizeMM;

        let page: PipeSpec | null = null;
        if (pipe.diameterMM === null) {
            page = this.getRealPipe(pipe);
        } else {
            calculation.realNominalPipeDiameterMM = pipe.diameterMM;
            page = this.getPipeByNominal(pipe, pipe.diameterMM);
        }
        if (!page) {
            calculation.noFlowAvailableReason = NoFlowAvailableReason.NO_SUITABLE_PIPE_SIZE;
            calculation.warning = "No suitable pipe size in the catalog for this flow rate";
            return;
        }
        calculation.realNominalPipeDiameterMM = parseCatalogNumberExact(page.diameterNominalMM);
        calculation.realInternalDiameterMM = parseCatalogNumberExact(page.diameterInternalMM);
        calculation.realOutsideDiameterMM = parseCatalogNumberExact(page.diameterOutsideMM);

        if (calculation.realNominalPipeDiameterMM) {
            calculation.velocityRealMS = this.getVelocityRealMs(pipe);

            calculation.pressureDropKPA = head2kpa(
                this.getPipePressureDropMH(pipe),
                getFluidDensityOfSystem(pipe.systemUid, this.doc, this.catalog)!,
                this.ga
            );
        }
    }

    calculateInnerDiameter(pipe: PipeEntity, flowRateLS: number, maximumVelocityMS: number): number {

        // depends on pipe sizing method
        if (this.doc.drawing.metadata.calculationParams.pipeSizingMethod === "velocity") {
            // http://www.1728.org/flowrate.htm
            return Math.sqrt((4000 * flowRateLS!) / (Math.PI * maximumVelocityMS!));
        } else {
            throw new Error("Pipe sizing strategy not supported");
        }
    }

    getPipePressureDropMH(pipe: PipeEntity): number {
        const obj = this.globalStore.get(pipe.uid) as Pipe;
        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        const realPipe = lowerBoundTable(
            obj.getManufacturerCatalogPage(this)!,
            calculation.realNominalPipeDiameterMM!
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
        const res = (
            (4000 * calculation.totalPeakFlowRateLS!) /
            (Math.PI * parseCatalogNumberExact(calculation.realInternalDiameterMM)! ** 2)
        );
        if (isNaN(res)) {
            throw new Error('velocity is NaN ' + JSON.stringify(calculation));
        }
        return res;
    }


    getPipeByNominal(pipe: PipeEntity, maxNominalMM: number): PipeSpec | null {
        const pipeFilled = fillPipeDefaultFields(this.doc.drawing, 0, pipe);
        const table = this.catalog.pipes[pipeFilled.material!];
        const manufacturer = this.doc.drawing.metadata.catalog.pipes.find((pipe: SelectedMaterialManufacturer) => pipe.uid === pipeFilled.material)?.manufacturer || 'generic';
        const a = upperBoundTable(table.pipesBySize[manufacturer], maxNominalMM, (p, isMax) => {
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
        const obj = this.globalStore.get(pipe.uid) as Pipe;
        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        const pipeFilled = fillPipeDefaultFields(this.doc.drawing, 0, pipe);
        const table = this.catalog.pipes[pipeFilled.material!];

        if (!table) {
            throw new Error("Material doesn't exist anymore " + JSON.stringify(pipeFilled));
        }

        const a = lowerBoundTable(obj.getManufacturerCatalogPage(this)!, calculation.optimalInnerPipeDiameterMM!, (p) => {
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
        
        const manufacturer = this.doc.drawing.metadata.catalog.pipes.find((pipe: SelectedMaterialManufacturer) => pipe.uid === pipeFilled.material)?.manufacturer || 'generic';
        const a = upperBoundTable(table.pipesBySize[manufacturer], Infinity, (p) => {
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

    configureComponentsWithExactPSD() {
        const totalReachedPsdU = this.globalReachedPsdUs;

        // Size all pipes first
        this.networkObjects().forEach((object) => {
            switch (object.entity.type) {
                case EntityType.BIG_VALVE:
                    switch (object.entity.valve.type) {
                        case BigValveType.TMV:
                            this.configureComponentIfExactPSD(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_HOT_WARM, uid: object.uid },
                                [object.entity.hotRoughInUid, object.entity.valve.warmOutputUid]
                            );
                            this.configureComponentIfExactPSD(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_COLD_COLD, uid: object.uid },
                                [object.entity.coldRoughInUid, object.entity.valve.coldOutputUid]
                            );
                            break;
                        case BigValveType.TEMPERING:
                            this.configureComponentIfExactPSD(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_HOT_WARM, uid: object.uid },
                                [object.entity.hotRoughInUid, object.entity.valve.warmOutputUid]
                            );
                            break;
                        case BigValveType.RPZD_HOT_COLD:
                            this.configureComponentIfExactPSD(
                                object,
                                totalReachedPsdU,
                                { type: EdgeType.BIG_VALVE_COLD_COLD, uid: object.uid },
                                [object.entity.coldRoughInUid, object.entity.valve.coldOutputUid]
                            );
                            this.configureComponentIfExactPSD(
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
                    const c = this.globalStore.getCalculation(object.entity)!;
                    if (c.configuration === null) {
                        c.configuration = Configuration.NORMAL;
                    }
                    this.configureComponentIfExactPSD(object, totalReachedPsdU, { type: EdgeType.PIPE, uid: object.uid }, [
                        object.entity.endpointUid[0],
                        object.entity.endpointUid[1]
                    ]);
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
                case EntityType.GAS_APPLIANCE:
                    break;
                default:
                    assertUnreachable(object.entity);
            }
        });

        // Now size RPZD's, PRVs or any other directed valves, based on pipe peak flow rates
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

                                if (pCalc.totalPeakFlowRateLS !== null) {
                                    let size: number | null = null;
                                    if (obj.entity.valve.sizeMM === null) {
                                        size = this.sizeRpzdForFlowRate(
                                            obj.entity.valve.catalogId,
                                            obj.entity.valve.type,
                                            pCalc.totalPeakFlowRateLS
                                        );
                                    } else {
                                        size = obj.entity.valve.sizeMM;
                                    }
                                    if (size !== null) {
                                        const calc = this.globalStore.getOrCreateCalculation(obj.entity);
                                        calc.sizeMM = size;
                                    }
                                }
                            }
                            break;
                        case ValveType.PRV_SINGLE:
                        case ValveType.PRV_DOUBLE:
                        case ValveType.PRV_TRIPLE:
                            if (conns.length === 2) {
                                const p = this.globalStore.get(conns[0]) as Pipe;
                                const pCalc = this.globalStore.getOrCreateCalculation(p.entity);

                                if (pCalc.totalPeakFlowRateLS !== null) {
                                    let size = this.sizePrvForFlowRate(obj.entity.valve.type, pCalc.totalPeakFlowRateLS);

                                    if (obj.entity.valve.sizeMM !== null) {
                                        size = obj.entity.valve.sizeMM;
                                    }

                                    if (size !== null) {
                                        const calc = this.globalStore.getOrCreateCalculation(obj.entity);
                                        calc.sizeMM = size;
                                    }
                                }
                            }
                            break;
                        case ValveType.CHECK_VALVE:
                        case ValveType.ISOLATION_VALVE:
                        case ValveType.WATER_METER:
                        case ValveType.STRAINER:
                        case ValveType.GAS_REGULATOR:
                        case ValveType.FILTER:
                        case ValveType.BALANCING:
                        case ValveType.FLOOR_WASTE:
                        case ValveType.INSPECTION_OPENING:
                        case ValveType.REFLUX_VALVE:
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
        const manufacturer = this.doc.drawing.metadata.catalog.backflowValves.find((material: SelectedMaterialManufacturer) => material.uid === catalogId)?.manufacturer || 'generic';
        const entry = lowerBoundTable(
            this.catalog.backflowValves[catalogId].valvesBySize[manufacturer],
            fr,
            (t, m) => parseCatalogNumberExact(m ? t.maxFlowRateLS : t.minFlowRateLS)!
        );

        if (entry) {
            return parseCatalogNumberExact(entry.sizeMM);
        }
        return null;
    }

    sizePrvForFlowRate(
        type: ValveType.PRV_SINGLE | ValveType.PRV_DOUBLE | ValveType.PRV_TRIPLE,
        fr: number
    ): number | null {
        switch (type) {
            case ValveType.PRV_SINGLE:
                break;
            case ValveType.PRV_DOUBLE:
                fr /= 2;
                break;
            case ValveType.PRV_TRIPLE:
                fr /= 3;
                break;
            default:
                assertUnreachable(type);
        }

        const manufacturer = this.doc.drawing.metadata.catalog.prv[0]?.manufacturer || 'generic';
        const entry = lowerBoundTable(
            this.catalog.prv.size[manufacturer],
            fr,
            (t, m) => parseCatalogNumberExact(m ? t.maxFlowRateLS : t.minFlowRateLS)!
        );

        if (entry) {
            return parseCatalogNumberExact(entry.diameterNominalMM);
        }
        return null;
    }

    configureComponentIfExactPSD(
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
            this.configureEntityForPSD(
                object.entity,
                zeroFinalPsdCounts(),
                flowEdge,
                null,
                new PsdProfile(),
                NoFlowAvailableReason.NO_SOURCE
            );
        } else {
            const exclusivePsdU = countPsdProfile(exclusiveProfile, this.combineLUs, this.doc, this.catalog);

            const wet = this.firstWet.get(stringify(flowEdge))!;
            const dryUids = endpointUids.filter((ep) => ep !== wet.connectable);
            if (dryUids.length !== 1) {
                throw new Error("dry is neigh");
            }
            const dryUid = dryUids[0];

            const residualPsdProfile = this.getDownstreamPsdUs(
                [{ connectable: dryUid, connection: object.uid }],
                [],
                [stringify(flowEdge)]
            );
            const residualPsdU = countPsdProfile(residualPsdProfile, this.combineLUs, this.doc, this.catalog);

            if (!isZeroWaterPsdCounts(exclusivePsdU)) {
                const cmp = compareWaterPsdCounts(residualPsdU, exclusivePsdU);
                if (cmp === null) {
                    throw new Error("Impossible PSD situation");
                }
                if (cmp > 0) {
                    // TODO: Info that flow rate is ambiguous, but some flow is exclusive to us
                    if (object.entity.type === EntityType.PIPE) {
                        const pcalc = this.globalStore.getOrCreateCalculation(object.entity);
                        pcalc.noFlowAvailableReason = NoFlowAvailableReason.UNUSUAL_CONFIGURATION;
                    }
                } else {
                    // TODO comment out temporarily https://h2xengineering.atlassian.net/browse/DEV-443
                    // if (cmp < 0) {
                    //     throw new Error("Invalid PSD situation");
                    // }
                    // we have successfully calculated the pipe's loading units.
                    this.configureEntityForPSD(object.entity, exclusivePsdU, flowEdge, wet, exclusiveProfile, null);
                }
            } else {
                if (isZeroWaterPsdCounts(residualPsdU)) {
                    this.configureEntityForPSD(
                        object.entity,
                        exclusivePsdU,
                        flowEdge,
                        wet,
                        new PsdProfile(),
                        NoFlowAvailableReason.NO_LOADS_CONNECTED
                    );
                } else {
                    // TODO: flow rate is ambiguous, and no flow is exclusive to us.
                    if (object.entity.type === EntityType.PIPE) {
                        const pcalc = this.globalStore.getOrCreateCalculation(object.entity);

                        pcalc.noFlowAvailableReason = NoFlowAvailableReason.UNUSUAL_CONFIGURATION;
                        pcalc.psdUnits = residualPsdU;
                    }
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
                                const hl = getObjectFrictionHeadLoss(
                                    this,
                                    o,
                                    fr,
                                    { connection: o.uid, connectable: o.entity.coldRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.coldOutputUid },
                                    true,
                                    calculation.coldPressureKPA,
                                    PressurePushMode.PSD,
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
                                const hl = getObjectFrictionHeadLoss(
                                    this,
                                    o,
                                    frw,
                                    { connection: o.uid, connectable: o.entity.hotRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.warmOutputUid },
                                    true,
                                    calculation.hotPeakFlowRate,
                                    PressurePushMode.PSD,
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
                                const hl = getObjectFrictionHeadLoss(
                                    this,
                                    o,
                                    fr,
                                    { connection: o.uid, connectable: o.entity.coldRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.coldOutputUid },
                                    true,
                                    calculation.coldPressureKPA,
                                    PressurePushMode.PSD,
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
                                const hl = getObjectFrictionHeadLoss(
                                    this,
                                    o,
                                    frh,
                                    { connection: o.uid, connectable: o.entity.hotRoughInUid },
                                    { connection: o.uid, connectable: o.entity.valve.hotOutputUid },
                                    true,

                                    calculation.hotPeakFlowRate,
                                    PressurePushMode.PSD,
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
                    if (calculation.totalPeakFlowRateLS !== null) {
                        const hl = getObjectFrictionHeadLoss(
                            this,
                            o,
                            calculation.totalPeakFlowRateLS,
                            { connection: o.uid, connectable: o.entity.endpointUid[0] },
                            { connection: o.uid, connectable: o.entity.endpointUid[1] },
                            true,
                            null,
                            PressurePushMode.PSD,
                        );
                        calculation.pressureDropKPA =
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
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);
                    const connections = this.globalStore.getConnections(o.entity.uid);
                    if (connections.length === 2) {
                        const p1 = this.globalStore.get(connections[0])!;
                        const p2 = this.globalStore.get(connections[1])!;
                        if (p1 instanceof Pipe && p2 instanceof Pipe) {
                            const pipeCalc1 = this.globalStore.getOrCreateCalculation(p1.entity);
                            const pipeCalc2 = this.globalStore.getOrCreateCalculation(p2.entity);
                            if (pipeCalc1!.totalPeakFlowRateLS !== null && pipeCalc2!.totalPeakFlowRateLS !== null) {
                                calculation.flowRateLS = Math.min(pipeCalc1!.totalPeakFlowRateLS, pipeCalc2!.totalPeakFlowRateLS);
                            }
                        }
                    }
                    break;
                case EntityType.DIRECTED_VALVE: {
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity) as
                        | DirectedValveCalculation;
                    const connections = this.globalStore.getConnections(o.entity.uid);

                    if (o.entity.valve.type === ValveType.BALANCING) {
                        // Pressure loss should already have been done.
                        break;
                    }

                    if (connections.length === 2) {
                        const p1 = this.globalStore.get(connections[0])!;
                        const p2 = this.globalStore.get(connections[1])!;
                        if (p1 instanceof Pipe && p2 instanceof Pipe) {
                            const pipeCalc1 = this.globalStore.getOrCreateCalculation(p1.entity);
                            const pipeCalc2 = this.globalStore.getOrCreateCalculation(p2.entity);
                            if (pipeCalc1!.totalPeakFlowRateLS !== null && pipeCalc2!.totalPeakFlowRateLS !== null) {
                                calculation.flowRateLS = Math.min(pipeCalc1!.totalPeakFlowRateLS, pipeCalc2!.totalPeakFlowRateLS);

                                const hl1 = getObjectFrictionHeadLoss(
                                    this,
                                    o,
                                    calculation.flowRateLS,
                                    { connectable: o.uid, connection: connections[0] },
                                    { connectable: o.uid, connection: connections[1] },
                                    true,
                                    calculation.pressureKPA,
                                    PressurePushMode.PSD,
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
                                const hl2 = getObjectFrictionHeadLoss(
                                    this,
                                    o,
                                    calculation.flowRateLS,
                                    { connectable: o.uid, connection: connections[1] },
                                    { connectable: o.uid, connection: connections[0] },
                                    true,
                                    calculation.pressureKPA,
                                    PressurePushMode.PSD,
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
                case EntityType.LOAD_NODE:
                case EntityType.SYSTEM_NODE:
                case EntityType.FLOW_SOURCE: {
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity) as
                        | FlowSourceCalculation
                        | SystemNodeCalculation;

                    const conns = this.globalStore.getConnections(o.entity.uid);

                    calculation.flowRateLS = 0;
                    for (const conn of conns) {
                        const p = this.globalStore.get(conn) as Pipe;
                        const pCalc = this.globalStore.getOrCreateCalculation(p.entity);
                        if (pCalc.totalPeakFlowRateLS) {
                            calculation.flowRateLS += pCalc.totalPeakFlowRateLS;
                        }
                    }

                    if (o.entity.type === EntityType.SYSTEM_NODE || o.entity.type === EntityType.LOAD_NODE) {
                        const sc = calculation as SystemNodeCalculation | LoadNodeCalculation;
                        const units = this.getTerminalPsdU({
                            connectable: o.entity.uid,
                            connection: o.entity.parentUid!
                        });

                        let total = zeroPsdCounts();
                        let highestLU = 0;
                        units.forEach((contextual) => {
                            total = addPsdCounts(total, contextual, this.doc, this.catalog);
                            highestLU = Math.max(highestLU, contextual.units);
                        });

                        let newUnits: FinalPsdCountEntry = {
                            units: total.units,
                            dwellings: total.dwellings,
                            continuousFlowLS: total.continuousFlowLS,
                            gasMJH: total.gasMJH,
                            drainageUnits: total.drainageUnits,
                            highestLU,
                        };

                        if (units.length) {
                            sc.psdUnits = newUnits;
                        } else {
                            sc.psdUnits = null;
                        }
                    }
                    break;
                }
                case EntityType.PLANT: {
                    const calc = this.globalStore.getOrCreateCalculation(o.entity);
                    const inlet = this.globalStore.get(o.entity.inletUid)!.entity as SystemNodeEntity;
                    const inletCalc = this.globalStore.getOrCreateCalculation(inlet);
                    calc.pressureDropKPA = getPlantPressureLossKPA(o.entity, this.drawing, inletCalc.pressureKPA);
                    break;
                }
                case EntityType.FIXTURE:
                case EntityType.GAS_APPLIANCE:
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
                case EntityType.PIPE: {
                    const thisIsDrainage = isDrainage(o.entity.systemUid);
                    const calc = this.globalStore.getOrCreateCalculation(o.entity);
                    if (!thisIsDrainage) {
                        const filled = fillPipeDefaultFields(this.doc.drawing, (o as Pipe).computedLengthM, o.entity);
                        const pipeSpec = (o as Pipe).getCatalogBySizePage(this);
                        
                        if (pipeSpec) {
                            const maxWorking = parseCatalogNumberExact(pipeSpec.safeWorkingPressureKPA);
                            const ca = this.entityStaticPressureKPA.get(o.entity.endpointUid[0]);
                            const cb = this.entityStaticPressureKPA.get(o.entity.endpointUid[1]);
                            const actualPressure = Math.max(ca || 0, cb || 0);

                            if (maxWorking !== null) {
                                if (actualPressure > maxWorking) {
                                    const [units, maxWorkingDisplay] =
                                        convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, maxWorking);
                                    const [_, actualPressureDisplay] =
                                        convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, actualPressure);
                                    calc.warning = `Max pressure ${maxWorkingDisplay}${units} exceeded (${actualPressureDisplay}${actualPressure})`;
                                }
                            }
                        }
                    }
                    if (!calc || (o.entity.systemUid===StandardFlowSystemUids.Gas &&  calc.PSDFlowRateLS === null && calc.optimalInnerPipeDiameterMM === null)) {
                        calc.warning =`Pressure at upstream source/regulator needs to be higher than downstream regulator/appliance`
                    }
                    break;
                }
                case EntityType.FLOW_SOURCE:
                    break;
                case EntityType.SYSTEM_NODE:
                    break;
                case EntityType.BIG_VALVE: {
                    let calc = this.globalStore.getOrCreateCalculation(o.entity);
                    let maxFlowRateLS = null;
                    let manufacturer = 'generic';
                    switch (o.entity.valve.type) {
                        case BigValveType.TMV:
                            manufacturer = this.doc.drawing.metadata.catalog.mixingValves.find((material: SelectedMaterialManufacturer) => material.uid === 'tmv')?.manufacturer || 'generic';
                            maxFlowRateLS = parseCatalogNumberExact(this.catalog.mixingValves.tmv.maxFlowRateLS[manufacturer]);
                            break;
                        case BigValveType.TEMPERING:
                            manufacturer = this.doc.drawing.metadata.catalog.mixingValves.find((material: SelectedMaterialManufacturer) => material.uid === 'temperingValve')?.manufacturer || 'generic';
                            maxFlowRateLS = parseCatalogNumberExact(this.catalog.mixingValves.temperingValve.maxFlowRateLS[manufacturer]);
                            break;
                        case BigValveType.RPZD_HOT_COLD:
                            break;
                        default:
                            assertUnreachable(o.entity.valve);
                    }
                    if (maxFlowRateLS !== null) {
                        if ((calc.hotPeakFlowRate || 0) > maxFlowRateLS || (calc.coldPeakFlowRate || 0) > maxFlowRateLS) {
                            const [units, converted] =
                                convertMeasurementSystem(this.doc.drawing.metadata.units, Units.LitersPerSecond, maxFlowRateLS);
                            calc.warning = `Max Flow Rate ${converted}${units} exceeded`;
                        }
                    }
                    break;
                }
                case EntityType.FIXTURE: {
                    const e = fillFixtureFields(this.doc.drawing, this.catalog, o.entity);
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);

                    for (const suid of e.roughInsInOrder) {
                        if (calculation.inlets[suid].pressureKPA === null) {
                            if (!isDrainage(suid)) {
                                if (!calculation.warning) {
                                    calculation.warning = " ";
                                }
                            }
                        } else if ((calculation.inlets[suid].pressureKPA || 0) < e.roughIns[suid].minPressureKPA!) {
                            const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === suid)!;
                            const [units, converted] =
                                convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, e.roughIns[suid].minPressureKPA);
                            calculation.warning =
                                "Not enough " +
                                system.name +
                                " pressure. Required: " +
                                (converted as number).toFixed(0) +
                                units;
                        } else if ((calculation.inlets[suid].staticPressureKPA || 0) > e.roughIns[suid].maxPressureKPA!) {
                            const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === suid)!;
                            const [units, converted] =
                                convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, e.roughIns[suid].maxPressureKPA);
                            calculation.warning =
                                system.name +
                                " pressure overload. Max: " +
                                (converted as number).toFixed(0) +
                                units;
                        }
                    }
                    if (!(o as Fixture).validateConnectionPoints()) {
                        calculation.warning = "Connect the fixture to a flow system";
                        calculation.warningLayout =this.doc.uiState.pressureOrDrainage;
                    }  
                    if(calculation.warning && calculation.warning===" ")  calculation.warning=null;
                  break;
                }
                case EntityType.DIRECTED_VALVE: {
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);
                    switch (o.entity.valve.type) {
                        case ValveType.CHECK_VALVE:
                        case ValveType.ISOLATION_VALVE:
                        case ValveType.WATER_METER:
                        case ValveType.STRAINER:
                        case ValveType.RPZD_SINGLE:
                        case ValveType.RPZD_DOUBLE_SHARED:
                        case ValveType.RPZD_DOUBLE_ISOLATED:
                        case ValveType.BALANCING:
                        case ValveType.GAS_REGULATOR:
                        case ValveType.FILTER:
                        case ValveType.FLOOR_WASTE:
                        case ValveType.INSPECTION_OPENING:
                        case ValveType.REFLUX_VALVE:
                            break;
                        case ValveType.PRV_SINGLE:
                        case ValveType.PRV_DOUBLE:
                        case ValveType.PRV_TRIPLE: {
                            const manufacturer = this.doc.drawing.metadata.catalog.prv[0]?.manufacturer || 'generic';
                            const inPressure = calculation.pressureKPA;

                            if (inPressure !== null && calculation.sizeMM !== null) {
                                const maxInletPressure = parseCatalogNumberExact(lowerBoundTable(this.catalog.prv.size[manufacturer], calculation.sizeMM, (prv) => Number(prv.diameterNominalMM))!.maxInletPressureKPA);

                                if (maxInletPressure !== null && inPressure > maxInletPressure) {
                                    const [units, converted] = convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, maxInletPressure);
                                    calculation.warning = 'Max pressure of ' + (converted as number).toFixed(2) + units + ' exceeded';
                                }
                            }

                            if (
                                inPressure !== null &&
                                o.entity.valve.targetPressureKPA !== null &&
                                calculation.sizeMM !== null
                            ) {
                                const ratio = parseCatalogNumberExact(lowerBoundTable(this.catalog.prv.size[manufacturer], calculation.sizeMM, (prv) => Number(prv.diameterNominalMM))!.maxPressureDropRatio);
                                if (ratio !== null && inPressure > o.entity.valve.targetPressureKPA * ratio) {
                                    const [units, inPressureConverted] =
                                        convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, inPressure);
                                    const [_, targetConverted] =
                                        convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, o.entity.valve.targetPressureKPA);
                                    calculation.warning =
                                        "Pressure of " +
                                        (inPressureConverted as number).toFixed(2) +
                                        units +
                                        " is more than " +
                                        ratio +
                                        "x the target pressure of " +
                                        targetConverted +
                                        units;
                                }
                            }
                            break;
                        }
                        default:
                            assertUnreachable(o.entity.valve);
                    }
                    break;
                }
                case EntityType.RISER:
                case EntityType.PLANT:
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);
                    if (!(o as Plant).validateConnectionPoints()) {
                        calculation.warning = "Flow System Not Connected to Plant";
                    }
                    break;
                case EntityType.LOAD_NODE: {
                    const filled = fillDefaultLoadNodeFields(this.doc, this.globalStore, o.entity, this.catalog, this.nodes);
                    const calc = this.globalStore.getOrCreateCalculation(filled);
                    if (calc.pressureKPA !== null && filled.maxPressureKPA !== null && calc.pressureKPA > filled.maxPressureKPA!) {
                        const [units, pConverted] =
                            convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, calc.pressureKPA);
                        const [_, mpConverted] =
                            convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, filled.maxPressureKPA);

                        calc.warning = 'Max pressure exceeded ('
                            + (pConverted as number).toFixed(2) + units + ' > '
                            + (mpConverted as number).toFixed(2) + units;
                    } else if (calc.pressureKPA !== null && filled.minPressureKPA !== null && calc.pressureKPA < filled.minPressureKPA &&  filled.systemUidOption != "gas") {
                        const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === filled.systemUidOption)!;

                        const [units, converted] =
                            convertMeasurementSystem(this.doc.drawing.metadata.units, Units.KiloPascals, filled.minPressureKPA);
                        calc.warning =
                                "Not enough " +
                                system.name +
                                " pressure. Required: " +
                                (converted as number).toFixed(0) +
                                units;
                    }
                    break;
                }
                case EntityType.GAS_APPLIANCE:
                    // TODO: Gas applicance warnings - like not enough gas pressure.
                    break;
                default:
                    assertUnreachable(o.entity);
            }
        }
    }

    serializeDirectedEdge(edge: Edge<FlowNode | undefined, FlowEdge | undefined>, dst: FlowNode) {
        return dst.connection + " " + dst.connectable + " " + edge.uid;
    }

    precomputePsdAfterBridge(
        bridge: Edge<FlowNode | undefined, FlowEdge | undefined>,
        dst: FlowNode,
        visitedEdges: Set<string>
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
                    for (var i = 0; i < res.length; i++) {
                        insertPsdProfile(retVal, res[i]);
                    }
                },
                undefined,
                (edge) => {
                    // Edge case: Do not push flow, including sewer flow, through vents.
                    if (edge.value.type === EdgeType.PIPE) {
                        const pipe = this.globalStore.get(edge.value.uid);
                        if (pipe && pipe.entity.type === EntityType.PIPE && isDrainage(pipe.entity.systemUid)) {
                            if (pipe.entity.network === NetworkType.CONNECTIONS) {
                                return true;
                            }
                        }
                    }

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
                false
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
                    for (var i = 0; i < units.length; i++) {
                        insertPsdProfile(inThisGroup, units[i]);
                    }
                },
                undefined,
                (e) => {
                    // Edge case: Do not push flow, including sewer flow, through vents.
                    if (e.value.type === EdgeType.PIPE) {
                        const pipe = this.globalStore.get(e.value.uid);
                        if (pipe && pipe.entity.type === EntityType.PIPE && isDrainage(pipe.entity.systemUid)) {
                            if (pipe.entity.network === NetworkType.CONNECTIONS) {
                                return true;
                            }
                        }
                    }

                    const pc = this.globalStore.getOrCreateCalculation((this.globalStore.get(e.value.uid) as Pipe).entity);
                    // Some pipes may have their flow directions fixed in an earlier step (such as return systems)
                    if (pc.flowFrom) {
                        if (e.from.connectable !== pc.flowFrom) {
                            visitedEdges.delete(e.uid);
                            return true;
                        }
                    }

                    if (this.allBridges.has(e.uid)) {
                        seenBridges.add(e.uid);
                        return true;
                    }
                },
                undefined,
                undefined,
                visitedEdges,
                true,
                false
            );

            const excludedProfile = new PsdProfile();
            const existing = this.psdProfileWithinGroup.get(start.uid)!;
            for (const f of existing.values()) {
                insertPsdProfile(excludedProfile, f);
            }
            subtractPsdProfiles(excludedProfile, inThisGroup);

            for (const child of this.childBridges.get(start.uid)!) {
                if (!seenBridges.has(child.uid)) {
                    const cpsd = this.psdAfterBridgeCache.get(this.serializeDirectedEdge(child, child.to))!;
                    for (const f of cpsd.values()) {
                        insertPsdProfile(excludedProfile, f);
                    }
                }
            }
            return excludedProfile;
        } else {
            // there was no flow to this edge anyway.
            return false;
        }
    }

    // This will be correct, with the bridge group cache optimization, as long as the excluded nodes and excluded
    // edges are in the same bi-connected component. If not, then this function will use the cache to potentially fetch
    // results from groups that would have changed if the nodes or edges were excluded.
    getDownstreamPsdUs(starts: FlowNode[], excludedNodes: string[] = [], excludedEdges: string[] = []): PsdProfile {
        const seen = new Set<string>(excludedNodes);
        const seenEdges = new Set<string>(excludedEdges);

        const psdUs = new PsdProfile();

        for (const r of starts) {
            this.flowGraph.dfs(
                r,
                (n) => {
                    const thisTerminal = this.getTerminalPsdU(n);
                    for (var i = 0; i < thisTerminal.length; i++) {
                        insertPsdProfile(psdUs, thisTerminal[i]);
                    }
                },
                undefined,
                (e) => {
                    // Edge case: Do not push flow, including sewer flow, through vents.
                    if (e.value.type === EdgeType.PIPE) {
                        const pipe = this.globalStore.get(e.value.uid);
                        if (pipe && pipe.entity.type === EntityType.PIPE && isDrainage(pipe.entity.systemUid)) {
                            if (pipe.entity.network === NetworkType.CONNECTIONS) {
                                return true;
                            }
                        }
                    }

                    if (e.value.type === EdgeType.PIPE) {
                        const pc = this.globalStore.getOrCreateCalculation((this.globalStore.get(e.value.uid) as Pipe).entity);

                        // Some pipes may have their flow directions fixed in an earlier step (such as return systems)
                        if (pc.flowFrom) {
                            if (e.from.connectable !== pc.flowFrom) {
                                //seenEdges.delete(e.uid);
                                return true;
                            }
                        }
                    }

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

    sizeMixingValveForFlowRate(fr: number, manufacturer: string): number {
        switch (manufacturer) {
            case "galvin":
                if (fr > 0.51 ) {
                    return 20;
                }
        
                return 15;
            case "enware":
                if (fr > 0.65 ) {
                    return 2500;
                }
        
                return 1500;
            default:
                if (fr >= 0.49 ) {
                    return 25;
                }
        
                return 15;
        }
    }
}
