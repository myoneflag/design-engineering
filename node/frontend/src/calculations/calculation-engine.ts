import {DocumentState, DrawingState} from '../../src/store/document/types';
import {GlobalStore, ObjectStore, SelectionTarget} from '../../src/htmlcanvas/lib/types';
import {EntityType} from '../../src/store/document/entities/types';
import PipeEntity, {fillPipeDefaultFields, makePipeFields} from '../../src/store/document/entities/pipe-entity';
import {makeValveFields} from '../../src/store/document/entities/fitting-entity';
import {makeRiserFields} from '../store/document/entities/riser-entity';
import TmvEntity, {makeTMVFields, SystemNodeEntity} from '../../src/store/document/entities/tmv/tmv-entity';
import FixtureEntity, {
    fillFixtureFields,
    makeFixtureFields
} from '../../src/store/document/entities/fixtures/fixture-entity';
import {DemandType} from '../../src/calculations/types';
import Graph from '../../src/calculations/graph';
import EquationEngine from '../../src/calculations/equation-engine';
import {Catalog, PipeSpec} from '../../src/store/catalog/types';
import BaseBackedObject from '../../src/htmlcanvas/lib/base-backed-object';
import UnionFind from '../../src/calculations/union-find';
import {cloneSimple} from '../../src/lib/utils';
import {
    interpolateTable,
    lowerBoundTable,
    parseCatalogNumberExact,
    parseCatalogNumberOrMax,
    parseCatalogNumberOrMin,
    upperBoundTable,
} from '../../src/htmlcanvas/lib/utils';
import Pipe from '../../src/htmlcanvas/objects/pipe';
import {
    getDarcyWeisbachMH,
    getFluidDensityOfSystem,
    getFrictionFactor,
    getReynoldsNumber,
    head2kpa,
} from '../../src/calculations/pressure-drops';
import FlowSolver from '../../src/calculations/flow-solver';
import {PropertyField} from '../../src/store/document/entities/property-field';
import {MainEventBus} from '../../src/store/main-event-bus';
import {getObjectFrictionHeadLoss} from '../../src/calculations/entity-pressure-drops';
import {DrawableEntityConcrete} from '../../src/store/document/entities/concrete-entity';
import Riser from '../htmlcanvas/objects/riser';
import {assertUnreachable, isGermanStandard} from '../../src/config';
import Tmv from '../../src/htmlcanvas/objects/tmv/tmv';
// tslint:disable-next-line:max-line-length
import DirectedValveEntity, {
    determineConnectableSystemUid,
    makeDirectedValveFields,
} from '../../src/store/document/entities/directed-valves/directed-valve-entity';
import {ValveType} from '../../src/store/document/entities/directed-valves/valve-types';
import {lookupFlowRate} from '../../src/calculations/utils';
import FittingCalculation from '../../src/store/document/calculations/fitting-calculation';
import RiserCalculation from '../store/document/calculations/riser-calculation';
import DirectedValveCalculation from '../../src/store/document/calculations/directed-valve-calculation';
import SystemNodeCalculation from '../../src/store/document/calculations/system-node-calculation';
import {StandardFlowSystemUids} from '../../src/store/catalog';
import {isCalculated} from "../store/document/calculations";
import DrawableObjectFactory from "../htmlcanvas/lib/drawable-object-factory";
import {Calculated} from "../htmlcanvas/lib/object-traits/calculated-object";
import {isConnectableEntity} from "../store/document";
import stringify from "json-stable-stringify";

export const SELF_CONNECTION = 'SELF_CONNECTION';


export default class CalculationEngine {

    globalStore!: GlobalStore;
    networkObjectUids: string[] = [];
    drawableObjectUids: string[] = [];

    doc!: DocumentState;
    demandType!: DemandType;
    flowGraph!: Graph<FlowNode, FlowEdge>;
    equationEngine!: EquationEngine;
    catalog!: Catalog;
    drawing!: DrawingState;
    ga!: number;

    get networkObjects(): BaseBackedObject[] {
        return this.networkObjectUids.map((u) => this.globalStore.get(u)!);
    }

    get drawableObjects(): BaseBackedObject[] {
        return this.drawableObjectUids.map((u) => this.globalStore.get(u)!);
    }


    calculate(
        objectStore: GlobalStore,
        doc: DocumentState,
        catalog: Catalog,
        demandType: DemandType,
        done: () => void,
    ) {
        this.globalStore = objectStore;
        this.globalStore.forEach((o) => this.globalStore.bustDependencies(o.uid));
        if (this.globalStore.dependedBy.size) {
            throw new Error("couldn't clear cache, dependedBy still " + JSON.stringify(this.globalStore.dependedBy, (key, value) => {
                if (value instanceof Map) {
                    return [...value];
                }
                return value;
            }));
        }
        if (this.globalStore.dependsOn.size) {
            throw new Error("couldn't clear cache, dependsOn still " + JSON.stringify([...this.globalStore.dependsOn], (key, value) => {
                if (value instanceof Map) {
                    return [...value];
                }
                return value;
            }));
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
            return;
        }

        setTimeout(() => {
                this.doRealCalculation();
                done();
            },
            0);
        this.equationEngine = new EquationEngine();
    }

    clearCalculations() {
        this.globalStore.clearCalculations();
        this.networkObjects.forEach((v) => {
            if (isCalculated(v.entity)) {
                this.globalStore.getOrCreateCalculation(v.entity);
            }
        });
    }

    preValidate(): boolean {
        let selectObject: SelectionTarget | null = null;

        this.globalStore.forEach((obj) => {
            let fields: PropertyField[] = [];
            switch (obj.entity.type) {
                case EntityType.RISER:
                    fields = makeRiserFields([], []);
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
                    fields = makeDirectedValveFields(this.doc.drawing.metadata.flowSystems, obj.entity.valve);
                    break;
                case EntityType.SYSTEM_NODE:
                case EntityType.BACKGROUND_IMAGE:
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

    doRealCalculation() {
        this.clearCalculations();

        const sanityPassed = this.sanityCheck(this.globalStore, this.doc);

        try {
            if (sanityPassed) {
                this.buildNetworkObjects();
                this.configureLUFlowGraph();

                this.preCompute();
                // The remaining graph must be a rooted forest.
                const sources: FlowNode[] = this.networkObjects
                    .filter((o) => o.type === EntityType.RISER)
                    .map((o) => ({connectable: o.uid, connection: SELF_CONNECTION}));
                console.log('start size definite');
                this.sizeDefiniteTransports(sources);
                console.log('start calculating point pressures');
                //this.sizeRingsAndRoots(sources);
                this.calculateAllPointPressures(sources);
                console.log('start filling pressure fields, warnings, collecting results');
                this.fillPressureDropFields();
                this.createWarnings();

                this.collectResults();
                console.log('finish calculating');
            }
        } finally {
            this.removeNetworkObjects();
            this.networkObjectUids = [];
        }


        if (!this.equationEngine.isComplete()) {
            throw new Error('Calculations could not complete \n');
        }
    }

    // Take the calcs from the invisible network and collect them into the visible results.
    collectResults() {
        this.drawableObjects.forEach((o) => {
            if (isCalculated(o.entity)) {
                this.globalStore.setCalculation(o.uid, (o as unknown as Calculated).collectCalculations(this));
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
                    throw new Error('Projected entity already exists: ' + JSON.stringify(e));
                }

                // all z coordinates are thingos.
                if (isConnectableEntity(e)) {
                    if (e.calculationHeightM === null) {
                        throw new Error('entities in the calculation phase must be 3d - ' + e.uid + ' ' + e.type);
                    }
                }

                (e as any).__calc__ = true;
                DrawableObjectFactory.buildGhost(
                    () => e,
                    this.globalStore,
                    this.globalStore.levelOfEntity.get(o.uid)!,
                    undefined,
                );
                // this.globalStore.set(e.uid, e); this is already done by DrawableObjectFactory

                this.networkObjectUids.push(e.uid);
            });
        });
    }

    removeNetworkObjects() {
        this.networkObjectUids.forEach((uid) => {
            this.globalStore.delete(uid);
        })
    }

    preCompute() {
        this.networkObjects.forEach((o) => {
            if (o.entity.type === EntityType.PIPE) {
                const c = this.globalStore.getOrCreateCalculation(o.entity);
                c.lengthM = o.entity.lengthM == null ? (o as Pipe).computedLengthM : o.entity.lengthM;
            }
        });
    }

    calculateAllPointPressures(sources: FlowNode[]) {
        this.precomputePeakKPAPoints();

        this.networkObjects.forEach((obj) => {
            const entity = obj.entity;
            switch (entity.type) {
                case EntityType.FIXTURE: {
                    const calculation = this.globalStore.getOrCreateCalculation(entity);
                    calculation.coldPressureKPA =
                        this.getAbsolutePressurePoint(
                            {connectable: entity.coldRoughInUid, connection: entity.uid},
                            sources,
                        );
                    if (entity.warmRoughInUid) {
                        calculation.warmPressureKPA =
                            this.getAbsolutePressurePoint(
                                {connectable: entity.warmRoughInUid, connection: entity.uid},
                                sources,
                            );
                    }
                }
                    break;
                case EntityType.TMV: {
                    const calculation = this.globalStore.getOrCreateCalculation(entity);
                    calculation.coldPressureKPA =
                        this.getAbsolutePressurePoint(
                            {connectable: entity.coldRoughInUid, connection: entity.uid},
                            sources,
                        );
                    calculation.hotPressureKPA =
                        this.getAbsolutePressurePoint(
                            {connectable: entity.hotRoughInUid, connection: entity.uid},
                            sources,
                        );
                }
                    break;
                case EntityType.RISER:
                case EntityType.DIRECTED_VALVE:
                case EntityType.FITTING:
                case EntityType.SYSTEM_NODE:
                    const calculation = this.globalStore.getOrCreateCalculation(entity) as
                        RiserCalculation | DirectedValveCalculation | FittingCalculation | SystemNodeCalculation;
                    const candidates = cloneSimple(this.globalStore.getConnections(entity.uid));
                    if (entity.type === EntityType.RISER) {
                        candidates.push(SELF_CONNECTION);
                    } else if (entity.type === EntityType.SYSTEM_NODE) {
                        candidates.push(entity.parentUid!);
                    }
                    let maxPressure: number | null = null;
                    let minPressure: number | null = null;
                    candidates.forEach((cuid) => {
                        const thisPressure = this.getAbsolutePressurePoint(
                            {connectable: entity.uid, connection: cuid},
                            sources,
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
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.PIPE:
                    break;
                default:
                    assertUnreachable(entity);
            }
        });
    }

    getAbsolutePressurePoint(node: FlowNode, sources: FlowNode[]) {
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
                            case EntityType.TMV:
                                height = par.entity.heightAboveFloorM;
                                break;
                            case EntityType.FIXTURE:
                                const filled = fillFixtureFields(this.doc.drawing, this.catalog, par.entity);
                                height = filled.outletAboveFloorM!;
                                break;
                            case EntityType.DIRECTED_VALVE:
                            case EntityType.FITTING:
                            case EntityType.BACKGROUND_IMAGE:
                            case EntityType.RISER:
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
                case EntityType.RISER:
                case EntityType.PIPE:
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.TMV:
                case EntityType.FIXTURE:
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
                    const source = this.globalStore.get(n.connectable) as Riser;
                    const density = getFluidDensityOfSystem(source.entity.systemUid, this.doc, this.catalog)!;
                    const mh = source.entity.pressureSourceHeightM! - heightM;
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


    entityMaxPressuresKPA = new Map<string, number | null>();

    /**
     * In a peak flow graph, flow paths don't represent a valid network flow state, and sometimes, don't
     * even have a direction for each pipe.
     * One strategy to get a sane pressure drop to a point is to find the smallest pressure drop from it to
     * any source along the least pressure drop path.
     */
    precomputePeakKPAPoints() {
        this.networkObjects.forEach((o) => {
            if (o.entity.type === EntityType.RISER) {
                const e = o.entity;
                // Dijkstra to all objects, recording the max pressure that's arrived there.
                console.log('riser found: ' + o.uid);
                this.flowGraph.dijkstra(
                    { connectable: o.uid, connection: SELF_CONNECTION },
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
                                    const headLoss =
                                        obj.getFrictionHeadLoss(this, calculation.peakFlowRate, edge.from, edge.to, true);
                                    if (headLoss === null) {
                                        return -Infinity;
                                    }

                                    return head2kpa(
                                        headLoss,
                                        getFluidDensityOfSystem(obj.entity.systemUid, this.doc, this.catalog)!,
                                        this.ga,
                                    );
                                } else {
                                    throw new Error('misconfigured flow graph');
                                }
                            case EdgeType.TMV_HOT_WARM:
                            case EdgeType.TMV_COLD_WARM:
                            case EdgeType.TMV_COLD_COLD: {
                                if (obj instanceof Tmv) {
                                    const calculation = this.globalStore.getOrCreateCalculation(obj.entity);
                                    if (!calculation) {
                                        return Infinity;
                                    }

                                    let fr: number | null = null;

                                    let systemUid: string = '';

                                    if (edge.value.type === EdgeType.TMV_COLD_COLD &&
                                        flowFrom.connectable === obj.entity.coldRoughInUid) {

                                        fr = calculation.coldPeakFlowRate;
                                        systemUid = (this.globalStore.get(obj.entity.coldRoughInUid)!
                                            .entity as SystemNodeEntity).systemUid;
                                    } else if (edge.value.type === EdgeType.TMV_HOT_WARM &&
                                        flowFrom.connectable === obj.entity.hotRoughInUid) {
                                        fr = calculation.hotPeakFlowRate;
                                        systemUid = (this.globalStore.get(obj.entity.hotRoughInUid)!
                                            .entity as SystemNodeEntity).systemUid;
                                    } else {
                                        throw new Error('Misused TMV');
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
                                    );
                                    return hl === null ? -Infinity : head2kpa(
                                        hl,
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
                                    (obj.entity as DirectedValveEntity),
                                )!;

                                if (dist !== null) {
                                    const hl = getObjectFrictionHeadLoss(
                                        this,
                                        obj,
                                        dist,
                                        flowFrom,
                                        flowTo,
                                    );
                                    const val = hl === null ? -Infinity : head2kpa(
                                        hl,
                                        getFluidDensityOfSystem(systemUid, this.doc, this.catalog)!,
                                        this.ga,
                                    );
                                    return val;
                                } else {
                                    return 1000000;
                                }
                            }
                        }
                    },
                    (dijk) => {
                        let finalPressureKPA: number | null;
                        if (dijk.weight >= 0) {
                            finalPressureKPA = e.pressureKPA! - dijk.weight;
                        } else {
                            finalPressureKPA = null;
                        }
                        console.log(finalPressureKPA + ' ' + e.pressureKPA + ' ' + dijk.weight);
                        if (this.entityMaxPressuresKPA.has(dijk.node.connectable)) {
                            const existing = this.entityMaxPressuresKPA.get(dijk.node.connectable)!;
                            if (existing !== null && (finalPressureKPA === null || existing < finalPressureKPA)) {
                                //throw new Error('new size is larger than us ' + existing + ' ' + finalPressureKPA);
                            }
                        } else {
                            this.entityMaxPressuresKPA.set(dijk.node.connectable, finalPressureKPA);
                        }
                    }
                )
            }
        })
    }

    // Just like a flow graph, but only connects when loading units are transferred.
    configureLUFlowGraph() {
        this.flowGraph = new Graph<FlowNode, FlowEdge>((node) => node.connection + ' ' + node.connectable);
        this.networkObjects.forEach((obj) => {
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
                        stringify(ev),
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
                        stringify(ev1),
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
                            stringify(ev2),
                        );
                    }
                    break;
                case EntityType.RISER:
                case EntityType.SYSTEM_NODE:
                case EntityType.FITTING:
                    const toConnect = cloneSimple(this.globalStore.getConnections(obj.entity.uid));
                    if (obj.entity.type === EntityType.RISER) {
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
                case EntityType.FIXTURE:
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
                throw new Error('directed valve with unknown direction');
            }
            if (!connections.includes(entity.sourceUid)) {
                throw new Error('directed valve with invalid direction');
            }
            const other = connections.find((uid) => uid !== entity.sourceUid)!;

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
        } else if (connections.length > 2) {
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
            const source = this.globalStore.get(s.connectable)!;
            if (source.entity.type === EntityType.RISER) {
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
                        warning: null,
                    });
                    pipesThatNeedSizing.add(pipeObj.entity.uid);
                } else if (calculation.realInternalDiameterMM === null) {
                    const filled = fillPipeDefaultFields(this.doc.drawing, pipeObj.computedLengthM, pipeObj.entity);
                    const initialSize = lowerBoundTable(this.catalog.pipes[filled.material!].pipesBySize, 0)!;

                    calculation.realInternalDiameterMM =
                        parseCatalogNumberExact(initialSize.diameterInternalMM);
                    calculation.realNominalPipeDiameterMM =
                        parseCatalogNumberExact(initialSize.diameterNominalMM);

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
                const flow = assignment.getFlow(stringify({type: EdgeType.PIPE, uid: target}));

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

    getTerminalPsdU(flowNode: FlowNode): number {
        const node = this.globalStore.get(flowNode.connectable)!;

        if (node.type === EntityType.SYSTEM_NODE) {
            const parent = this.globalStore.get(flowNode.connection);
            if (parent === undefined) {
                throw new Error('System node is missing parent. ' + JSON.stringify(node));
            }
            switch (parent.type) {
                case EntityType.FIXTURE:
                    const fixture = parent.entity as FixtureEntity;
                    const mainFixture = fillFixtureFields(this.doc.drawing, this.catalog, fixture);

                    if (node.uid === fixture.coldRoughInUid) {
                        if (isGermanStandard(this.doc.drawing.metadata.calculationParams.psdMethod)) {
                            return Number(mainFixture.designFlowRateCold);
                        } else {
                            return Number(mainFixture.loadingUnitsCold!);
                        }
                    } else if (node.uid === fixture.warmRoughInUid) {
                        if (isGermanStandard(this.doc.drawing.metadata.calculationParams.psdMethod)) {
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
                case EntityType.RISER:
                case EntityType.FLOW_RETURN:
                case EntityType.PIPE:
                case EntityType.FITTING:
                case EntityType.TMV:
                case EntityType.SYSTEM_NODE:
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
                const calculation = this.globalStore.getOrCreateCalculation(entity);
                calculation.psdUnits = psdU;

                const flowRate = lookupFlowRate(psdU, this.doc, this.catalog);

                if (flowRate === null) {
                    // Warn for no PSD
                    if (psdU === 0) {
                        this.sizePipeForFlowRate(entity, 0);
                    }
                } else {

                    this.sizePipeForFlowRate(entity, flowRate);
                }

                return;
            }
            case EntityType.TMV: {
                const calculation = this.globalStore.getOrCreateCalculation(entity);
                const flowRate = lookupFlowRate(psdU, this.doc, this.catalog);

                if (flowEdge.type === EdgeType.TMV_COLD_COLD) {
                    calculation.coldPsdUs = psdU;
                    calculation.coldPeakFlowRate = flowRate;
                } else if (flowEdge.type === EdgeType.TMV_HOT_WARM) {
                    calculation.hotPsdUs = psdU;
                    calculation.hotPeakFlowRate = flowRate;
                } else {
                    throw new Error('invalid edge in TMV');
                }

                return;
            }
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.RISER:
            case EntityType.FITTING:
            case EntityType.DIRECTED_VALVE:
            case EntityType.SYSTEM_NODE:
            case EntityType.FIXTURE:
                throw new Error('Cannot configure this entity to accept loading units');
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
            flowRateLS = flowRateLS * (1 + system.spareCapacity / 100);
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
                this.ga,
            );
        }
    }

    calculateInnerDiameter(pipe: PipeEntity): number {
        const computed = fillPipeDefaultFields(this.doc.drawing, 0, pipe);

        const calculation = this.globalStore.getOrCreateCalculation(pipe);

        // depends on pipe sizing method
        if (this.doc.drawing.metadata.calculationParams.pipeSizingMethod === 'velocity') {
            // http://www.1728.org/flowrate.htm
            return Math.sqrt(
                4000 * calculation.peakFlowRate! / (Math.PI * computed.maximumVelocityMS!),
            );
        } else {
            throw new Error('Pipe sizing strategy not supported');
        }
    }

    getPipePressureDropMH(pipe: PipeEntity): number {
        const obj = this.globalStore.get(pipe.uid) as Pipe;
        const filled = fillPipeDefaultFields(this.doc.drawing, obj.computedLengthM, pipe);

        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        const realPipe = lowerBoundTable(
            this.catalog.pipes[filled.material!].pipesBySize,
            calculation.optimalInnerPipeDiameterMM!,
        )!;
        const roughness = parseCatalogNumberExact(realPipe.colebrookWhiteCoefficient);
        const realInternalDiameter = parseCatalogNumberExact(realPipe.diameterInternalMM);

        const system = this.doc.drawing.metadata.flowSystems.find((s) => s.uid === pipe.systemUid)!;

        const fluidDensity = parseCatalogNumberExact(this.catalog.fluids[system.fluid].densityKGM3);
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
                    calculation.velocityRealMS!,
                    realInternalDiameter!,
                    dynamicViscosity!,
                ),
            ),
            calculation.lengthM!,
            realInternalDiameter!,
            calculation.velocityRealMS!,
            this.ga,
        );
    }

    getVelocityRealMs(pipe: PipeEntity) {
        // http://www.1728.org/flowrate.htm

        const calculation = this.globalStore.getOrCreateCalculation(pipe);
        return 4000 * calculation.peakFlowRate! /
            (Math.PI * parseCatalogNumberExact(calculation.realInternalDiameterMM)! ** 2);
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
            throw new Error('Material doesn\'t exist anymore ' + JSON.stringify(pipeFilled));
        }

        const a = lowerBoundTable(
            table.pipesBySize,
            calculation.optimalInnerPipeDiameterMM!,
            (p) => {
                const v = parseCatalogNumberExact(p.diameterInternalMM);
                if (!v) {
                    throw new Error('no nominal diameter');
                }
                return v;
            }
        );

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
        this.networkObjects.forEach((object) => {
            switch (object.entity.type) {
                case EntityType.TMV:
                    console.log('tmv');
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
                    console.log('pipe');
                    if (object.entity.endpointUid[0] === null || object.entity.endpointUid[1] === null) {
                        throw new Error('pipe has dry endpoint: ' + object.entity.uid);
                    }
                    this.sizeDefiniteTransport(
                        object,
                        roots,
                        totalReachedPsdU,
                        {type: EdgeType.PIPE, uid: object.uid},
                        [object.entity.endpointUid[0], object.entity.endpointUid[1]],
                    );
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.RISER:
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

        console.log('sizing ' + object.uid);
        const reachedPsdU = this.getTotalReachedPsdU(roots, [], [stringify(flowEdge)]);
        const exclusivePsdU = totalReachedPsdU - reachedPsdU;


        if (exclusivePsdU > 0) {
            const [point] = this.getDryEndpoints(endpointUids, flowEdge, roots);
            const [wet] = this.getWetEndpoints(endpointUids, flowEdge, roots);
            const residualPsdU = this.getTotalReachedPsdU(
                [{connectable: point, connection: object.uid}],
                [wet],
                [stringify(flowEdge)],
            );

            if (residualPsdU > exclusivePsdU) {
                console.log('some but not all ' + object.uid + ' ' + residualPsdU + ' ' + exclusivePsdU + ' ' + JSON.stringify(this.getDryEndpoints(endpointUids, flowEdge, roots)) + ' ' + JSON.stringify(this.getWetEndpoints(endpointUids, flowEdge, roots)));
                // TODO: Info that flow rate is ambiguous, but some flow is exclusive to us
            } else {
                console.log('success ' + object.uid);
                // we have successfully calculated the pipe's loading units.
                this.configureEntityForPSD(object.entity, exclusivePsdU, flowEdge);
            }
        } else {
            // zero exclusive to us. Work out whether this is because we don't have any fixture demand.

            const wets = this.getWetEndpoints(endpointUids, flowEdge, roots);
            let residualPsdU = 0;
            if (wets.length === 1) {
                const [point] = this.getDryEndpoints(endpointUids, flowEdge, roots);
                residualPsdU = this.getTotalReachedPsdU(
                    [{connectable: point, connection: object.uid}],
                    [wets[0]],
                    [stringify(flowEdge)],
                );
            } else if (wets.length === 2) {
                residualPsdU = this.getTotalReachedPsdU(
                    [{connectable: wets[0], connection: object.uid}],
                    [],
                    [],
                );
            } // else, with 0 sources, residual is always 0.


            console.log('zero ' + object.uid + ' ' + exclusivePsdU + ' ' + residualPsdU );
            if (residualPsdU === 0) {
                // TODO: Info no flow redundant deadleg
                this.configureEntityForPSD(object.entity, 0, flowEdge);
            } else {
                // ambiguous
                // TODO: Info that flow rate is ambiguous, and no flow is exclusive to us
            }
        }

    }

    fillPressureDropFields() {
        this.networkObjects.forEach((o) => {
            switch (o.entity.type) {
                case EntityType.TMV: {

                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);
                    const frw = calculation.hotPeakFlowRate;
                    if (frw !== null) {
                        const hl = o.getFrictionHeadLoss(
                            this,
                            frw,
                            {connection: o.uid, connectable: o.entity.hotRoughInUid},
                            {connection: o.uid, connectable: o.entity.warmOutputUid},
                            true,
                        );
                        calculation.warmOutPressureDropKPA = hl === null ? null : head2kpa(
                            hl,
                            getFluidDensityOfSystem(StandardFlowSystemUids.WarmWater, this.doc, this.catalog)!,
                            this.ga,
                        );
                    }

                    if (o.entity.coldOutputUid) {
                        const fr = calculation.coldPeakFlowRate;
                        if (fr !== null) {
                            const hl = o.getFrictionHeadLoss(
                                this,
                                fr,
                                {connection: o.uid, connectable: o.entity.coldRoughInUid},
                                {connection: o.uid, connectable: o.entity.coldOutputUid},
                                true,
                            );
                            calculation.coldOutPressureDropKPA = hl === null ? hl : head2kpa(
                                hl,
                                getFluidDensityOfSystem(StandardFlowSystemUids.ColdWater, this.doc, this.catalog)!,
                                this.ga,
                            );
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
                            {connection: o.uid, connectable: o.entity.endpointUid[0]},
                            {connection: o.uid, connectable: o.entity.endpointUid[1]},
                            true,
                        );
                        calculation.pressureDropKpa = hl === null ? null : head2kpa(
                            hl,
                            getFluidDensityOfSystem(StandardFlowSystemUids.ColdWater, this.doc, this.catalog)!,
                            this.ga,
                        );
                    }
                }
                    break;
                case EntityType.FITTING:
                case EntityType.RISER:
                case EntityType.DIRECTED_VALVE:
                case EntityType.SYSTEM_NODE:
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity) as
                        FittingCalculation | RiserCalculation | SystemNodeCalculation | DirectedValveCalculation;
                    const connections = this.globalStore.getConnections(o.entity.uid);

                    if (connections.length === 2) {
                        const p1 = this.globalStore.get(connections[0])!;
                        const p2 = this.globalStore.get(connections[1])!;
                        if (p1 instanceof Pipe && p2 instanceof Pipe) {
                            const pipeCalc1 = this.globalStore.getOrCreateCalculation(p1.entity);
                            const pipeCalc2 = this.globalStore.getOrCreateCalculation(p2.entity);
                            if (pipeCalc1!.peakFlowRate !== null &&
                                pipeCalc2!.peakFlowRate !== null) {

                                calculation.flowRateLS =
                                    Math.min(pipeCalc1!.peakFlowRate, pipeCalc2!.peakFlowRate);

                                if (o.entity.type !== EntityType.RISER &&
                                    o.entity.type !== EntityType.SYSTEM_NODE) {
                                    const hl1 = o.getFrictionHeadLoss(
                                        this,
                                        calculation.flowRateLS,
                                        {connectable: o.uid, connection: connections[0]},
                                        {connectable: o.uid, connection: connections[1]},
                                        true,
                                    );
                                    const dir1 = hl1 === null ? null : head2kpa(
                                        hl1,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.ColdWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga,
                                    );
                                    const hl2 = o.getFrictionHeadLoss(
                                        this,
                                        calculation.flowRateLS,
                                        {connectable: o.uid, connection: connections[1]},
                                        {connectable: o.uid, connection: connections[0]},
                                        true,
                                    );
                                    const dir2 = hl2 === null ? null : head2kpa(
                                        hl2,
                                        getFluidDensityOfSystem(
                                            StandardFlowSystemUids.ColdWater,
                                            this.doc,
                                            this.catalog
                                        )!,
                                        this.ga,
                                    );
                                    if (dir1 === null || dir2 === null) {
                                        (calculation as any).pressureDropKPA = null;
                                    } else {
                                        (calculation as any).pressureDropKPA = Math.min(dir1, dir2);
                                    }
                                }
                            }
                        }
                    }
                    break;
                case EntityType.FIXTURE:
                case EntityType.BACKGROUND_IMAGE:
                    break;
                default:
                    assertUnreachable(o.entity);
            }
        });
    }

    createWarnings() {
        this.networkObjects.forEach((o) => {
            switch (o.entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    break;
                case EntityType.FITTING:
                    break;
                case EntityType.PIPE:
                    break;
                case EntityType.RISER:
                    break;
                case EntityType.SYSTEM_NODE:
                    break;
                case EntityType.TMV:
                    break;
                case EntityType.FIXTURE:
                    const e = fillFixtureFields(this.doc.drawing, this.catalog, o.entity);
                    const calculation = this.globalStore.getOrCreateCalculation(o.entity);
                    if ((calculation.coldPressureKPA || 0) < e.minInletPressureKPA!) {
                        calculation.warning = 'Not enough cold pressure. Required: '
                            + e.minInletPressureKPA!.toFixed(0) + ' kPa';
                    } else if ((calculation.coldPressureKPA || 0) > e.maxInletPressureKPA!) {
                        calculation.warning = 'Cold pressure overload. Max: '
                            + e.maxInletPressureKPA!.toFixed(0) + ' kPa';
                    }

                    if (o.entity.warmRoughInUid) {
                        if ((calculation.warmPressureKPA || 0) < e.minInletPressureKPA!) {
                            calculation.warning = 'Not enough warm pressure. Required: '
                                + e.minInletPressureKPA!.toFixed(0) + ' kPa';
                        } else if ((calculation.warmPressureKPA || 0) > e.maxInletPressureKPA!) {
                            calculation.warning = 'Warm pressure overload. Max: '
                                + e.maxInletPressureKPA!.toFixed(0) + ' kPa';
                        }
                    }
                    break;
                case EntityType.DIRECTED_VALVE:
                    break;
                default:
                    assertUnreachable(o.entity);
            }
        });
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

    getWetEndpoints(endpointUids: string[], edge: FlowEdge, roots: FlowNode[]): string[] {
        const seen = new Set<string>();
        const seenEdges = new Set<string>([stringify(edge)]);

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
            return seen.has(this.flowGraph.sn({connectable: ep, connection: edge.uid}));
        });
    }

    getDryEndpoints(endpointUids: string[], edge: FlowEdge, roots: FlowNode[]): string[] {
        const wet = this.getWetEndpoints(endpointUids, edge, roots);
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
