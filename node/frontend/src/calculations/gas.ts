import CalculationEngine from "./calculation-engine";
import {FlowSystemParameters} from "../../../common/src/api/document/drawing";

export interface GasComponent {
    // Entry point could be a regulator or a flow source.
    entryPoint: string;

    // Length of the longest segment.
    lengthM: number;
}

export function calculateGas(engine: CalculationEngine) {

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

function getBestNominalDiameterSmall(inputRateCFH: number, pipeLengthFT: number, headLossIN: number, type: GasType) {
    const cr = type === GasType.NATURAL_GAS ? 0.6094 : 1.2462;
    const Y = type === GasType.NATURAL_GAS ? 0.9992 : 0.9910;

    return inputRateCFH ** 0.381 / (19.17 * (headLossIN / (cr * pipeLengthFT)) ** 0.206);
}

function getBestNominalDiameterLarge(inputRateCFH: number, pipeLengthFT: number, upstreamPSI: number, downstreamPSI: number, type: GasType) {

    const cr = type === GasType.NATURAL_GAS ? 0.6094 : 1.2462;
    const Y = type === GasType.NATURAL_GAS ? 0.9992 : 0.9910;

    return inputRateCFH ** 0.381 / (18.93 * (((upstreamPSI + 14.7) ** 2 - (downstreamPSI + 14.7) ** 2) * Y / (cr * pipeLengthFT)) ** 0.206);
}

export function sizeGasPipe(inputRateMJH: number, pipeLengthM: number, startKPA: number, endKPA: number, type: GasType) {
    const inputRateCFH = type === GasType.NATURAL_GAS ? inputRateMJH * .94782 : inputRateMJH / 2.620;
    const pipeLengthFT = pipeLengthM * 3.28084;
    const headLossIN = (startKPA - endKPA) * 0.10199773339984054 * 39.3701;
    const upstreamPSI = startKPA * 0.145038;
    const downstreamPSI = endKPA * 0.145038;

    if ((startKPA + endKPA) / 2 >= 10.3) {
        return getBestNominalDiameterLarge(inputRateCFH, pipeLengthFT, upstreamPSI, downstreamPSI, type) * 2.54 * 10;
    } else {
        return getBestNominalDiameterSmall(inputRateCFH, pipeLengthFT, headLossIN, type) * 2.54 * 10;
    }
}
