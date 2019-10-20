import pipe from '@/htmlcanvas/objects/pipe';
import {GRAVITATIONAL_ACCELERATION} from '@/calculations/index';
import {DocumentState} from '@/store/document/types';
import {Catalog} from '@/store/catalog/types';
import {parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';


export const EPS = 1e-10;
export const EPS_ABS = 1e-8;

export function getReynoldsNumber(
    densityKGM3: number,
    velocityMS: number,
    pipeInternalDiameterMM: number,
    dynamicViscosityNSM2: number,
) {
    const internalDiameterM = pipeInternalDiameterMM / 1000;
    return densityKGM3 * velocityMS * internalDiameterM / dynamicViscosityNSM2;
}

export function getFrictionFactor(
    pipeInternalDiameterMM: number,
    pipeRoughness: number,
    reynoldsNumber: number,
) {
    if (reynoldsNumber < 10) {
        // numerically unstable for values of 0.81, and legitimate reynolds numbers below 10 are rare.
        return 0;
    }
    let curr = (1.14 + (2 * Math.log10(pipeInternalDiameterMM / pipeRoughness))) ** (-2);
    let iter = 0;
    while (true) {
        iter++;
        const next = (-2 * Math.log10(((pipeRoughness / pipeInternalDiameterMM) / 3.7) +
            (2.51 / (reynoldsNumber * Math.sqrt(curr))))) ** (-2);
        if (Math.abs(next - curr) < EPS || Math.abs(next  - curr) / curr < EPS_ABS) {
            break;
        }
        curr = next;
    }
    return curr;
}

export function getDarcyWeisbachMH(
    frictionFactor: number,
    pipeLengthM: number,
    internalDiameterMM: number,
    velocityMS: number,
) {
    return frictionFactor * pipeLengthM * velocityMS ** 2 /
        ((internalDiameterMM / 1000) * GRAVITATIONAL_ACCELERATION * 2);
}

export function getDarcyWeisbachFlatMH(
    internalDiameterMM: number,
    pipeRoughness: number,
    densityKGM3: number,
    dynamicViscosity: number,
    pipeLengthM: number,
    velocityMS: number,
) {
    return getDarcyWeisbachMH(
        getFrictionFactor(
            internalDiameterMM,
            pipeRoughness,
            getReynoldsNumber(
                densityKGM3,
                velocityMS,
                internalDiameterMM,
                dynamicViscosity,
            ),
        ),
        pipeLengthM,
        internalDiameterMM,
        velocityMS,
    );
}

export function getHazenWilliamsMH(
    flowRateMS: number,
    pipeInternalDiameterMM: number,
    pipeRoughness: number,
) {
    return ((3.3 * 1e6 * flowRateMS) / (pipeInternalDiameterMM ** 2.63 * pipeRoughness)) ** 1.852;
}

export function fittingFrictionLossMH(
    velocityMS: number,
    kValue: number,
) {
    return kValue * 2 * velocityMS / (GRAVITATIONAL_ACCELERATION * 2);
}

export function head2kpa(mh: number, densityKGM3: number): number {
    return densityKGM3 * GRAVITATIONAL_ACCELERATION * mh / 1000;
}

export function kpa2head(kpa: number, densityKGM3: number): number {
    return 1000 * kpa / (densityKGM3 * GRAVITATIONAL_ACCELERATION);
}

export function getFluidDensityOfSystem(systemUid: string, doc: DocumentState, catalog: Catalog): number | null {
    const system = doc.drawing.flowSystems.find((s) => s.uid === systemUid);
    if (!system) {
        return null;
    }

    const fluid = catalog.fluids[system.fluid];
    if (!fluid) {
        return null;
    }

    return parseCatalogNumberExact(fluid.densityKGM3);
}
