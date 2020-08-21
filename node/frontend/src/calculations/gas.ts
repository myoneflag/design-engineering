import CalculationEngine, {EdgeType, FLOW_SOURCE_EDGE, FLOW_SOURCE_ROOT_NODE} from "./calculation-engine";
import {FlowSystemParameters} from "../../../common/src/api/document/drawing";
import {EntityType} from "../../../common/src/api/document/entities/types";
import {assertUnreachable, isGas} from "../../../common/src/api/config";
import {ValveType} from "../../../common/src/api/document/entities/directed-valves/valve-types";
import {determineConnectableSystemUid} from "../store/document/entities/lib";
import Pipe from "../htmlcanvas/objects/pipe";
import PipeEntity, {fillPipeDefaultFields} from "../../../common/src/api/document/entities/pipe-entity";
import {
    lowerBoundTable,
    parseCatalogNumberExact,
    parseCatalogNumberOrMin,
    upperBoundTable
} from "../../../common/src/lib/utils";
import {NoFlowAvailableReason} from "../store/document/calculations/pipe-calculation";
import DirectedValve from "../htmlcanvas/objects/directed-valve";
import {NodeType} from "../../../common/src/api/document/entities/load-node-entity";

export interface GasComponent {
    pipes: Set<string>;
    regulatorUid?: string;
    mainRunLengthM: number;
    supplyPressureKPA: number;
    maxPressureRequiredKPA: number;
}

// Assume that regulators dictate the pressure, even if the source doens't provide enough pressure.
export function calculateGas(engine: CalculationEngine) {
    const components = getAndFillInGasComponent(engine);
    for (const component of components) {
        if (component.regulatorUid) {
            const regulator = engine.globalStore.get(component.regulatorUid) as DirectedValve;
            if (regulator.entity.valve.type === ValveType.GAS_REGULATOR) {
                const rCalc = engine.globalStore.getOrCreateCalculation(regulator.entity);
                rCalc.pressureKPA = regulator.entity.valve.outletPressureKPA;
            }
        }

        for (const puid of component.pipes) {
            const pipe = engine.globalStore.get(puid) as Pipe;
            const pCalc = engine.globalStore.getOrCreateCalculation(pipe.entity);

            if (pCalc.psdUnits) {
                const system = engine.drawing.metadata.flowSystems.find((s) => s.uid === pipe.entity.systemUid)!;
                const gasType = system2Gas(system);
                if (gasType) {
                    if (component.supplyPressureKPA <= component.maxPressureRequiredKPA) {
                        pCalc.noFlowAvailableReason = NoFlowAvailableReason.GAS_SUPPLY_PRESSURE_TOO_LOW;
                    } else {
                        let inside = sizeGasPipeInside(
                            pCalc.psdUnits.gasMJH,
                            component.mainRunLengthM,
                            component.supplyPressureKPA,
                            component.maxPressureRequiredKPA,
                            gasType,
                        );
                        let p = lowerBoundTable(pipe.getManufacturerCatalogPage(engine)!, inside, (t) => parseCatalogNumberOrMin(t.diameterInternalMM)!);

                        while (true) {
                            if (p) {
                                pCalc.optimalInnerPipeDiameterMM = inside;
                                pCalc.realNominalPipeDiameterMM = parseCatalogNumberOrMin(p.diameterNominalMM);
                                pCalc.realInternalDiameterMM = parseCatalogNumberOrMin(p.diameterInternalMM);
                                pCalc.realOutsideDiameterMM = parseCatalogNumberOrMin(p.diameterOutsideMM);

                                // Is the flow rate OK?
                                const network = pipe.entity.network;
                                const maxSpeed = system.networks[network].velocityMS;

                                const velocity = getGasVelocityRealMs(engine, pipe.entity, gasType);
                                pCalc.velocityRealMS = velocity ? velocity.ms : null;
                                pCalc.gasMJH = velocity ? velocity.mjh : null;

                                if (!pCalc.velocityRealMS || pCalc.velocityRealMS <= maxSpeed) {
                                    break;
                                }

                                // increase pipe size.
                                p = lowerBoundTable(
                                    pipe.getManufacturerCatalogPage(engine)!,
                                    parseCatalogNumberExact(p.diameterInternalMM)! + 0.1,
                                    (t) => parseCatalogNumberOrMin(t.diameterInternalMM)!,
                                );

                            } else {
                                pCalc.optimalInnerPipeDiameterMM = inside;
                                pCalc.noFlowAvailableReason = NoFlowAvailableReason.NO_SUITABLE_PIPE_SIZE;
                                break;
                            }
                        }
                    }

                }
            }
        }
    }
}

export function getAndFillInGasComponent(engine: CalculationEngine) {
    const result: GasComponent[] = [];

    const groupOf = new Map<string, string>();
    const lengthOfGroup = new Map<string, number>();
    let block = new Set<string>();
    for (const o of engine.networkObjects()) {
        let isRoot = false;
        let regulatorUid: string | undefined = undefined;
        let connection = '';
        let pressureKPA = 0;

        switch (o.entity.type) {
            case EntityType.FLOW_SOURCE: {
                const systemUid = determineConnectableSystemUid(engine.globalStore, o.entity);
                const system = engine.drawing.metadata.flowSystems.find((f) => f.uid === systemUid);
                const thisIsGas = isGas(system ? system.fluid : 'water', engine.catalog);

                if (thisIsGas) {
                    isRoot = true;
                    pressureKPA = o.entity.minPressureKPA!;
                    connection = FLOW_SOURCE_EDGE;
                    block.add(engine.serializeNode(FLOW_SOURCE_ROOT_NODE));
                }
                break;
            }
            case EntityType.DIRECTED_VALVE: {
                const systemUid = determineConnectableSystemUid(engine.globalStore, o.entity);
                const connections = engine.globalStore.getConnections(o.entity.uid);
                const system = engine.drawing.metadata.flowSystems.find((f) => f.uid === systemUid);
                const thisIsGas = isGas(system ? system.fluid : 'water', engine.catalog);
                if (o.entity.valve.type === ValveType.GAS_REGULATOR && thisIsGas && connections.length === 2) {
                    const p0 = engine.globalStore.get(connections[0]) as Pipe;
                    const p0Calc = engine.globalStore.getOrCreateCalculation(p0.entity);
                    const p1 = engine.globalStore.get(connections[1]) as Pipe;
                    const p1Calc = engine.globalStore.getOrCreateCalculation(p1.entity);

                    isRoot = true;
                    regulatorUid = o.entity.uid;
                    pressureKPA = o.entity.valve.outletPressureKPA!;
                    if (p0Calc.flowFrom === o.entity.uid) {
                        connection = p0.uid;
                        block.add(engine.serializeNode({connectable: o.entity.uid, connection: p1.uid}));
                    } else if (p1Calc.flowFrom === o.entity.uid) {
                        connection = p1.uid;
                        block.add(engine.serializeNode({connectable: o.entity.uid, connection: p0.uid}));
                    } else {
                        isRoot = false;
                    }
                }

                if (thisIsGas) {
                    switch (o.entity.valve.type) {
                        case ValveType.CHECK_VALVE:
                        case ValveType.ISOLATION_VALVE:
                        case ValveType.STRAINER:
                        case ValveType.RPZD_SINGLE:
                        case ValveType.RPZD_DOUBLE_SHARED:
                        case ValveType.RPZD_DOUBLE_ISOLATED:
                        case ValveType.PRV_SINGLE:
                        case ValveType.PRV_DOUBLE:
                        case ValveType.PRV_TRIPLE:
                        case ValveType.BALANCING:
                        case ValveType.GAS_REGULATOR:
                            break;
                        case ValveType.FILTER:
                        case ValveType.WATER_METER:
                            const calc = engine.globalStore.getOrCreateCalculation(o.entity);
                            calc.pressureDropKPA = o.entity.valve.pressureDropKPA;
                            break;
                        default:
                            assertUnreachable(o.entity.valve);
                    }
                }

                break;
            }
            case EntityType.LOAD_NODE: {
                const systemUid = determineConnectableSystemUid(engine.globalStore, o.entity);
                const system = engine.drawing.metadata.flowSystems.find((f) => f.uid === systemUid);
                const thisIsGas = isGas(system ? system.fluid : 'water', engine.catalog);

                if (thisIsGas) {
                    const calc = engine.globalStore.getOrCreateCalculation(o.entity);
                    switch (o.entity.node.type) {
                        case NodeType.LOAD_NODE:
                            calc.gasFlowRateMJH = o.entity.node.gasFlowRateMJH;
                            break;
                        case NodeType.DWELLING:
                            calc.gasFlowRateMJH = o.entity.node.gasFlowRateMJH * o.entity.node.dwellings;
                            break;
                        default:
                            assertUnreachable(o.entity.node);
                    }
                    calc.pressureKPA = o.entity.node.gasPressureKPA;
                    calc.staticPressureKPA = o.entity.node.gasPressureKPA;
                }

                break;
            }
            case EntityType.SYSTEM_NODE:
            case EntityType.FITTING:
            case EntityType.PIPE:
            case EntityType.RISER:
            case EntityType.BIG_VALVE:
            case EntityType.FIXTURE:
            case EntityType.PLANT:
            case EntityType.GAS_APPLIANCE:
            case EntityType.BACKGROUND_IMAGE:
                break;
            default:
                assertUnreachable(o.entity);
        }

        if (isRoot) {

            const distTo = new Map<string, number>();
            const pressureDropTo = new Map<string, number>();
            distTo.set(o.entity.uid, 0);
            pressureDropTo.set(o.entity.uid, 0);
            let mainRunLengthM = 0;
            const pipes = new Set<string>();
            const supplyPressureKPA = pressureKPA;
            let maxPressureRequiredKPA = 0;

            engine.flowGraph.dfs(
                {
                    connectable: o.entity.uid,
                    connection,
                },
                (node) => {
                    const prevDist = distTo.get(node.connectable);
                    const prevDrop = pressureDropTo.get(node.connectable);
                    const no = engine.globalStore.get(node.connectable);
                    if (!no) {
                        return true;
                    }

                    if (no.entity.type === EntityType.DIRECTED_VALVE && no.entity.valve.type === ValveType.GAS_REGULATOR) {
                        mainRunLengthM = Math.max(mainRunLengthM, (prevDist || 0));
                    } else if (no.entity.type === EntityType.SYSTEM_NODE && no.entity.uid !== o.entity.uid) {
                        const sno = engine.globalStore.get(no.entity.uid)!;
                        const parent = sno.parent!;
                        if (parent.entity.type === EntityType.GAS_APPLIANCE) {
                            mainRunLengthM = Math.max(mainRunLengthM, (prevDist || 0));
                            maxPressureRequiredKPA = Math.max(maxPressureRequiredKPA, parent.entity.inletPressureKPA! + prevDrop!);
                        }
                    } else if (no.entity.type === EntityType.LOAD_NODE) {
                        const systemUid = determineConnectableSystemUid(engine.globalStore, no.entity);
                        const system = engine.doc.drawing.metadata.flowSystems.find((f) => f.uid === systemUid);
                        const nodeIsGas = isGas(system ? system.fluid : 'water', engine.catalog);

                        if (nodeIsGas) {
                            mainRunLengthM = Math.max(mainRunLengthM, (prevDist || 0));
                            maxPressureRequiredKPA = Math.max(maxPressureRequiredKPA, no.entity.node.gasPressureKPA + prevDrop!);
                        }
                    }

                    if (no.entity.type === EntityType.FLOW_SOURCE && no.entity.uid !== o.entity.uid) {
                        return true;
                    }
                    if (no.entity.type === EntityType.DIRECTED_VALVE && no.entity.uid !== o.entity.uid) {
                        if (no.entity.valve.type === ValveType.GAS_REGULATOR) {
                            maxPressureRequiredKPA = Math.max(maxPressureRequiredKPA, no.entity.valve.outletPressureKPA! + prevDrop!);
                            return true;
                        }
                    }
                },
                undefined,
                (e) => {
                    let addedDist = 0;
                    let addedDrop = 0;
                    switch (e.value.type) {
                        case EdgeType.PIPE: {
                            const o = engine.globalStore.get(e.value.uid) as Pipe;
                            const p = fillPipeDefaultFields(engine.drawing, o.computedLengthM, o.entity);
                            addedDist += p.lengthM!;

                            // Special case: add something at the end for a fitting.
                            const co = engine.globalStore.get(e.to.connectable);
                            if (co && co.entity.type === EntityType.FITTING) {
                                addedDist += 2;
                            }
                            pipes.add(e.value.uid);
                            break;
                        }
                        case EdgeType.ISOLATION_THROUGH:
                        case EdgeType.CHECK_THROUGH:
                        case EdgeType.BALANCING_THROUGH: {
                            if (e.value.type === EdgeType.CHECK_THROUGH) {
                                const object = engine.globalStore.get(e.value.uid) as DirectedValve;
                                if (object.entity.valve.type === ValveType.FILTER || object.entity.valve.type === ValveType.WATER_METER) {
                                    addedDrop += object.entity.valve.pressureDropKPA!;
                                }
                            }
                            addedDist = 2;
                            break;
                        }
                        case EdgeType.FITTING_FLOW:
                            // Ignore - imply one fitting flow for every physical fitting at the end of the path,
                            // we want to avoid this case:       / B
                            //                              A -<|
                            //                                  \  C  where the flow from A->C goes through ABC, longer way
                            // and counting the fitting twice.
                            addedDist = 0;
                            break;
                        case EdgeType.BIG_VALVE_HOT_HOT:
                        case EdgeType.BIG_VALVE_HOT_WARM:
                        case EdgeType.BIG_VALVE_COLD_WARM:
                        case EdgeType.BIG_VALVE_COLD_COLD:
                            break;
                        case EdgeType.FLOW_SOURCE_EDGE:
                        case EdgeType.PLANT_THROUGH:
                        case EdgeType.RETURN_PUMP:
                            break;
                        default:
                            assertUnreachable(e.value.type);
                    }

                    const prevDist = distTo.get(e.from.connectable);
                    const prevDrop = pressureDropTo.get(e.from.connectable);
                    distTo.set(e.to.connectable, (prevDist || 0) + addedDist);
                    pressureDropTo.set(e.to.connectable, (prevDrop || 0) + addedDrop);
                },
                undefined,
                block,
            );

            result.push({pipes, mainRunLengthM, supplyPressureKPA, maxPressureRequiredKPA, regulatorUid});
        }
    }
    return result;
}

export enum GasType {
    NATURAL_GAS = 'naturalGas',
    LPG = 'LPG',
}

export function system2Gas(system: FlowSystemParameters) {
    if (system.fluid === 'LPG') {
        return GasType.LPG;
    } else if (system.fluid === 'naturalGas') {
        return GasType.NATURAL_GAS;
    }
    return null;
}

function getBestInsideDiameterSmall(inputRateCFH: number, pipeLengthFT: number, headLossIN: number, type: GasType) {
    const cr = type === GasType.NATURAL_GAS ? 0.6094 : 1.2462;
    const Y = type === GasType.NATURAL_GAS ? 0.9992 : 0.9910;

    return inputRateCFH ** 0.381 / (19.17 * (headLossIN / (cr * pipeLengthFT)) ** 0.206);
}

function getBestInsideDiameterLarge(inputRateCFH: number, pipeLengthFT: number, upstreamPSI: number, downstreamPSI: number, type: GasType) {

    const cr = type === GasType.NATURAL_GAS ? 0.6094 : 1.2462;
    const Y = type === GasType.NATURAL_GAS ? 0.9992 : 0.9910;

    return inputRateCFH ** 0.381 / (18.93 * (((upstreamPSI + 14.7) ** 2 - (downstreamPSI + 14.7) ** 2) * Y / (cr * pipeLengthFT)) ** 0.206);
}

export function sizeGasPipeInside(inputRateMJH: number, pipeLengthM: number, startKPA: number, endKPA: number, type: GasType) {
    const inputRateCFH = type === GasType.NATURAL_GAS ? inputRateMJH * .94782 : inputRateMJH / 2.620;
    const pipeLengthFT = pipeLengthM * 3.28084;
    const headLossIN = (startKPA - endKPA) * 0.10199773339984054 * 39.3701;
    const upstreamPSI = startKPA * 0.145038;
    const downstreamPSI = endKPA * 0.145038;

    if ((startKPA + endKPA) / 2 >= 10.3) {
        return getBestInsideDiameterLarge(inputRateCFH, pipeLengthFT, upstreamPSI, downstreamPSI, type) * 2.54 * 10;
    } else {
        return getBestInsideDiameterSmall(inputRateCFH, pipeLengthFT, headLossIN, type) * 2.54 * 10;
    }
}


function getGasVelocityRealMs(context: CalculationEngine, pipe: PipeEntity, type: GasType): {mjh: number, ms: number} | undefined {
    const calculation = context.globalStore.getOrCreateCalculation(pipe);
    if (calculation.psdUnits) {
        if (calculation.psdUnits.gasMJH) {

            let nDwellings = 0;
            let dwellingMJH = 0;
            if (calculation.psdProfile) {
                for (const c of calculation.psdProfile.keys()) {
                    const e = context.globalStore.get(c)!;
                    if (e.entity.type === EntityType.LOAD_NODE) {
                        if (e.entity.node.type === NodeType.DWELLING) {
                            nDwellings += e.entity.node.dwellings;
                            dwellingMJH += calculation.psdProfile.get(c)!.gasMJH;
                        }
                    }
                }
            }

            const continuousMJH = calculation.psdUnits.gasMJH - dwellingMJH;
            const diversification = lowerBoundTable(context.catalog.gasDiversification, nDwellings)
                || upperBoundTable(context.catalog.gasDiversification, nDwellings) || 0;
            const diversifiedMJH = continuousMJH + diversification * dwellingMJH;

            console.log('diversified: ' + diversifiedMJH);

            let m3h = 0;
            switch (type) {
                case GasType.NATURAL_GAS: {
                    // http://agnatural.pt/documentos/ver/natural-gas-conversion-guide_cb4f0ccd80ccaf88ca5ec336a38600867db5aaf1.pdf
                    m3h = diversifiedMJH / 38.7;
                    break;
                }
                case GasType.LPG: {
                    // https://www.elgas.com.au/blog/389-lpg-conversions-kg-litres-mj-kwh-and-m3

                    const liters = diversifiedMJH * 0.042;
                    const m3 = liters / 3.70;
                    m3h = m3;
                    break;
                }
                default:
                    assertUnreachable(type);
            }

            const LS = m3h * 0.2777777777777777;

            const res = (
                (4000 * LS) /
                (Math.PI * parseCatalogNumberExact(calculation.realInternalDiameterMM)! ** 2)
            );

            return {
                mjh: diversifiedMJH, ms: res,
            };
        }
    }
}