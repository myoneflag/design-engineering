// from Chemical Engineer's Guide
// Source: Fundamental sof Heat and Mass Transfer (2007), Frank P Incropera

import { Polynomial } from "../../lib/polynomials";

export const AIR_PROPERTIES = {
    specificHeatKJ_KGK:         [1.07223839, -0.000565339, 1.44382e-06, -1.1132e-09, 3.03724e-13],
    viscosityNS_M2_7:             [-1.85, 0.7978, -0.0007246, 5.115e-07, -1.586e-10],
    kinematicViscosityM2_S_6:     [-0.761083591, 0.01063728, 0.000172673, -8.32093e-08, 2.25852e-11],
    thermalConductivityW_MK_3:    [0.520072239, 0.088867888, 4.58531e-06, -5.90229e-08, 3.17176e-11],
    alphaM2_S_6:                  [2.254489164, -0.035935528, 0.000446483, -3.80588e-07, 1.35569e-10],
    prandtlNumber:              [0.845781218, -0.000694606, 8.00624e-07, -1.72787e-11, -2.08438e-13],
};

export const THERMAL_CONDUCTIVITY: {[key: string]: Polynomial} = {
    plainCarbonSteel:       [79.0, -0.0511, 3.67e-19, 2.08e-09],

    // from https://www.engineeringtoolbox.com/thermal-conductivity-metals-d_858.html
    // then, 4th order polynomial fitting
    copperTypeB: [675.3069736, -0.11516259, 0.00030628, -5.06348e-07, 2.53071e-10],
    copper: [675.3069736, -0.11516259, 0.00030628, -5.06348e-07, 2.53071e-10],
    gmsMedium: [79.0, -0.0511, 3.67e-19, 2.08e-09], // copy of plain carbon steel
    hdpeSdr11: [0.465],
    pexSdr74: [0.465],
    stainlessSteel: [14.4],
    ppr: [0.188],

    // insulation materials
    //https://www.engineeringtoolbox.com/thermal-conductivity-d_429.html
    calciumSilicate: [0.07333604, -0.000224881, 7.36555e-07, -7.46414e-10, 3.15711e-13],
    cellularGlass: [0.045],
    elastomeric: [0.035],
    fiberglass: [0.04],
    mineralWool: [0.04],
    polyisocyanurate: [0.028],
    mmKemblaInsulation: [0.034],
};

export const SURFACE_EMISSIVITY: {[key: string]: number} = {
    noJacket: 0.9,
    pvcJacket: 0.9,
    allServiceJacket: 0.9,
    paintedMetal: 0.8,
    aluminizedPaint: 0.5,
    stainlessSteelDull: 0.3,
    galvanizedSteelDippedOrDull: 0.28,
    stainlessSteelNewCleaned: 0.13,
    galvanizedSteelNewBright: 0.10,
    aluminiumOxidedInService: 0.10,
    aluminiumNewBright: 0.04,
};
