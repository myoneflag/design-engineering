import {DrawableEntityConcrete} from "./entities/concrete-entity";
import {
    ComponentPressureLossMethod,
    EN12056FrequencyFactor,
    InsulationJackets,
    InsulationMaterials,
    PIPE_SIZING_METHODS,
    RingMainCalculationMethod,
    StandardFlowSystemUids,
    SupportedDrainageMethods,
    SupportedDwellingStandards,
    SupportedPsdStandards
} from "../config";
import RiserEntity from "./entities/riser-entity";
import {EntityType} from "./entities/types";
import {Choice, cloneSimple, DeepPartial} from "../../lib/utils";
import {PriceTable} from "../catalog/price-table";
import { OperationTransformConcrete, OPERATION_NAMES } from './operation-transforms';

export interface Coord {
    x: number;
    y: number;
}

export function coordDist2(a: Coord, b: Coord) {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}

export function coordDist(a: Coord, b: Coord) {
    return Math.sqrt(coordDist2(a, b));
}

export interface Coord3D extends Coord {
    z: number;
}

export interface WithID {
    uid: string;
}

export interface DrawableEntity extends WithID {
    parentUid: string | null;
    type: EntityType;
}

export interface CenteredEntity extends DrawableEntity {
    center: Coord;
}

export interface ConnectableEntity extends CenteredEntity {
    calculationHeightM: number | null;
}

export interface Level {
    entities: { [key: string]: DrawableEntityConcrete };
    floorHeightM: number;
    name: string;
    abbreviation: string;
    uid: string;
}

/**
 * A drawing is a snapshot of a drawing - its shapes, pipes, fixtures, entities, title, etc, as is.
 */
export interface DrawingState {
    metadata: {
        generalInfo: GeneralInfo;
        units: UnitsParameters;
        flowSystems: FlowSystemParameters[];
        calculationParams: CalculationParameters;
        availableFixtures: string[];
        catalog: Catalog;

        priceTable: DeepPartial<PriceTable>;
    };

    levels: { [key: string]: Level };
    shared: { [key: string]: RiserEntity };
}

export interface UnitsParameters {
    lengthMeasurementSystem: MeasurementSystem;
    pressureMeasurementSystem: MeasurementSystem;
    velocityMeasurementSystem: VelocityMeasurementSystem;
    temperatureMeasurementSystem: MeasurementSystem;
    volumeMeasurementSystem: VolumeMeasurementSystem;
    energyMeasurementSystem: EnergyMeasurementSystem;
}

export enum EnergyMeasurementSystem {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
}

export enum MeasurementSystem {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
}

export enum VolumeMeasurementSystem {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
    US = 'US',
}


export enum VelocityMeasurementSystem {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
    ALTERNATIVE_IMPERIAL = 'ALTERNATIVE_IMPERIAL',
}

export const LENGTH_MEASUREMENT_CHOICES: Choice[] = [
    {name: "Metric (mm)", key: MeasurementSystem.METRIC},
    {name: "Imperial (in, ft)", key: MeasurementSystem.IMPERIAL},
];

export const PRESSURE_MEASUREMENT_CHOICES: Choice[] = [
    {name: "Metric (kpa)", key: MeasurementSystem.METRIC},
    {name: "Imperial (psi)", key: MeasurementSystem.IMPERIAL},
];

export const TEMPERATURE_MEASUREMENT_CHOICES: Choice[] = [
    {name: "Metric (\u00B0C)", key: MeasurementSystem.METRIC},
    {name: "Imperial (\u00B0F)", key: MeasurementSystem.IMPERIAL},
];

export const VELOCITY_MEASUREMENT_CHOICES: Choice[] = [
    {name: 'Metric (m/s)', key: VelocityMeasurementSystem.METRIC},
    {name: 'Imperial (furlongs/fortnight)', key: VelocityMeasurementSystem.ALTERNATIVE_IMPERIAL},
    {name: 'Alt. Imperial (ft/s)', key: VelocityMeasurementSystem.IMPERIAL},
];

export const VOLUME_MEASUREMENT_CHOICES: Choice[] = [
    {name: "Metric (L)", key: VolumeMeasurementSystem.METRIC},
    {name: "UK Imperial (gal)", key: VolumeMeasurementSystem.IMPERIAL},
    {name: "US Imperial (US gal)", key: VolumeMeasurementSystem.US},
];


export const ENERGY_MEASUREMENT_CHOICES: Choice[] = [
    {name: "Megajoules (mj)", key: EnergyMeasurementSystem.METRIC},
    {name: "Therms (thm)", key: EnergyMeasurementSystem.IMPERIAL},
];



export interface GeneralInfo {
    title: string;
    projectNumber: string;
    projectStage: string;
    designer: string;
    reviewed: string;
    approved: string;
    revision: number;
    client: string;
    description: string;
}

export interface Color {
    hex: string;
}

export const COLORS = {
    YELLOW: {hex: "#FFFF00"},
};

export enum NetworkType {
    RISERS = "RISERS",
    RETICULATIONS = "RETICULATIONS",
    CONNECTIONS = "CONNECTIONS"
}

export interface NetworkParams {
    velocityMS: number;
    spareCapacityPCT: number;
    material: string;
    minimumPipeSize: number;
}

export interface FlowSystemParametersV8 extends WithID {
    name: string;
    temperature: number;
    color: Color;
    fluid: string;

    networks: { [key in keyof typeof NetworkType]: NetworkParams };
}

export interface FlowSystemParametersV9 extends WithID {
    name: string;
    temperature: number;
    color: Color;
    fluid: string;

    hasReturnSystem: boolean;
    returnIsInsulated: boolean;
    returnMaxVelocityMS: number;
    insulationMaterial: InsulationMaterials;
    insulationThicknessMM: number;


    networks: { [key in keyof typeof NetworkType]: NetworkParams };
}

export interface HorizontalPipeSizing {
    minUnits: number;
    maxUnits: number;
    sizeMM: number;
    gradePCT: number;
}

export interface VentSizing {
    minUnits: number;
    maxUnits: number;
    sizeMM: number;
}

export interface StackPipeSizing {
    minUnits: number;
    maxUnits: number;
    sizeMM: number;
    maximumUnitsPerLevel: number;
}

export interface DrainageProperties {
    ventColor: Color;

    stackSizeDiminish: boolean;
    stackDedicatedVent: boolean;
    maxUnventedLengthM: {[key: number]: number | undefined};
    maxUnventedCapacityWCs: {[key: number]: number | undefined};

    horizontalPipeSizing: HorizontalPipeSizing[];
    availablePipeSizesMM: number[];
    ventSizing: VentSizing[];
    stackPipeSizing: StackPipeSizing[];
    stackVentPipeSizing: VentSizing[];
}

export interface FlowSystemParameters extends WithID {
    name: string;
    temperature: number;
    color: Color;
    fluid: string;

    hasReturnSystem: boolean;
    returnIsInsulated: boolean;
    returnMaxVelocityMS: number;
    insulationMaterial: InsulationMaterials;
    insulationJacket: InsulationJackets;
    insulationThicknessMM: number;

    drainageProperties: DrainageProperties;

    networks: { [key in keyof typeof NetworkType]: NetworkParams};
}

export interface CalculationParameters {
    psdMethod: SupportedPsdStandards;
    dwellingMethod: SupportedDwellingStandards | null;
    drainageMethod: SupportedDrainageMethods;
    en12056FrequencyFactor: EN12056FrequencyFactor;
    ringMainCalculationMethod: RingMainCalculationMethod;
    pipeSizingMethod: string;
    componentPressureLossMethod: ComponentPressureLossMethod;
    pipePressureLossAddOnPCT: number;

    ceilingPipeHeightM: number;
    roomTemperatureC: number;
    windSpeedForHeatLossMS: number;
    gravitationalAcceleration: number;
}

export interface Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Catalog {
    pipes: SelectedMaterialManufacturer[];
    backflowValves: SelectedMaterialManufacturer[];
    mixingValves: SelectedMaterialManufacturer[];
    prv: SelectedMaterialManufacturer[];
    balancingValves: SelectedMaterialManufacturer[];
    hotWaterPlant: SelectedMaterialManufacturer[];
    fixtures: SelectedMaterialManufacturer[];
    [key: string]: SelectedMaterialManufacturer[];
}

export interface SelectedMaterialManufacturer {
    uid: string;
    manufacturer: string;
    selected: string | null;
}

export const initialDrainageProperties: DrainageProperties = {
    ventColor: { hex: '#ff7755' },
    availablePipeSizesMM: [40, 50, 65, 80, 100, 125, 150, 225, 300, 375],
    horizontalPipeSizing: [
        {minUnits: 0, maxUnits: 165, sizeMM: 100, gradePCT: 1.65},
        {minUnits: 166, maxUnits: 855, sizeMM: 150, gradePCT: 1},
        {minUnits: 856, maxUnits: 1310, sizeMM: 150, gradePCT: 1.65},
        {minUnits: 1311, maxUnits: 4500, sizeMM: 225, gradePCT: 1},
        {minUnits: 4501, maxUnits: 11400, sizeMM: 300, gradePCT: 1},
    ],
    maxUnventedCapacityWCs: {
        40: 2,
        50: 2,
        65: 2,
        80: 2,
        100: 2,
        125: 2,
        150: 2,
        225: 2,
        300: 2,
        375: 2,
    },
    maxUnventedLengthM: {
        40: 10,
        50: 10,
        65: 10,
        80: 10,
        100: 10,
        125: 10,
        150: 10,
        225: 10,
        300: 10,
        375: 10,
    },
    stackDedicatedVent: false,
    stackPipeSizing: [
        {minUnits: 0, maxUnits: 500, sizeMM: 100, maximumUnitsPerLevel: 125},
        {minUnits: 501, maxUnits: 1000, sizeMM: 125, maximumUnitsPerLevel: 250},
        {minUnits: 1001, maxUnits: 2400, sizeMM: 150, maximumUnitsPerLevel: 600},
        {minUnits: 2401, maxUnits: 7000, sizeMM: 225, maximumUnitsPerLevel: 1750},
    ],
    stackSizeDiminish: false,
    stackVentPipeSizing: [
        {minUnits: 0, maxUnits: 56, sizeMM: 65},
        {minUnits: 57, maxUnits: 80, sizeMM: 80},
        {minUnits: 81, maxUnits: 500, sizeMM: 100},
        {minUnits: 501, maxUnits: 1100, sizeMM: 125},
        {minUnits: 1101, maxUnits: 2400, sizeMM: 150},
        {minUnits: 2401, maxUnits: 7000, sizeMM: 225},
    ],
    ventSizing: [
        {minUnits: 0, maxUnits: 10, sizeMM: 40},
        {minUnits: 11, maxUnits: 30, sizeMM: 50},
        {minUnits: 31, maxUnits: 175, sizeMM: 65},
        {minUnits: 176, maxUnits: 400, sizeMM: 80},
        {minUnits: 401, maxUnits: 600, sizeMM: 100},
    ],
};

export const initialDrawing: DrawingState = {
    metadata: {
        generalInfo: {
            title: "Untitled",
            projectNumber: "",
            projectStage: "",
            designer: "",
            reviewed: "",
            approved: "",
            revision: 1,
            client: "",
            description: "",
        },
        units: {
            lengthMeasurementSystem: MeasurementSystem.METRIC,
            volumeMeasurementSystem: VolumeMeasurementSystem.METRIC,
            velocityMeasurementSystem: VelocityMeasurementSystem.METRIC,
            pressureMeasurementSystem: MeasurementSystem.METRIC,
            temperatureMeasurementSystem: MeasurementSystem.METRIC,
            energyMeasurementSystem: EnergyMeasurementSystem.METRIC,
        },
        flowSystems: [
            // TODO: these values should get got from the database.
            {
                name: "Cold Water",
                temperature: 20,
                color: { hex: "#009CE0" },
                uid: "cold-water",
                fluid: "water",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.mmKemblaInsulation,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },
            {
                name: "Hot Water",
                temperature: 65,
                color: { hex: "#F44E3B" },
                uid: "hot-water",
                fluid: "water",
                hasReturnSystem: true,
                returnIsInsulated: true,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.mmKemblaInsulation,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },
            {
                name: "Warm Water",
                temperature: 50,
                color: { hex: "#F49000" },
                uid: "warm-water",
                fluid: "water",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.mmKemblaInsulation,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },
            {
                name: "Gas",
                temperature: 20,
                color: { hex: "#FCDC00" },
                uid: StandardFlowSystemUids.Gas,
                fluid: "naturalGas",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.mmKemblaInsulation,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },
            {

                name: "Fire Hydrant",
                temperature: 20,
                color: { hex: "#9F0500" },
                uid: StandardFlowSystemUids.FireHydrant,
                fluid: "water",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,
                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 4,
                        material: "gmsMedium",
                        minimumPipeSize: 100,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 4,
                        material: "gmsMedium",
                        minimumPipeSize: 100,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 4,
                        material: "gmsMedium",
                        minimumPipeSize: 100,
                    }
                },
                drainageProperties: cloneSimple(initialDrainageProperties),
            },
            {
                name: "Fire Hose Reel",
                temperature: 20,
                color: { hex: "#FCDC00" },
                uid: StandardFlowSystemUids.FireHoseReel,
                fluid: "water",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 25,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 25,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 25,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },

            {
                name: "Sewer Drainage",
                temperature: 20,
                color: { hex: "#11bb11" },
                uid: StandardFlowSystemUids.SewerDrainage,
                fluid: "sewage",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "uPVCSewer",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "uPVCSewer",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "uPVCSewer",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },

            {
                name: "Sanitary Plumbing",
                temperature: 20,
                color: { hex: "#11bb11" },
                uid: StandardFlowSystemUids.SanitaryPlumbing,
                fluid: "sewage",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "uPVCSewer",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "uPVCSewer",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "uPVCSewer",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },

            {
                name: "Grease Waste",
                temperature: 20,
                color: { hex: "#11bb11" },
                uid: StandardFlowSystemUids.GreaseWaste,
                fluid: "sewage",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "hdpeSdr11Sewer",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "hdpeSdr11Sewer",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "hdpeSdr11Sewer",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },

            {
                name: "Trade Waste",
                temperature: 20,
                color: { hex: "#11bb11" },
                uid: StandardFlowSystemUids.TradeWaste,
                fluid: "sewage",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "hdpeSdr11Sewer",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "hdpeSdr11Sewer",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "hdpeSdr11Sewer",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            },

            {
                name: "Rising Main",
                temperature: 20,
                color: { hex: "#11bb11" },
                uid: StandardFlowSystemUids.RisingMain,
                fluid: "sewage",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "uPVCSewer",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "uPVCSewer",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "uPVCSewer",
                        minimumPipeSize: 16,
                    }
                },

                drainageProperties: cloneSimple(initialDrainageProperties),
            }
        ],
        calculationParams: {
            psdMethod: SupportedPsdStandards.as35002018LoadingUnits,
            dwellingMethod: null,
            drainageMethod: SupportedDrainageMethods.AS2018FixtureUnits,
            en12056FrequencyFactor: EN12056FrequencyFactor.IntermittentUse,
            ringMainCalculationMethod: RingMainCalculationMethod.ISOLATION_CASES,
            pipeSizingMethod: PIPE_SIZING_METHODS[0].key as string,
            componentPressureLossMethod: ComponentPressureLossMethod.INDIVIDUALLY,
            pipePressureLossAddOnPCT: 0,

            ceilingPipeHeightM: 3.0,
            roomTemperatureC: 20,
            windSpeedForHeatLossMS: 0,
            gravitationalAcceleration: 9.80665
        },
        availableFixtures: ["basin", "bath", "shower", "kitchenSink", "wc", "washingMachine", "laundryTrough"],
        catalog: {
            pipes: [
                { manufacturer: "kemblaCu", uid: "copperTypeB", selected: null },
                { manufacturer: "rehauPex", uid: "pexSdr74", selected: null,},
                { manufacturer: "kemblaS/s", uid: "stainlessSteel", selected: null,},
            ],
            backflowValves: [
                { manufacturer: "apolloRpzd", uid: "RPZD", selected: null,},
            ],
            mixingValves: [
                { manufacturer: "caleffi", uid: "temperingValve", selected: null,},
                { manufacturer: "enware", uid: "tmv", selected: null,},
            ],
            prv: [
                { manufacturer: "caleffi", uid: "prv", selected: null,},
            ],
            balancingValves: [
                { manufacturer: "cimberio", uid: "balancingValves", selected: null,},
            ],
            hotWaterPlant: [
                { manufacturer: "grundfos", uid: "hotWaterPlant", selected: null,},
            ],
            fixtures: [],
        },
        priceTable: {},
    },
    levels: {
        ground: {
            entities: {},
            floorHeightM: 0,
            name: "Ground Floor",
            abbreviation: "G",
            uid: "ground"
        }
    },
    shared: {}
};

export const exampleDrawing: OperationTransformConcrete = {
    "type": OPERATION_NAMES.DIFF_OPERATION,
    "diff": {
        "metadata": {
            "generalInfo": {
                "title": "Example Project",
                "projectNumber": "0001",
                "projectStage": "Design",
                "designer": "H2X",
                "reviewed": "JM",
                "approved": "AH",
                "client": "King Development",
                "description": "This is an example project to showcase the benefits of H2X."
            },
            "flowSystems": [
                {
                    "name": "Cold Water",
                    "temperature": 20,
                    "color": {
                        "hex": "#009CE0"
                    },
                    "uid": "cold-water",
                    "fluid": "water",
                    "hasReturnSystem": false,
                    "returnIsInsulated": false,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.5,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.5,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 20
                        }
                    }
                },
                {
                    "name": "Hot Water",
                    "temperature": 65,
                    "color": {
                        "hex": "#F44E3B"
                    },
                    "uid": "hot-water",
                    "fluid": "water",
                    "hasReturnSystem": true,
                    "returnIsInsulated": true,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 19,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 16
                        }
                    }
                },
                {
                    "name": "Warm Water",
                    "temperature": 50,
                    "color": {
                        "hex": "#F49000"
                    },
                    "uid": "warm-water",
                    "fluid": "water",
                    "hasReturnSystem": false,
                    "returnIsInsulated": false,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 16
                        }
                    }
                },
                {
                    "name": "Gas",
                    "temperature": 20,
                    "color": {
                        "hex": "#FCDC00"
                    },
                    "uid": "gas",
                    "fluid": "naturalGas",
                    "hasReturnSystem": false,
                    "returnIsInsulated": false,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 20,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 20,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 16
                        }
                    }
                },
                {
                    "name": "Fire Hydrant",
                    "temperature": 20,
                    "color": {
                        "hsl": {
                            "h": 1.8867924528301887,
                            "s": 1,
                            "l": 0.31176470588235294,
                            "a": 1
                        },
                        "hex": "#9F0500",
                        "hex8": "#9F0500FF",
                        "rgba": {
                            "r": 159,
                            "g": 5,
                            "b": 0,
                            "a": 1
                        },
                        "hsv": {
                            "h": 1.8867924528301887,
                            "s": 1,
                            "v": 0.6235294117647059,
                            "a": 1
                        },
                        "oldHue": 52.38095238095238,
                        "source": "hex",
                        "a": 1
                    },
                    "uid": "68193261-fff6-4842-8573-b1872dedbd86",
                    "fluid": "water",
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 4,
                            "material": "gmsMedium",
                            "minimumPipeSize": 100
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 4,
                            "material": "gmsMedium",
                            "minimumPipeSize": 100
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 4,
                            "material": "gmsMedium",
                            "minimumPipeSize": 100
                        }
                    },
                    "hasReturnSystem": false,
                    "returnIsInsulated": false,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "calciumSilicate",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25
                }
            ],
            "availableFixtures": [
                "basin",
                "bath",
                "shower",
                "kitchenSink",
                "wc",
                "washingMachine",
                "laundryTrough",
                "kitchenSinkHot",
                "hoseTap"
            ]
        },
        "levels": {
            "ground": {
                "entities": {
                    "883c8bcd-a994-4c3e-82ec-748f683e2cba": {
                        "parentUid": null,
                        "type": "BACKGROUND_IMAGE",
                        "filename": "Ground Floor [02].pdf",
                        "center": {
                            "x": 21730.71543308774,
                            "y": -1123.0795391118331
                        },
                        "crop": {
                            "x": -35957.55366445241,
                            "y": -22187.110385739576,
                            "w": 59398.234698507906,
                            "h": 35580.84963602552
                        },
                        "offset": {
                            "x": 0,
                            "y": 0
                        },
                        "page": 1,
                        "paperSize": {
                            "name": "Not detected",
                            "widthMM": 840.9121140142518,
                            "heightMM": 594
                        },
                        "pointA": null,
                        "pointB": null,
                        "rotation": 0,
                        "scaleFactor": 1,
                        "scaleName": "1:100",
                        "uid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "totalPages": 1,
                        "key": "93d18df9-fbfb-415f-9870-90135a7cae76.png"
                    },
                    "7c470d70-8f12-4bff-8ebb-862fc84870c2": {
                        "center": {
                            "x": -13711.393246152795,
                            "y": -18273.800722806558
                        },
                        "color": null,
                        "calculationHeightM": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "type": "FLOW_SOURCE",
                        "heightAboveGroundM": 14,
                        "minPressureKPA": 400,
                        "maxPressureKPA": 600,
                        "uid": "7c470d70-8f12-4bff-8ebb-862fc84870c2"
                    },
                    "f261b766-9a0f-42da-bc73-1549eff202c7": {
                        "heightAboveFloorM": 2,
                        "heightMM": 1300,
                        "widthMM": 2500,
                        "inletSystemUid": "cold-water",
                        "inletUid": "3b95a13b-be67-4cb1-8169-c50da9489473",
                        "outletSystemUid": "hot-water",
                        "outletTemperatureC": null,
                        "outletUid": "0de28125-ac31-42ad-9068-a1cd0a8665a4",
                        "center": {
                            "x": -9667.984133539932,
                            "y": -9871.268829496632
                        },
                        "rightToLeft": false,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "PLANT",
                        "uid": "f261b766-9a0f-42da-bc73-1549eff202c7",
                        "name": "Hot Water Plant",
                        "rotation": 0,
                        "plant": {
                            "type": "RETURN_SYSTEM",
                            "returnMinimumTemperatureC": null,
                            "gasConsumptionMJH": 800,
                            "returnUid": "7fbbf586-f8a8-471c-800d-1aaebd137202",
                            "gasNodeUid": "aaaa60b4-1c5a-4efb-a6a2-d0f6ec524324",
                            "gasPressureKPA": null,
                            "returnVelocityMS": null,
                            "addReturnToPSDFlowRate": true
                        }
                    },
                    "3b95a13b-be67-4cb1-8169-c50da9489473": {
                        "center": {
                            "x": -1250,
                            "y": 0
                        },
                        "parentUid": "f261b766-9a0f-42da-bc73-1549eff202c7",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "3b95a13b-be67-4cb1-8169-c50da9489473",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "0de28125-ac31-42ad-9068-a1cd0a8665a4": {
                        "center": {
                            "x": 1250,
                            "y": 0
                        },
                        "parentUid": "f261b766-9a0f-42da-bc73-1549eff202c7",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "uid": "0de28125-ac31-42ad-9068-a1cd0a8665a4",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "7fbbf586-f8a8-471c-800d-1aaebd137202": {
                        "center": {
                            "x": 1250,
                            "y": 325
                        },
                        "parentUid": "f261b766-9a0f-42da-bc73-1549eff202c7",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "uid": "7fbbf586-f8a8-471c-800d-1aaebd137202",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "aaaa60b4-1c5a-4efb-a6a2-d0f6ec524324": {
                        "center": {
                            "x": -1250,
                            "y": 325
                        },
                        "parentUid": "f261b766-9a0f-42da-bc73-1549eff202c7",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "uid": "aaaa60b4-1c5a-4efb-a6a2-d0f6ec524324",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "364dd4c8-8055-46f6-a272-f16aecfbd2b3": {
                        "center": {
                            "x": -13711.393246152795,
                            "y": -10446.029330212601
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "364dd4c8-8055-46f6-a272-f16aecfbd2b3"
                    },
                    "2256c697-fde5-410a-a739-66a0aedef169": {
                        "center": {
                            "x": -11917.609127684362,
                            "y": -10446.029330212601
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "2256c697-fde5-410a-a739-66a0aedef169"
                    },
                    "ff4868ed-f939-4126-b193-d35d7de35b3b": {
                        "center": {
                            "x": -11917.609127684362,
                            "y": -10807.32685500992
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "ff4868ed-f939-4126-b193-d35d7de35b3b"
                    },
                    "e9fa6226-96fd-44cb-9227-d0a6ac813f58": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "2256c697-fde5-410a-a739-66a0aedef169",
                            "ff4868ed-f939-4126-b193-d35d7de35b3b"
                        ],
                        "heightAboveFloorM": 2.699999999999999,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "e9fa6226-96fd-44cb-9227-d0a6ac813f58"
                    },
                    "dc770adf-458c-43bd-86f8-bccd584987a5": {
                        "center": {
                            "x": -13438.592491595355,
                            "y": -10446.029330212601
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "f82dc441-0fe1-4133-9239-65ee0a34cdcf",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "dc770adf-458c-43bd-86f8-bccd584987a5",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "f82dc441-0fe1-4133-9239-65ee0a34cdcf": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "dc770adf-458c-43bd-86f8-bccd584987a5",
                            "364dd4c8-8055-46f6-a272-f16aecfbd2b3"
                        ],
                        "heightAboveFloorM": 1.0000000000000007,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "f82dc441-0fe1-4133-9239-65ee0a34cdcf"
                    },
                    "3e560b7c-ca24-4838-8d1a-1b9b4a7ba315": {
                        "center": {
                            "x": -12160.77406935783,
                            "y": -10446.029330212601
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "ce426e18-4530-4c9e-91c7-ded4000ce863",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "3e560b7c-ca24-4838-8d1a-1b9b4a7ba315",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "12380a89-1229-4da6-bd08-cc6df6cbc00d": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "3e560b7c-ca24-4838-8d1a-1b9b4a7ba315",
                            "2256c697-fde5-410a-a739-66a0aedef169"
                        ],
                        "heightAboveFloorM": 1.0000000000000007,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "12380a89-1229-4da6-bd08-cc6df6cbc00d"
                    },
                    "c7d42acd-3585-433f-a466-7c4a205cb51c": {
                        "center": {
                            "x": -12794.927132503004,
                            "y": -10446.029330212601
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "bbec31c6-2b73-496e-820d-9511aea525c0",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "c7d42acd-3585-433f-a466-7c4a205cb51c",
                        "valve": {
                            "catalogId": "strainer",
                            "type": "STRAINER"
                        }
                    },
                    "fc792b4b-06d4-42b5-ab2a-8075e79bc1e5": {
                        "center": {
                            "x": -13115.174429391318,
                            "y": -10446.029330212601
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "17f9fff1-96fc-4117-9cd9-9ffb771413fa",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "fc792b4b-06d4-42b5-ab2a-8075e79bc1e5",
                        "valve": {
                            "pressureDropKPA": 0.15,
                            "catalogId": "waterMeter",
                            "type": "WATER_METER"
                        }
                    },
                    "17f9fff1-96fc-4117-9cd9-9ffb771413fa": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "fc792b4b-06d4-42b5-ab2a-8075e79bc1e5",
                            "c7d42acd-3585-433f-a466-7c4a205cb51c"
                        ],
                        "heightAboveFloorM": 1.0000000000000007,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "17f9fff1-96fc-4117-9cd9-9ffb771413fa"
                    },
                    "e667efcc-0acd-498e-90db-8d382787f959": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "fc792b4b-06d4-42b5-ab2a-8075e79bc1e5",
                            "dc770adf-458c-43bd-86f8-bccd584987a5"
                        ],
                        "heightAboveFloorM": 1.0000000000000007,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "e667efcc-0acd-498e-90db-8d382787f959"
                    },
                    "9cba9e81-3781-4d30-8f1f-34d257edb52c": {
                        "center": {
                            "x": -12484.19213156187,
                            "y": -10446.029330212601
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "bbec31c6-2b73-496e-820d-9511aea525c0",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "9cba9e81-3781-4d30-8f1f-34d257edb52c",
                        "valve": {
                            "type": "RPZD",
                            "catalogId": "RPZD",
                            "sizeMM": null,
                            "isolateOneWhenCalculatingHeadLoss": true
                        }
                    },
                    "bbec31c6-2b73-496e-820d-9511aea525c0": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "9cba9e81-3781-4d30-8f1f-34d257edb52c",
                            "c7d42acd-3585-433f-a466-7c4a205cb51c"
                        ],
                        "heightAboveFloorM": 1.0000000000000007,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "bbec31c6-2b73-496e-820d-9511aea525c0"
                    },
                    "ce426e18-4530-4c9e-91c7-ded4000ce863": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "9cba9e81-3781-4d30-8f1f-34d257edb52c",
                            "3e560b7c-ca24-4838-8d1a-1b9b4a7ba315"
                        ],
                        "heightAboveFloorM": 1.0000000000000007,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ce426e18-4530-4c9e-91c7-ded4000ce863"
                    },
                    "c3fc0aab-5bc4-46c4-8bac-5cea5d3515f3": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "ff4868ed-f939-4126-b193-d35d7de35b3b",
                            "2edbc5b5-ad0a-4672-873b-00f6cfaf637d"
                        ],
                        "heightAboveFloorM": 2.699999999999999,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "c3fc0aab-5bc4-46c4-8bac-5cea5d3515f3"
                    },
                    "f9e70a31-4312-4147-9396-3b0d5dae570b": {
                        "center": {
                            "x": -6432.40715881542,
                            "y": -6413.33042894346
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "f9e70a31-4312-4147-9396-3b0d5dae570b"
                    },
                    "2c1a4c3e-4ee1-4797-8743-a36c5f93c4dc": {
                        "center": {
                            "x": 13761.655472632629,
                            "y": -6413.33042894346
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "2c1a4c3e-4ee1-4797-8743-a36c5f93c4dc"
                    },
                    "b5b10a68-c711-4547-a0f0-373c8f0f4064": {
                        "center": {
                            "x": -11286.795308456223,
                            "y": -9871.987031348006
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "b5b10a68-c711-4547-a0f0-373c8f0f4064"
                    },
                    "7233a08f-e43d-43c6-a76e-0cab9bd0a3b1": {
                        "center": {
                            "x": -11286.795308456225,
                            "y": -10616.856813819879
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "7233a08f-e43d-43c6-a76e-0cab9bd0a3b1"
                    },
                    "3d0f731c-1cb3-40a2-aaec-16f9550c7ce0": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "b5b10a68-c711-4547-a0f0-373c8f0f4064",
                            "7233a08f-e43d-43c6-a76e-0cab9bd0a3b1"
                        ],
                        "heightAboveFloorM": 2.7,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "3d0f731c-1cb3-40a2-aaec-16f9550c7ce0"
                    },
                    "cbce59c7-3410-48d8-aee7-48b09e83825f": {
                        "center": {
                            "x": -6432.40715881542,
                            "y": -10616.856813819879
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "cbce59c7-3410-48d8-aee7-48b09e83825f"
                    },
                    "0ef1cd13-8edd-4924-9524-172e0544adff": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "cbce59c7-3410-48d8-aee7-48b09e83825f",
                            "924c02c5-e487-453b-b84b-35ef0bc57533"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "0ef1cd13-8edd-4924-9524-172e0544adff"
                    },
                    "05508f9b-0021-42ab-925f-da2948d28bad": {
                        "center": {
                            "x": -7180.753220654544,
                            "y": -9871.268829496632
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "05508f9b-0021-42ab-925f-da2948d28bad"
                    },
                    "95e7994c-f12a-4568-887a-ec1f6cd6dd0e": {
                        "center": {
                            "x": -5939.414183242958,
                            "y": -9871.268829496632
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "95e7994c-f12a-4568-887a-ec1f6cd6dd0e"
                    },
                    "5fecb1dc-dbf6-426b-80e7-5689e3d130de": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "05508f9b-0021-42ab-925f-da2948d28bad",
                            "95e7994c-f12a-4568-887a-ec1f6cd6dd0e"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "5fecb1dc-dbf6-426b-80e7-5689e3d130de"
                    },
                    "0970f36f-37f7-4d85-a170-f2793d973220": {
                        "center": {
                            "x": -5939.414183242958,
                            "y": -6767.976484165987
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "0970f36f-37f7-4d85-a170-f2793d973220"
                    },
                    "ba4dfe8a-c9c4-45f3-b877-ec821d02df0d": {
                        "center": {
                            "x": 14073.284943039165,
                            "y": -6767.976484165987
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "ba4dfe8a-c9c4-45f3-b877-ec821d02df0d"
                    },
                    "d758a8a9-fb2d-42c0-acfe-da29b9a7f1a3": {
                        "center": {
                            "x": 14073.284943039165,
                            "y": -6081.823905941908
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "d758a8a9-fb2d-42c0-acfe-da29b9a7f1a3"
                    },
                    "8b9f3752-7c68-4dd3-9335-6f1412cf9fa1": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "ba4dfe8a-c9c4-45f3-b877-ec821d02df0d",
                            "d758a8a9-fb2d-42c0-acfe-da29b9a7f1a3"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "8b9f3752-7c68-4dd3-9335-6f1412cf9fa1"
                    },
                    "1af9ade6-5d66-447a-8ce6-d306d6f81acc": {
                        "center": {
                            "x": -7557.539690886708,
                            "y": -6363.472364178329
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "1af9ade6-5d66-447a-8ce6-d306d6f81acc"
                    },
                    "d77f15e7-f357-4654-9171-e0475214c039": {
                        "center": {
                            "x": -7169.246917577244,
                            "y": -9549.925520970279
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "d77f15e7-f357-4654-9171-e0475214c039"
                    },
                    "fccd1ab3-74f6-4124-92f1-74285c95b7ff": {
                        "center": {
                            "x": -5485.573067945785,
                            "y": -9546.935775769833
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "fccd1ab3-74f6-4124-92f1-74285c95b7ff"
                    },
                    "5fbd1bee-c424-49be-b431-827df90213cb": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "d77f15e7-f357-4654-9171-e0475214c039",
                            "fccd1ab3-74f6-4124-92f1-74285c95b7ff"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "5fbd1bee-c424-49be-b431-827df90213cb"
                    },
                    "6da87f0b-a0d6-4ffd-9b9d-f43085a1d3cf": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "fccd1ab3-74f6-4124-92f1-74285c95b7ff",
                            "e4d947f4-572c-4b64-974c-834ccd734e8b"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "6da87f0b-a0d6-4ffd-9b9d-f43085a1d3cf"
                    },
                    "628550de-688d-448b-84fe-2216624fd7e8": {
                        "center": {
                            "x": -8249.276214804348,
                            "y": -9546.762858824894
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "hot-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "628550de-688d-448b-84fe-2216624fd7e8"
                    },
                    "a9e8520b-06e1-4980-84c1-19d24268e6fa": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "628550de-688d-448b-84fe-2216624fd7e8",
                            "7fbbf586-f8a8-471c-800d-1aaebd137202"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "a9e8520b-06e1-4980-84c1-19d24268e6fa"
                    },
                    "d7e506f1-a091-403d-863a-17c9d168dff1": {
                        "center": {
                            "x": -8248.324239858439,
                            "y": -9221.66938233451
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "d7e506f1-a091-403d-863a-17c9d168dff1"
                    },
                    "627bc9c8-db1a-4672-b201-a721ee7dd3b2": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "628550de-688d-448b-84fe-2216624fd7e8",
                            "d7e506f1-a091-403d-863a-17c9d168dff1"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "627bc9c8-db1a-4672-b201-a721ee7dd3b2"
                    },
                    "0fe31025-c2cf-4f38-8389-4fa8b77ee2b7": {
                        "center": {
                            "x": -7148.257474014776,
                            "y": -9224.890720428451
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "0fe31025-c2cf-4f38-8389-4fa8b77ee2b7"
                    },
                    "1fc01957-88c7-4e61-bb94-68b168d894bc": {
                        "center": {
                            "x": -6843.916201040094,
                            "y": -9224.890720428451
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "1fc01957-88c7-4e61-bb94-68b168d894bc"
                    },
                    "240a17fd-96b2-4c0b-aa0e-738bc2a7f7e7": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "0fe31025-c2cf-4f38-8389-4fa8b77ee2b7",
                            "1fc01957-88c7-4e61-bb94-68b168d894bc"
                        ],
                        "heightAboveFloorM": 2.6,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "240a17fd-96b2-4c0b-aa0e-738bc2a7f7e7"
                    },
                    "a767951a-92b2-48f0-b232-636cb835c63f": {
                        "center": {
                            "x": -6843.916201040094,
                            "y": -6081.823905941908
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 6.162162162162163,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "hot-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "a767951a-92b2-48f0-b232-636cb835c63f"
                    },
                    "665216c0-a433-482a-a342-60ecf784c607": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "a767951a-92b2-48f0-b232-636cb835c63f",
                            "d758a8a9-fb2d-42c0-acfe-da29b9a7f1a3"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "665216c0-a433-482a-a342-60ecf784c607"
                    },
                    "833c44c7-b496-47cc-86fb-0f7dd7584530": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "1fc01957-88c7-4e61-bb94-68b168d894bc",
                            "a767951a-92b2-48f0-b232-636cb835c63f"
                        ],
                        "heightAboveFloorM": 2.6,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "833c44c7-b496-47cc-86fb-0f7dd7584530"
                    },
                    "37383e57-4532-43ff-926a-97d6d7d1852b": {
                        "center": {
                            "x": -7985.882613088133,
                            "y": -9547.534157321725
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "a7b98059-ba88-47ad-80b1-99ef42223a90",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "37383e57-4532-43ff-926a-97d6d7d1852b",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "a7b98059-ba88-47ad-80b1-99ef42223a90": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "37383e57-4532-43ff-926a-97d6d7d1852b",
                            "628550de-688d-448b-84fe-2216624fd7e8"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "a7b98059-ba88-47ad-80b1-99ef42223a90"
                    },
                    "915869ff-0032-4930-b450-752514265dcc": {
                        "center": {
                            "x": -7984.930638142225,
                            "y": -9222.440680831342
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "657087b7-9d13-44b0-b588-a2367458e63e",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "915869ff-0032-4930-b450-752514265dcc",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "657087b7-9d13-44b0-b588-a2367458e63e": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "915869ff-0032-4930-b450-752514265dcc",
                            "d7e506f1-a091-403d-863a-17c9d168dff1"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "657087b7-9d13-44b0-b588-a2367458e63e"
                    },
                    "819a968e-ca9a-47af-8190-7d29cba41186": {
                        "center": {
                            "x": -7431.0446909674065,
                            "y": -9549.158895555789
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "f9cd11ca-67c2-441c-9c24-0a62b5b96553",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "819a968e-ca9a-47af-8190-7d29cba41186",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "ca3191c2-30fc-4fda-ba67-593967d730f2": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "819a968e-ca9a-47af-8190-7d29cba41186",
                            "d77f15e7-f357-4654-9171-e0475214c039"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ca3191c2-30fc-4fda-ba67-593967d730f2"
                    },
                    "8bba8008-bdbe-43c5-b743-17c62486f82b": {
                        "center": {
                            "x": -7430.092716021496,
                            "y": -9224.065419065406
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "1586428e-ec42-4c44-b168-4831dad7d472",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "8bba8008-bdbe-43c5-b743-17c62486f82b",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "bfe6fd08-9f94-4e3e-a0e2-f0b826e5d7f4": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "8bba8008-bdbe-43c5-b743-17c62486f82b",
                            "0fe31025-c2cf-4f38-8389-4fa8b77ee2b7"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "bfe6fd08-9f94-4e3e-a0e2-f0b826e5d7f4"
                    },
                    "3b310fc7-89df-486d-a090-2b29d992c2cd": {
                        "center": {
                            "x": -7713.197560953879,
                            "y": -9548.332664079098
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "f9cd11ca-67c2-441c-9c24-0a62b5b96553",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "3b310fc7-89df-486d-a090-2b29d992c2cd",
                        "valve": {
                            "type": "BALANCING",
                            "catalogId": "balancing"
                        }
                    },
                    "f9cd11ca-67c2-441c-9c24-0a62b5b96553": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "3b310fc7-89df-486d-a090-2b29d992c2cd",
                            "819a968e-ca9a-47af-8190-7d29cba41186"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "f9cd11ca-67c2-441c-9c24-0a62b5b96553"
                    },
                    "7fc26b71-0c14-4c31-b16a-f273bc82806d": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "3b310fc7-89df-486d-a090-2b29d992c2cd",
                            "37383e57-4532-43ff-926a-97d6d7d1852b"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "7fc26b71-0c14-4c31-b16a-f273bc82806d"
                    },
                    "dd0fc813-2b9a-42d1-b4be-cede08cf9d02": {
                        "center": {
                            "x": -7713.197560953879,
                            "y": -9223.23639990959
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "1586428e-ec42-4c44-b168-4831dad7d472",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "dd0fc813-2b9a-42d1-b4be-cede08cf9d02",
                        "valve": {
                            "type": "BALANCING",
                            "catalogId": "balancing"
                        }
                    },
                    "1586428e-ec42-4c44-b168-4831dad7d472": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "dd0fc813-2b9a-42d1-b4be-cede08cf9d02",
                            "8bba8008-bdbe-43c5-b743-17c62486f82b"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "1586428e-ec42-4c44-b168-4831dad7d472"
                    },
                    "e7ce25ef-5ec4-43ad-bee4-bc92444d021f": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "dd0fc813-2b9a-42d1-b4be-cede08cf9d02",
                            "915869ff-0032-4930-b450-752514265dcc"
                        ],
                        "heightAboveFloorM": 1.9999999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "e7ce25ef-5ec4-43ad-bee4-bc92444d021f"
                    },
                    "f639f562-fce4-4e56-a415-126f14fccd3d": {
                        "center": {
                            "x": -8167.664361131314,
                            "y": -9871.268829496632
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "eed2f33e-9070-4bbf-87b8-9e4b16ac4c12",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "f639f562-fce4-4e56-a415-126f14fccd3d",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "eed2f33e-9070-4bbf-87b8-9e4b16ac4c12": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "f639f562-fce4-4e56-a415-126f14fccd3d",
                            "0de28125-ac31-42ad-9068-a1cd0a8665a4"
                        ],
                        "heightAboveFloorM": 2,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "eed2f33e-9070-4bbf-87b8-9e4b16ac4c12"
                    },
                    "1eb0c5cb-0167-4708-b9e8-dbb1986555a8": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "f639f562-fce4-4e56-a415-126f14fccd3d",
                            "05508f9b-0021-42ab-925f-da2948d28bad"
                        ],
                        "heightAboveFloorM": 2,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "1eb0c5cb-0167-4708-b9e8-dbb1986555a8"
                    },
                    "8d90950d-e57e-4b2d-93e4-9a921a99c7f9": {
                        "center": {
                            "x": -6432.40715881542,
                            "y": -10301.506349549367
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "3f35d949-5de1-480d-a943-6072911f0833",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "8d90950d-e57e-4b2d-93e4-9a921a99c7f9",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "3f35d949-5de1-480d-a943-6072911f0833": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "8d90950d-e57e-4b2d-93e4-9a921a99c7f9",
                            "cbce59c7-3410-48d8-aee7-48b09e83825f"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "3f35d949-5de1-480d-a943-6072911f0833"
                    },
                    "90f4f467-720d-42bc-a100-d11ee15576f7": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "8d90950d-e57e-4b2d-93e4-9a921a99c7f9",
                            "f9e70a31-4312-4147-9396-3b0d5dae570b"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "90f4f467-720d-42bc-a100-d11ee15576f7"
                    },
                    "e695eb80-9fca-4d11-b0fb-693a38425156": {
                        "center": {
                            "x": -6762.2205025164,
                            "y": -10616.856813819879
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "cc48c2fa-27c4-4f40-8a8c-a8c20f14c2b7",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "e695eb80-9fca-4d11-b0fb-693a38425156",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "cc48c2fa-27c4-4f40-8a8c-a8c20f14c2b7": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "e695eb80-9fca-4d11-b0fb-693a38425156",
                            "7233a08f-e43d-43c6-a76e-0cab9bd0a3b1"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "cc48c2fa-27c4-4f40-8a8c-a8c20f14c2b7"
                    },
                    "3e0ab0bb-c812-4ad4-b45f-1587ff8ef1e5": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "e695eb80-9fca-4d11-b0fb-693a38425156",
                            "cbce59c7-3410-48d8-aee7-48b09e83825f"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "3e0ab0bb-c812-4ad4-b45f-1587ff8ef1e5"
                    },
                    "acf2bf43-fdef-47be-898c-336a94b21532": {
                        "center": {
                            "x": -11059.068321388408,
                            "y": -9874.071322685242
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "2de6de8f-7f1c-48cf-b33a-c72cb137c97a",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "acf2bf43-fdef-47be-898c-336a94b21532",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "2de6de8f-7f1c-48cf-b33a-c72cb137c97a": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "acf2bf43-fdef-47be-898c-336a94b21532",
                            "3b95a13b-be67-4cb1-8169-c50da9489473"
                        ],
                        "heightAboveFloorM": 2,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "2de6de8f-7f1c-48cf-b33a-c72cb137c97a"
                    },
                    "ed3d0b8f-807e-49e5-829a-2661a57bbe26": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "acf2bf43-fdef-47be-898c-336a94b21532",
                            "b5b10a68-c711-4547-a0f0-373c8f0f4064"
                        ],
                        "heightAboveFloorM": 2,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ed3d0b8f-807e-49e5-829a-2661a57bbe26"
                    },
                    "737ebdc9-2b9d-48d8-b5b7-879f1e288807": {
                        "center": {
                            "x": -13711.393246152795,
                            "y": -17727.992266518602
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "84224f8e-1a1a-4b38-afd2-27051d823f42",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "737ebdc9-2b9d-48d8-b5b7-879f1e288807",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "84224f8e-1a1a-4b38-afd2-27051d823f42": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "737ebdc9-2b9d-48d8-b5b7-879f1e288807",
                            "7c470d70-8f12-4bff-8ebb-862fc84870c2"
                        ],
                        "heightAboveFloorM": -1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "84224f8e-1a1a-4b38-afd2-27051d823f42"
                    },
                    "e8e42631-5f02-40c8-81ec-b91263d11c65": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "737ebdc9-2b9d-48d8-b5b7-879f1e288807",
                            "364dd4c8-8055-46f6-a272-f16aecfbd2b3"
                        ],
                        "heightAboveFloorM": -1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "e8e42631-5f02-40c8-81ec-b91263d11c65"
                    },
                    "7dc77696-9eef-4b06-8055-182fe1f91ced": {
                        "center": {
                            "x": -5939.414183242958,
                            "y": -10130.777219713204
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "70114ca3-57f4-43f9-b50a-acbad407746e",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "7dc77696-9eef-4b06-8055-182fe1f91ced",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "70114ca3-57f4-43f9-b50a-acbad407746e": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "7dc77696-9eef-4b06-8055-182fe1f91ced",
                            "95e7994c-f12a-4568-887a-ec1f6cd6dd0e"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "70114ca3-57f4-43f9-b50a-acbad407746e"
                    },
                    "b0aa1ed2-f912-4dfe-b38b-08373d8d289f": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "7dc77696-9eef-4b06-8055-182fe1f91ced",
                            "99a0b1d3-6376-412c-b5d0-f0e2df4d7a3d"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "b0aa1ed2-f912-4dfe-b38b-08373d8d289f"
                    },
                    "6dbf712e-b559-475c-8261-3cbd3358224a": {
                        "center": {
                            "x": -5939.414183242958,
                            "y": -9288.051047900994
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "53377ac8-f78c-4b37-91fd-01f675b39306",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "6dbf712e-b559-475c-8261-3cbd3358224a",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "53377ac8-f78c-4b37-91fd-01f675b39306": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "6dbf712e-b559-475c-8261-3cbd3358224a",
                            "95e7994c-f12a-4568-887a-ec1f6cd6dd0e"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "53377ac8-f78c-4b37-91fd-01f675b39306"
                    },
                    "9f1e2533-6df7-470c-86d9-ad430e69fea3": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "6dbf712e-b559-475c-8261-3cbd3358224a",
                            "0970f36f-37f7-4d85-a170-f2793d973220"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "9f1e2533-6df7-470c-86d9-ad430e69fea3"
                    },
                    "bd0f4202-1611-4480-b368-bd7564c74e41": {
                        "center": {
                            "x": -11371.07106039288,
                            "y": -9546.268829496632
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "bd0f4202-1611-4480-b368-bd7564c74e41"
                    },
                    "28fc3636-9157-475b-b043-373d48517ba9": {
                        "center": {
                            "x": -11371.07106039288,
                            "y": -10047.304635364446
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "28fc3636-9157-475b-b043-373d48517ba9"
                    },
                    "48a798b7-b385-4bcd-a46b-bc946b19acaf": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "bd0f4202-1611-4480-b368-bd7564c74e41",
                            "28fc3636-9157-475b-b043-373d48517ba9"
                        ],
                        "heightAboveFloorM": 2.6999999999999975,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "48a798b7-b385-4bcd-a46b-bc946b19acaf"
                    },
                    "3fad7c47-d46f-4dd1-9b27-fa23fdd4c9ab": {
                        "center": {
                            "x": -14040.56817514895,
                            "y": -10047.304635364446
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "3fad7c47-d46f-4dd1-9b27-fa23fdd4c9ab"
                    },
                    "0cf9f0d7-c186-45fb-b9b7-334c96402763": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "28fc3636-9157-475b-b043-373d48517ba9",
                            "3fad7c47-d46f-4dd1-9b27-fa23fdd4c9ab"
                        ],
                        "heightAboveFloorM": 2.6999999999999975,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "0cf9f0d7-c186-45fb-b9b7-334c96402763"
                    },
                    "8e7a552a-dff4-4bd2-99d1-2f91fd88efba": {
                        "center": {
                            "x": -14040.56817514895,
                            "y": -10884.90689920347
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "8e7a552a-dff4-4bd2-99d1-2f91fd88efba"
                    },
                    "567e0514-e592-4118-b8a0-9014217243ce": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "3fad7c47-d46f-4dd1-9b27-fa23fdd4c9ab",
                            "8e7a552a-dff4-4bd2-99d1-2f91fd88efba"
                        ],
                        "heightAboveFloorM": 2.6999999999999975,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "567e0514-e592-4118-b8a0-9014217243ce"
                    },
                    "cc4d406e-6e24-4f32-be60-afcd3ce32c3b": {
                        "center": {
                            "x": -14040.56817514895,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "cc4d406e-6e24-4f32-be60-afcd3ce32c3b"
                    },
                    "111bcdb1-cca6-4788-89d0-7e42c9ad093e": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "8e7a552a-dff4-4bd2-99d1-2f91fd88efba",
                            "cc4d406e-6e24-4f32-be60-afcd3ce32c3b"
                        ],
                        "heightAboveFloorM": -1.0000000000000018,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "111bcdb1-cca6-4788-89d0-7e42c9ad093e"
                    },
                    "a7487a8f-7c10-4e08-89cf-e09f44f5f882": {
                        "center": {
                            "x": -15324.206046297906,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "a7487a8f-7c10-4e08-89cf-e09f44f5f882"
                    },
                    "b31720eb-b6ea-48b9-af4f-ebe339349f57": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "cc4d406e-6e24-4f32-be60-afcd3ce32c3b",
                            "a7487a8f-7c10-4e08-89cf-e09f44f5f882"
                        ],
                        "heightAboveFloorM": -1.0000000000000018,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "b31720eb-b6ea-48b9-af4f-ebe339349f57"
                    },
                    "efab15ca-bdff-472d-9f57-ebd207c68c0a": {
                        "center": {
                            "x": -17501.67482431731,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "efab15ca-bdff-472d-9f57-ebd207c68c0a"
                    },
                    "bc781ba3-ce62-4c48-931d-a4d7d0e03a57": {
                        "center": {
                            "x": -17501.67482431731,
                            "y": -19308.009802358472
                        },
                        "color": null,
                        "calculationHeightM": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "gas",
                        "type": "FLOW_SOURCE",
                        "heightAboveGroundM": 14,
                        "minPressureKPA": 210,
                        "maxPressureKPA": null,
                        "uid": "bc781ba3-ce62-4c48-931d-a4d7d0e03a57"
                    },
                    "ba1354f1-966c-4958-9b86-c8c55c3fd153": {
                        "center": {
                            "x": -11056.06808015361,
                            "y": -9546.268829496632
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "5544178e-b56b-4539-9f51-1f75a6623216",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "ba1354f1-966c-4958-9b86-c8c55c3fd153",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "5544178e-b56b-4539-9f51-1f75a6623216": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "ba1354f1-966c-4958-9b86-c8c55c3fd153",
                            "aaaa60b4-1c5a-4efb-a6a2-d0f6ec524324"
                        ],
                        "heightAboveFloorM": 2,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "5544178e-b56b-4539-9f51-1f75a6623216"
                    },
                    "922241b7-caf0-40b9-9470-3d98348ae2c5": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "ba1354f1-966c-4958-9b86-c8c55c3fd153",
                            "bd0f4202-1611-4480-b368-bd7564c74e41"
                        ],
                        "heightAboveFloorM": 2,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "922241b7-caf0-40b9-9470-3d98348ae2c5"
                    },
                    "0b294582-49ca-4a5a-9b41-055243261d69": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "bc781ba3-ce62-4c48-931d-a4d7d0e03a57",
                            "efab15ca-bdff-472d-9f57-ebd207c68c0a"
                        ],
                        "heightAboveFloorM": -1.0000000000000018,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "0b294582-49ca-4a5a-9b41-055243261d69"
                    },
                    "dba23c2f-734e-4c9b-9313-51b2f0df9cd1": {
                        "center": {
                            "x": -16451.98837813353,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "a1f5787d-a28c-4347-bcc4-f82ae046c888",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "dba23c2f-734e-4c9b-9313-51b2f0df9cd1",
                        "valve": {
                            "type": "GAS_REGULATOR",
                            "catalogId": "gasRegulator",
                            "outletPressureKPA": 5
                        }
                    },
                    "b483f932-a45b-44b4-b5cb-60fa94eea124": {
                        "center": {
                            "x": -16803.459316890607,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "a1f5787d-a28c-4347-bcc4-f82ae046c888",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "b483f932-a45b-44b4-b5cb-60fa94eea124",
                        "valve": {
                            "type": "FILTER",
                            "catalogId": "filter",
                            "pressureDropKPA": 0.25
                        }
                    },
                    "a1f5787d-a28c-4347-bcc4-f82ae046c888": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "b483f932-a45b-44b4-b5cb-60fa94eea124",
                            "dba23c2f-734e-4c9b-9313-51b2f0df9cd1"
                        ],
                        "heightAboveFloorM": 0.9999999999999989,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "a1f5787d-a28c-4347-bcc4-f82ae046c888"
                    },
                    "3a1b05fa-6011-4201-ab1c-ab4470127882": {
                        "center": {
                            "x": -16104.256491916418,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "64a6041b-0f91-4bbe-94bd-6ca5b05d9e4e",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "3a1b05fa-6011-4201-ab1c-ab4470127882",
                        "valve": {
                            "pressureDropKPA": 0.25,
                            "catalogId": "waterMeter",
                            "type": "WATER_METER"
                        }
                    },
                    "64a6041b-0f91-4bbe-94bd-6ca5b05d9e4e": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "3a1b05fa-6011-4201-ab1c-ab4470127882",
                            "dba23c2f-734e-4c9b-9313-51b2f0df9cd1"
                        ],
                        "heightAboveFloorM": 0.9999999999999989,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "64a6041b-0f91-4bbe-94bd-6ca5b05d9e4e"
                    },
                    "19781734-62aa-498d-b557-01ff20d8f129": {
                        "center": {
                            "x": -17166.14741326759,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "af99942d-31e7-4bf3-9f37-ff35cc7296a0",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "19781734-62aa-498d-b557-01ff20d8f129",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "gateValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "af99942d-31e7-4bf3-9f37-ff35cc7296a0": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "19781734-62aa-498d-b557-01ff20d8f129",
                            "b483f932-a45b-44b4-b5cb-60fa94eea124"
                        ],
                        "heightAboveFloorM": 0.9999999999999989,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "af99942d-31e7-4bf3-9f37-ff35cc7296a0"
                    },
                    "b6a80b2e-e3ec-4e35-88ae-887484b5cab3": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "19781734-62aa-498d-b557-01ff20d8f129",
                            "efab15ca-bdff-472d-9f57-ebd207c68c0a"
                        ],
                        "heightAboveFloorM": 0.9999999999999989,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "b6a80b2e-e3ec-4e35-88ae-887484b5cab3"
                    },
                    "521109a9-16fb-4678-9790-6216499cd3c9": {
                        "center": {
                            "x": -15775.219868399156,
                            "y": -13203.753847209671
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "c9c064bd-0f9a-45ca-b37a-70089611df31",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "521109a9-16fb-4678-9790-6216499cd3c9",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "gateValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "c9c064bd-0f9a-45ca-b37a-70089611df31": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "521109a9-16fb-4678-9790-6216499cd3c9",
                            "3a1b05fa-6011-4201-ab1c-ab4470127882"
                        ],
                        "heightAboveFloorM": 0.9999999999999989,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "c9c064bd-0f9a-45ca-b37a-70089611df31"
                    },
                    "19ba80b3-d32e-45c9-b85d-73877965ed94": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "521109a9-16fb-4678-9790-6216499cd3c9",
                            "a7487a8f-7c10-4e08-89cf-e09f44f5f882"
                        ],
                        "heightAboveFloorM": 0.9999999999999989,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "19ba80b3-d32e-45c9-b85d-73877965ed94"
                    },
                    "baaaedef-1b2e-4aec-bb7e-bfdf0d253e3a": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 1632.6536083952742,
                            "y": -10778.660006937693
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "baaaedef-1b2e-4aec-bb7e-bfdf0d253e3a",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "63bf0478-382f-4452-89b4-e48a1b084aeb"
                            }
                        }
                    },
                    "63bf0478-382f-4452-89b4-e48a1b084aeb": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "baaaedef-1b2e-4aec-bb7e-bfdf0d253e3a",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "63bf0478-382f-4452-89b4-e48a1b084aeb",
                        "configuration": 0
                    },
                    "293b3dfe-d776-459d-a545-766a3fe43bde": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 3640.294248588827,
                            "y": -10778.660006937693
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "293b3dfe-d776-459d-a545-766a3fe43bde",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "ca1e977c-3058-40e0-8bad-bf5d2d7f525d"
                            }
                        }
                    },
                    "ca1e977c-3058-40e0-8bad-bf5d2d7f525d": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "293b3dfe-d776-459d-a545-766a3fe43bde",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "ca1e977c-3058-40e0-8bad-bf5d2d7f525d",
                        "configuration": 0
                    },
                    "a98a8a70-1ff7-4b82-9068-ba7062556645": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 4554.5297971902255,
                            "y": -10778.660006937693
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "a98a8a70-1ff7-4b82-9068-ba7062556645",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "40a26730-d139-464c-9f38-a131198d45bb"
                            }
                        }
                    },
                    "40a26730-d139-464c-9f38-a131198d45bb": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "a98a8a70-1ff7-4b82-9068-ba7062556645",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "40a26730-d139-464c-9f38-a131198d45bb",
                        "configuration": 0
                    },
                    "1abd1b9f-54f3-4ea5-b4f7-6ac705b3db38": {
                        "abbreviation": "SHR",
                        "center": {
                            "x": 2625.71577392142,
                            "y": -10778.660006937693
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "1abd1b9f-54f3-4ea5-b4f7-6ac705b3db38",
                        "fixtureUnits": null,
                        "name": "shower",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "fb24da9c-72de-4081-801d-9cde682e47cc"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "cb5362a0-93b2-461d-ad88-d5fe881b40f6"
                            }
                        }
                    },
                    "fb24da9c-72de-4081-801d-9cde682e47cc": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "1abd1b9f-54f3-4ea5-b4f7-6ac705b3db38",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "fb24da9c-72de-4081-801d-9cde682e47cc",
                        "configuration": 0
                    },
                    "cb5362a0-93b2-461d-ad88-d5fe881b40f6": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "1abd1b9f-54f3-4ea5-b4f7-6ac705b3db38",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "cb5362a0-93b2-461d-ad88-d5fe881b40f6",
                        "configuration": 0
                    },
                    "745bb69c-7099-4adf-84e8-4f5902bab351": {
                        "abbreviation": "B",
                        "center": {
                            "x": 1618.4656253709218,
                            "y": -7560.811001626764
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "745bb69c-7099-4adf-84e8-4f5902bab351",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "a70ce7b1-b32c-40e4-9b98-a61253b7ccc8"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "f0c2fa12-057b-4e67-8a61-dc93be1ef783"
                            }
                        }
                    },
                    "a70ce7b1-b32c-40e4-9b98-a61253b7ccc8": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "745bb69c-7099-4adf-84e8-4f5902bab351",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "a70ce7b1-b32c-40e4-9b98-a61253b7ccc8",
                        "configuration": 0
                    },
                    "f0c2fa12-057b-4e67-8a61-dc93be1ef783": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "745bb69c-7099-4adf-84e8-4f5902bab351",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "f0c2fa12-057b-4e67-8a61-dc93be1ef783",
                        "configuration": 0
                    },
                    "43f9fd0b-8aa2-4726-900c-c0529cdb98cf": {
                        "abbreviation": "B",
                        "center": {
                            "x": 2598.242126716501,
                            "y": -7560.811001626764
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "43f9fd0b-8aa2-4726-900c-c0529cdb98cf",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "7f84f89c-a5e6-4829-839b-73233475b8bf"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "c9f8f59e-553a-4cb4-a566-528bc8c6b1c6"
                            }
                        }
                    },
                    "7f84f89c-a5e6-4829-839b-73233475b8bf": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "43f9fd0b-8aa2-4726-900c-c0529cdb98cf",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "7f84f89c-a5e6-4829-839b-73233475b8bf",
                        "configuration": 0
                    },
                    "c9f8f59e-553a-4cb4-a566-528bc8c6b1c6": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "43f9fd0b-8aa2-4726-900c-c0529cdb98cf",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "c9f8f59e-553a-4cb4-a566-528bc8c6b1c6",
                        "configuration": 0
                    },
                    "91c742b2-47ed-4cb3-85a5-d5a96ce71e04": {
                        "abbreviation": "B",
                        "center": {
                            "x": 3573.9362259731424,
                            "y": -7560.811001626764
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "91c742b2-47ed-4cb3-85a5-d5a96ce71e04",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "e66f6c38-19bf-43dd-a2a9-f64f66f1a1e6"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "834a601f-64ce-4b9d-9080-71c68858b706"
                            }
                        }
                    },
                    "e66f6c38-19bf-43dd-a2a9-f64f66f1a1e6": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "91c742b2-47ed-4cb3-85a5-d5a96ce71e04",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "e66f6c38-19bf-43dd-a2a9-f64f66f1a1e6",
                        "configuration": 0
                    },
                    "834a601f-64ce-4b9d-9080-71c68858b706": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "91c742b2-47ed-4cb3-85a5-d5a96ce71e04",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "834a601f-64ce-4b9d-9080-71c68858b706",
                        "configuration": 0
                    },
                    "d09f2c55-22e8-4d01-b298-4785bc2b499b": {
                        "abbreviation": "B",
                        "center": {
                            "x": 4541.465521051901,
                            "y": -7560.811001626764
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "d09f2c55-22e8-4d01-b298-4785bc2b499b",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "89880949-3d8a-4419-bd83-2cb052786f12"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "f17aae19-cbd9-4da2-89a6-32f33b1a2945"
                            }
                        }
                    },
                    "89880949-3d8a-4419-bd83-2cb052786f12": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "d09f2c55-22e8-4d01-b298-4785bc2b499b",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "89880949-3d8a-4419-bd83-2cb052786f12",
                        "configuration": 0
                    },
                    "f17aae19-cbd9-4da2-89a6-32f33b1a2945": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "d09f2c55-22e8-4d01-b298-4785bc2b499b",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "f17aae19-cbd9-4da2-89a6-32f33b1a2945",
                        "configuration": 0
                    },
                    "115ea465-c2a5-4c2f-b994-e620b35b1f24": {
                        "coldRoughInUid": "1a4a2572-b2e9-4e6b-9024-792f37951223",
                        "hotRoughInUid": "f8660599-635d-4970-b767-018182d97a95",
                        "maxFlowRateLS": null,
                        "maxHotColdPressureDifferentialPCT": null,
                        "maxInletPressureKPA": null,
                        "minFlowRateLS": null,
                        "minInletPressureKPA": null,
                        "pipeDistanceMM": 150,
                        "rotation": 180,
                        "valveLengthMM": 200,
                        "valve": {
                            "type": "TMV",
                            "warmOutputUid": "c011670e-58d9-4f70-8c51-0d9913bc8510",
                            "coldOutputUid": "011f6a2d-8a7b-4eef-bfab-f88d0fea3200",
                            "catalogId": "tmv"
                        },
                        "type": "BIG_VALVE",
                        "center": {
                            "x": 583.1922541312779,
                            "y": -7393.121957611085
                        },
                        "heightAboveFloorM": 1,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "outputTemperatureC": 50,
                        "uid": "115ea465-c2a5-4c2f-b994-e620b35b1f24"
                    },
                    "1a4a2572-b2e9-4e6b-9024-792f37951223": {
                        "center": {
                            "x": 75,
                            "y": 0
                        },
                        "parentUid": "115ea465-c2a5-4c2f-b994-e620b35b1f24",
                        "type": "SYSTEM_NODE",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "uid": "1a4a2572-b2e9-4e6b-9024-792f37951223",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "f8660599-635d-4970-b767-018182d97a95": {
                        "center": {
                            "x": -75,
                            "y": 0
                        },
                        "parentUid": "115ea465-c2a5-4c2f-b994-e620b35b1f24",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "uid": "f8660599-635d-4970-b767-018182d97a95",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "c011670e-58d9-4f70-8c51-0d9913bc8510": {
                        "center": {
                            "x": -75,
                            "y": 100
                        },
                        "parentUid": "115ea465-c2a5-4c2f-b994-e620b35b1f24",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "uid": "c011670e-58d9-4f70-8c51-0d9913bc8510",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "011f6a2d-8a7b-4eef-bfab-f88d0fea3200": {
                        "center": {
                            "x": 75,
                            "y": 100
                        },
                        "parentUid": "115ea465-c2a5-4c2f-b994-e620b35b1f24",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "011f6a2d-8a7b-4eef-bfab-f88d0fea3200",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "212f1abb-a4f6-4c10-b43a-5c5d16c4918a": {
                        "center": {
                            "x": 508.1922541312779,
                            "y": -6413.33042894346
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "212f1abb-a4f6-4c10-b43a-5c5d16c4918a"
                    },
                    "627c5c28-aebb-44af-bacc-93ebf4f97b4a": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "212f1abb-a4f6-4c10-b43a-5c5d16c4918a",
                            "f9e70a31-4312-4147-9396-3b0d5dae570b"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "627c5c28-aebb-44af-bacc-93ebf4f97b4a"
                    },
                    "14c49950-87cb-4f3d-b030-ab5886978be8": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "212f1abb-a4f6-4c10-b43a-5c5d16c4918a",
                            "2c1a4c3e-4ee1-4797-8743-a36c5f93c4dc"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "14c49950-87cb-4f3d-b030-ab5886978be8"
                    },
                    "1add8f24-28e9-4dd5-8976-22a31e8c7fd4": {
                        "center": {
                            "x": 658.1922541312779,
                            "y": -6767.976484165987
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "hot-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "1add8f24-28e9-4dd5-8976-22a31e8c7fd4"
                    },
                    "93a2a70e-bbb8-4ace-a108-0ba023b3fa03": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "1add8f24-28e9-4dd5-8976-22a31e8c7fd4",
                            "0970f36f-37f7-4d85-a170-f2793d973220"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "93a2a70e-bbb8-4ace-a108-0ba023b3fa03"
                    },
                    "134dba28-aead-4155-b22f-bcd923caaf01": {
                        "center": {
                            "x": 847.0100726074852,
                            "y": -7467.8268622248
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "134dba28-aead-4155-b22f-bcd923caaf01"
                    },
                    "09747444-adc5-43e9-92b9-3189f6c162b9": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "011f6a2d-8a7b-4eef-bfab-f88d0fea3200",
                            "134dba28-aead-4155-b22f-bcd923caaf01"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "09747444-adc5-43e9-92b9-3189f6c162b9"
                    },
                    "2c231c4a-47ba-49ec-9c75-8c5acf5d0d3f": {
                        "center": {
                            "x": 5031.825115898126,
                            "y": -7467.8268622248
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "2c231c4a-47ba-49ec-9c75-8c5acf5d0d3f"
                    },
                    "3aa6fbb0-047e-4549-ae72-80d04ddf2140": {
                        "center": {
                            "x": 5031.825115898126,
                            "y": -10875.742879091022
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "3aa6fbb0-047e-4549-ae72-80d04ddf2140"
                    },
                    "ac11ec5b-e372-4013-be18-0284f8bbdd86": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "2c231c4a-47ba-49ec-9c75-8c5acf5d0d3f",
                            "3aa6fbb0-047e-4549-ae72-80d04ddf2140"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "ac11ec5b-e372-4013-be18-0284f8bbdd86"
                    },
                    "00597d49-e54e-4cfd-88cb-e1101ab84a5a": {
                        "center": {
                            "x": 1632.6536083952742,
                            "y": -10875.742879091022
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "00597d49-e54e-4cfd-88cb-e1101ab84a5a"
                    },
                    "9a865e0f-a41c-49d4-b070-95e322ed2d32": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "00597d49-e54e-4cfd-88cb-e1101ab84a5a",
                            "63bf0478-382f-4452-89b4-e48a1b084aeb"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "9a865e0f-a41c-49d4-b070-95e322ed2d32"
                    },
                    "255dd2b3-1bd1-466d-9606-da9e21682919": {
                        "center": {
                            "x": 2727.590034963847,
                            "y": -10875.742879091022
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "255dd2b3-1bd1-466d-9606-da9e21682919"
                    },
                    "331c3b5a-429b-4ff2-8895-f69e3386d52c": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "255dd2b3-1bd1-466d-9606-da9e21682919",
                            "00597d49-e54e-4cfd-88cb-e1101ab84a5a"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "331c3b5a-429b-4ff2-8895-f69e3386d52c"
                    },
                    "2692ede2-caf8-49f3-b1d3-21044a3665b4": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "255dd2b3-1bd1-466d-9606-da9e21682919",
                            "cb5362a0-93b2-461d-ad88-d5fe881b40f6"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "2692ede2-caf8-49f3-b1d3-21044a3665b4"
                    },
                    "ec497a01-b28e-4250-b71d-d7e75866e30a": {
                        "center": {
                            "x": 3638.422106417842,
                            "y": -10875.742879091022
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "ec497a01-b28e-4250-b71d-d7e75866e30a"
                    },
                    "0282db5d-7fe4-4346-8cc6-ae442bed25f2": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "ec497a01-b28e-4250-b71d-d7e75866e30a",
                            "255dd2b3-1bd1-466d-9606-da9e21682919"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "0282db5d-7fe4-4346-8cc6-ae442bed25f2"
                    },
                    "6ff16f08-0c91-4eb3-8420-52023077f486": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "ec497a01-b28e-4250-b71d-d7e75866e30a",
                            "ca1e977c-3058-40e0-8bad-bf5d2d7f525d"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "6ff16f08-0c91-4eb3-8420-52023077f486"
                    },
                    "72401ade-3746-41f4-99e3-33328f6593ee": {
                        "center": {
                            "x": 4554.5297971902255,
                            "y": -10875.742879091022
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "72401ade-3746-41f4-99e3-33328f6593ee"
                    },
                    "eba8b4d3-f4ff-4d05-be54-018ef7ddf399": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "72401ade-3746-41f4-99e3-33328f6593ee",
                            "ec497a01-b28e-4250-b71d-d7e75866e30a"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "eba8b4d3-f4ff-4d05-be54-018ef7ddf399"
                    },
                    "5afb198e-ff45-4f38-beaf-46b355f38f0f": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "72401ade-3746-41f4-99e3-33328f6593ee",
                            "3aa6fbb0-047e-4549-ae72-80d04ddf2140"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "5afb198e-ff45-4f38-beaf-46b355f38f0f"
                    },
                    "f2332b05-452d-427b-8097-e3064673588b": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "72401ade-3746-41f4-99e3-33328f6593ee",
                            "40a26730-d139-464c-9f38-a131198d45bb"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "f2332b05-452d-427b-8097-e3064673588b"
                    },
                    "085c8a13-a903-4b1c-bdb2-9d674760a01e": {
                        "center": {
                            "x": 1519.3793721216462,
                            "y": -7467.8268622248
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "085c8a13-a903-4b1c-bdb2-9d674760a01e"
                    },
                    "dbb36114-cc24-493e-937b-afb7a161199f": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "085c8a13-a903-4b1c-bdb2-9d674760a01e",
                            "134dba28-aead-4155-b22f-bcd923caaf01"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "dbb36114-cc24-493e-937b-afb7a161199f"
                    },
                    "69fc92bd-8145-4ce8-ae54-e9a659a21f69": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "085c8a13-a903-4b1c-bdb2-9d674760a01e",
                            "f0c2fa12-057b-4e67-8a61-dc93be1ef783"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "69fc92bd-8145-4ce8-ae54-e9a659a21f69"
                    },
                    "0b010ce9-c661-4f58-9be1-2794200e98f9": {
                        "center": {
                            "x": 2498.6708417960544,
                            "y": -7467.8268622248
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "0b010ce9-c661-4f58-9be1-2794200e98f9"
                    },
                    "9ca462cd-a4fc-43cd-8d07-e19acd99c64b": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "0b010ce9-c661-4f58-9be1-2794200e98f9",
                            "085c8a13-a903-4b1c-bdb2-9d674760a01e"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "9ca462cd-a4fc-43cd-8d07-e19acd99c64b"
                    },
                    "79bc6cb7-fb79-421d-9fd1-2eb7107bdcf3": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "0b010ce9-c661-4f58-9be1-2794200e98f9",
                            "c9f8f59e-553a-4cb4-a566-528bc8c6b1c6"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "79bc6cb7-fb79-421d-9fd1-2eb7107bdcf3"
                    },
                    "90a33554-7014-4a06-ae79-99cc54662d0f": {
                        "center": {
                            "x": 3476.1661375581352,
                            "y": -7467.8268622248
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "90a33554-7014-4a06-ae79-99cc54662d0f"
                    },
                    "9f4c6aa4-bee0-4d90-9f30-e173157157e0": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "90a33554-7014-4a06-ae79-99cc54662d0f",
                            "0b010ce9-c661-4f58-9be1-2794200e98f9"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "9f4c6aa4-bee0-4d90-9f30-e173157157e0"
                    },
                    "f2a7f764-fc6c-45f3-bea0-5fb4654b48fe": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "90a33554-7014-4a06-ae79-99cc54662d0f",
                            "834a601f-64ce-4b9d-9080-71c68858b706"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "f2a7f764-fc6c-45f3-bea0-5fb4654b48fe"
                    },
                    "0dae8258-b6c0-47c0-bed1-e76424d25d73": {
                        "center": {
                            "x": 4437.442457850611,
                            "y": -7467.8268622248
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "0dae8258-b6c0-47c0-bed1-e76424d25d73"
                    },
                    "31d7d662-8bd9-4e4f-92c4-ab20126aad2c": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "0dae8258-b6c0-47c0-bed1-e76424d25d73",
                            "90a33554-7014-4a06-ae79-99cc54662d0f"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "31d7d662-8bd9-4e4f-92c4-ab20126aad2c"
                    },
                    "e937dac1-e26c-486b-a77f-bd7847675080": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "0dae8258-b6c0-47c0-bed1-e76424d25d73",
                            "2c231c4a-47ba-49ec-9c75-8c5acf5d0d3f"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "e937dac1-e26c-486b-a77f-bd7847675080"
                    },
                    "c5955f66-dc50-4788-8f19-f4aea5b0c8f4": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "0dae8258-b6c0-47c0-bed1-e76424d25d73",
                            "f17aae19-cbd9-4da2-89a6-32f33b1a2945"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "c5955f66-dc50-4788-8f19-f4aea5b0c8f4"
                    },
                    "dcf69b4d-2b24-4503-8e1d-3d859cc3acf3": {
                        "center": {
                            "x": 811.4956374994108,
                            "y": -7412.621360713772
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "dcf69b4d-2b24-4503-8e1d-3d859cc3acf3"
                    },
                    "166cb028-2079-4e58-8ee7-ef96d7574b5b": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "c011670e-58d9-4f70-8c51-0d9913bc8510",
                            "dcf69b4d-2b24-4503-8e1d-3d859cc3acf3"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "166cb028-2079-4e58-8ee7-ef96d7574b5b"
                    },
                    "ac1a7d2d-7d39-4035-bb93-b7c5eff68829": {
                        "center": {
                            "x": 5080.223841177627,
                            "y": -7412.621360713772
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "ac1a7d2d-7d39-4035-bb93-b7c5eff68829"
                    },
                    "dbca6c7e-2cc0-4e1c-a308-6e9bcefcd35a": {
                        "center": {
                            "x": 5080.223841177627,
                            "y": -10931.159357529337
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "dbca6c7e-2cc0-4e1c-a308-6e9bcefcd35a"
                    },
                    "c6d2999d-b180-40a3-8524-fa371c5381e7": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "ac1a7d2d-7d39-4035-bb93-b7c5eff68829",
                            "dbca6c7e-2cc0-4e1c-a308-6e9bcefcd35a"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "c6d2999d-b180-40a3-8524-fa371c5381e7"
                    },
                    "92c1f143-2b99-49e5-ac3f-3338a6c3fb96": {
                        "center": {
                            "x": 2523.9829454864957,
                            "y": -10931.159357529337
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "92c1f143-2b99-49e5-ac3f-3338a6c3fb96"
                    },
                    "c710ee6a-2a33-47c8-9b33-8d4f55dd14b3": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "dbca6c7e-2cc0-4e1c-a308-6e9bcefcd35a",
                            "92c1f143-2b99-49e5-ac3f-3338a6c3fb96"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "c710ee6a-2a33-47c8-9b33-8d4f55dd14b3"
                    },
                    "52cd4e6a-39d4-4dd8-8861-e59b3d59764c": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "92c1f143-2b99-49e5-ac3f-3338a6c3fb96",
                            "fb24da9c-72de-4081-801d-9cde682e47cc"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "52cd4e6a-39d4-4dd8-8861-e59b3d59764c"
                    },
                    "47ed2f13-757c-4583-b431-00c7f7546d57": {
                        "center": {
                            "x": 508.1922541312779,
                            "y": -7046.370248320318
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "d3e35d00-8e6d-45ca-913a-05229d842ce7",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "47ed2f13-757c-4583-b431-00c7f7546d57",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "d3e35d00-8e6d-45ca-913a-05229d842ce7": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "47ed2f13-757c-4583-b431-00c7f7546d57",
                            "212f1abb-a4f6-4c10-b43a-5c5d16c4918a"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "d3e35d00-8e6d-45ca-913a-05229d842ce7"
                    },
                    "903e5aca-6760-4490-bcaa-0d5f498fc0e0": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "47ed2f13-757c-4583-b431-00c7f7546d57",
                            "1a4a2572-b2e9-4e6b-9024-792f37951223"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "903e5aca-6760-4490-bcaa-0d5f498fc0e0"
                    },
                    "a4604ecc-fbf5-4f7d-b915-bf55b56a9e51": {
                        "center": {
                            "x": 658.1922541312779,
                            "y": -7046.370248320318
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "1c5511e8-c716-47d6-acec-3d818d7d9845",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "a4604ecc-fbf5-4f7d-b915-bf55b56a9e51",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "1c5511e8-c716-47d6-acec-3d818d7d9845": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "a4604ecc-fbf5-4f7d-b915-bf55b56a9e51",
                            "1add8f24-28e9-4dd5-8976-22a31e8c7fd4"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "1c5511e8-c716-47d6-acec-3d818d7d9845"
                    },
                    "393afcb5-5da2-4d3c-a72d-64f178919da3": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "a4604ecc-fbf5-4f7d-b915-bf55b56a9e51",
                            "f8660599-635d-4970-b767-018182d97a95"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "393afcb5-5da2-4d3c-a72d-64f178919da3"
                    },
                    "90b33585-43ef-4bb1-96bf-c031ed5fa76b": {
                        "abbreviation": "KS",
                        "center": {
                            "x": 13661.655472632629,
                            "y": -10837.916530763707
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "FIXTURE",
                        "uid": "90b33585-43ef-4bb1-96bf-c031ed5fa76b",
                        "fixtureUnits": null,
                        "name": "kitchenSinkHot",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "hot-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "hot-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "e35b5e84-27e2-48e8-8517-2da155d8b2d0"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "dcbe3bbd-4821-4adf-ace1-de221df6c9f1"
                            }
                        }
                    },
                    "e35b5e84-27e2-48e8-8517-2da155d8b2d0": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "90b33585-43ef-4bb1-96bf-c031ed5fa76b",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "hot-water",
                        "uid": "e35b5e84-27e2-48e8-8517-2da155d8b2d0",
                        "configuration": 0
                    },
                    "dcbe3bbd-4821-4adf-ace1-de221df6c9f1": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "90b33585-43ef-4bb1-96bf-c031ed5fa76b",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "dcbe3bbd-4821-4adf-ace1-de221df6c9f1",
                        "configuration": 0
                    },
                    "bc237f14-bc88-4065-b987-6cad571683f1": {
                        "center": {
                            "x": 13561.655472632629,
                            "y": -6767.976484165987
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "hot-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "bc237f14-bc88-4065-b987-6cad571683f1"
                    },
                    "ac0e6a14-46d0-4138-a886-314cbb122864": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "bc237f14-bc88-4065-b987-6cad571683f1",
                            "1add8f24-28e9-4dd5-8976-22a31e8c7fd4"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ac0e6a14-46d0-4138-a886-314cbb122864"
                    },
                    "896c9ffa-de90-4e22-9af1-6b9125c469f3": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.7906976744186,
                                "s": 0.8514851485148515,
                                "l": 0.396078431372549,
                                "a": 0.45098039215686275
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45098039215686275
                            },
                            "hsv": {
                                "h": 272.7906976744186,
                                "s": 0.9197860962566845,
                                "v": 0.7333333333333333,
                                "a": 0.45098039215686275
                            },
                            "oldHue": 272.7906976744186,
                            "source": "hex",
                            "a": 0.45098039215686275
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "bc237f14-bc88-4065-b987-6cad571683f1",
                            "ba4dfe8a-c9c4-45f3-b877-ec821d02df0d"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "896c9ffa-de90-4e22-9af1-6b9125c469f3"
                    },
                    "dadb6bd8-139a-4703-ab4c-9902d5962433": {
                        "center": {
                            "x": 13761.655472632629,
                            "y": -7085.600926611849
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "9134b038-e169-4d0f-ad44-848cbf5e240a",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "dadb6bd8-139a-4703-ab4c-9902d5962433",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "9134b038-e169-4d0f-ad44-848cbf5e240a": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "dadb6bd8-139a-4703-ab4c-9902d5962433",
                            "dcbe3bbd-4821-4adf-ace1-de221df6c9f1"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "9134b038-e169-4d0f-ad44-848cbf5e240a"
                    },
                    "2f513a20-49ca-45e6-a772-d5984ca54cdc": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "dadb6bd8-139a-4703-ab4c-9902d5962433",
                            "2c1a4c3e-4ee1-4797-8743-a36c5f93c4dc"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "2f513a20-49ca-45e6-a772-d5984ca54cdc"
                    },
                    "4e2b47cf-8321-422b-ba74-f68a75500843": {
                        "center": {
                            "x": 13561.655472632629,
                            "y": -7085.600926611849
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "79fdf5cb-fe9a-4912-b12b-c4b903157168",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "4e2b47cf-8321-422b-ba74-f68a75500843",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "79fdf5cb-fe9a-4912-b12b-c4b903157168": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "4e2b47cf-8321-422b-ba74-f68a75500843",
                            "e35b5e84-27e2-48e8-8517-2da155d8b2d0"
                        ],
                        "heightAboveFloorM": 2.6,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "79fdf5cb-fe9a-4912-b12b-c4b903157168"
                    },
                    "00e36d57-d02b-47a2-bb4c-20c390996961": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "4e2b47cf-8321-422b-ba74-f68a75500843",
                            "bc237f14-bc88-4065-b987-6cad571683f1"
                        ],
                        "heightAboveFloorM": 2.6,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "00e36d57-d02b-47a2-bb4c-20c390996961"
                    },
                    "35f3e777-c687-4c4d-8a09-6cb4e6ec66df": {
                        "abbreviation": "",
                        "center": {
                            "x": 10557.217211100178,
                            "y": -10753.628020903392
                        },
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "GAS_APPLIANCE",
                        "uid": "35f3e777-c687-4c4d-8a09-6cb4e6ec66df",
                        "name": "Enter Name",
                        "outletAboveFloorM": 0.7,
                        "rotation": 0,
                        "inletUid": "7ed19aa4-6d4a-4d5d-b446-b99dab105fb3",
                        "inletPressureKPA": 2.75,
                        "widthMM": 500,
                        "heightMM": 500,
                        "flowRateMJH": 80
                    },
                    "7ed19aa4-6d4a-4d5d-b446-b99dab105fb3": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "35f3e777-c687-4c4d-8a09-6cb4e6ec66df",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "gas",
                        "uid": "7ed19aa4-6d4a-4d5d-b446-b99dab105fb3",
                        "configuration": 0
                    },
                    "61147ba9-764b-4657-9060-78810ccbf4b9": {
                        "center": {
                            "x": -11371.07106039288,
                            "y": -5682.604932482473
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "61147ba9-764b-4657-9060-78810ccbf4b9"
                    },
                    "253b3096-f04c-45d0-840e-71c1c37ee2b7": {
                        "center": {
                            "x": 10557.217211100178,
                            "y": -5682.604932482473
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "gas",
                        "type": "FITTING",
                        "uid": "253b3096-f04c-45d0-840e-71c1c37ee2b7"
                    },
                    "ef3059d2-c7e2-414b-8195-fbaedee768a3": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "61147ba9-764b-4657-9060-78810ccbf4b9",
                            "253b3096-f04c-45d0-840e-71c1c37ee2b7"
                        ],
                        "heightAboveFloorM": 2.6999999999999975,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ef3059d2-c7e2-414b-8195-fbaedee768a3"
                    },
                    "034f6a6e-5056-485e-a2ff-5ddbc86307e7": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "253b3096-f04c-45d0-840e-71c1c37ee2b7",
                            "7ed19aa4-6d4a-4d5d-b446-b99dab105fb3"
                        ],
                        "heightAboveFloorM": 2.6999999999999975,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "034f6a6e-5056-485e-a2ff-5ddbc86307e7"
                    },
                    "1e657f8e-4da3-4f6a-9c51-95103ef2d3d7": {
                        "center": {
                            "x": -11371.07106039288,
                            "y": -9214.928180084176
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "sourceUid": "00c1fc86-a63b-405b-aa75-6dc77134c233",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "1e657f8e-4da3-4f6a-9c51-95103ef2d3d7",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "00c1fc86-a63b-405b-aa75-6dc77134c233": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "1e657f8e-4da3-4f6a-9c51-95103ef2d3d7",
                            "bd0f4202-1611-4480-b368-bd7564c74e41"
                        ],
                        "heightAboveFloorM": 2.6999999999999975,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "00c1fc86-a63b-405b-aa75-6dc77134c233"
                    },
                    "22eec533-43a6-4ea0-95e3-26ef8b3370fe": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "1e657f8e-4da3-4f6a-9c51-95103ef2d3d7",
                            "61147ba9-764b-4657-9060-78810ccbf4b9"
                        ],
                        "heightAboveFloorM": 2.6999999999999975,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "gas",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "22eec533-43a6-4ea0-95e3-26ef8b3370fe"
                    },
                    "2bf89f70-27c9-4351-af7b-e8a8a48b4953": {
                        "center": {
                            "x": 1718.5263904015483,
                            "y": -7412.621360713772
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "2bf89f70-27c9-4351-af7b-e8a8a48b4953"
                    },
                    "32aa24aa-2e00-4df4-8cb2-8b96c8472f35": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "2bf89f70-27c9-4351-af7b-e8a8a48b4953",
                            "dcf69b4d-2b24-4503-8e1d-3d859cc3acf3"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "32aa24aa-2e00-4df4-8cb2-8b96c8472f35"
                    },
                    "b1c0c41b-0c8a-4d93-b2d5-7e058494468f": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "2bf89f70-27c9-4351-af7b-e8a8a48b4953",
                            "a70ce7b1-b32c-40e4-9b98-a61253b7ccc8"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "b1c0c41b-0c8a-4d93-b2d5-7e058494468f"
                    },
                    "14ac630c-807a-4d9d-9a63-c3eab67eb41f": {
                        "center": {
                            "x": 2706.1025667423237,
                            "y": -7412.621360713772
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "14ac630c-807a-4d9d-9a63-c3eab67eb41f"
                    },
                    "836c5207-78e7-4258-a47b-dbd4ff5f1b23": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "14ac630c-807a-4d9d-9a63-c3eab67eb41f",
                            "2bf89f70-27c9-4351-af7b-e8a8a48b4953"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "836c5207-78e7-4258-a47b-dbd4ff5f1b23"
                    },
                    "2b308343-5268-4cb8-bfd2-c23d9e3afa96": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "14ac630c-807a-4d9d-9a63-c3eab67eb41f",
                            "7f84f89c-a5e6-4829-839b-73233475b8bf"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "2b308343-5268-4cb8-bfd2-c23d9e3afa96"
                    },
                    "4061e185-80d9-450a-878d-e65e99f9dfa9": {
                        "center": {
                            "x": 3682.228584516837,
                            "y": -7412.621360713772
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "4061e185-80d9-450a-878d-e65e99f9dfa9"
                    },
                    "9378f75d-b13f-481f-98d0-22f2f10f4505": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "4061e185-80d9-450a-878d-e65e99f9dfa9",
                            "14ac630c-807a-4d9d-9a63-c3eab67eb41f"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "9378f75d-b13f-481f-98d0-22f2f10f4505"
                    },
                    "af9d36d7-94eb-404b-804c-b5534cd9fa8b": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "4061e185-80d9-450a-878d-e65e99f9dfa9",
                            "e66f6c38-19bf-43dd-a2a9-f64f66f1a1e6"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "af9d36d7-94eb-404b-804c-b5534cd9fa8b"
                    },
                    "70dd8ef9-23db-4a0c-a2c9-ae74e4bdde41": {
                        "center": {
                            "x": 4644.839832984424,
                            "y": -7412.621360713772
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "70dd8ef9-23db-4a0c-a2c9-ae74e4bdde41"
                    },
                    "868bd0ce-c56c-440f-b3b8-283ee9226a01": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "70dd8ef9-23db-4a0c-a2c9-ae74e4bdde41",
                            "4061e185-80d9-450a-878d-e65e99f9dfa9"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "868bd0ce-c56c-440f-b3b8-283ee9226a01"
                    },
                    "4d1df30f-2355-4c30-b321-4ec36d09a55e": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "70dd8ef9-23db-4a0c-a2c9-ae74e4bdde41",
                            "ac1a7d2d-7d39-4035-bb93-b7c5eff68829"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "4d1df30f-2355-4c30-b321-4ec36d09a55e"
                    },
                    "1ab78a48-0fa3-42c0-a7cb-746f4b4def18": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "70dd8ef9-23db-4a0c-a2c9-ae74e4bdde41",
                            "89880949-3d8a-4419-bd83-2cb052786f12"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "1ab78a48-0fa3-42c0-a7cb-746f4b4def18"
                    },
                    "c9cb6a8c-fc04-4b2e-87f8-9671bfa392a2": {
                        "center": {
                            "x": -26725.651217902276,
                            "y": -18274.931431250872
                        },
                        "color": null,
                        "calculationHeightM": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FLOW_SOURCE",
                        "heightAboveGroundM": 14,
                        "minPressureKPA": 400,
                        "maxPressureKPA": 600,
                        "uid": "c9cb6a8c-fc04-4b2e-87f8-9671bfa392a2"
                    },
                    "1855d963-5b19-4122-ac07-6cfeaa49ed7e": {
                        "center": {
                            "x": -26725.651217902276,
                            "y": -13472.991632436255
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "1855d963-5b19-4122-ac07-6cfeaa49ed7e"
                    },
                    "ca640aed-ec46-4e52-83a6-14b2c8f2776a": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "c9cb6a8c-fc04-4b2e-87f8-9671bfa392a2",
                            "1855d963-5b19-4122-ac07-6cfeaa49ed7e"
                        ],
                        "heightAboveFloorM": -1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ca640aed-ec46-4e52-83a6-14b2c8f2776a"
                    },
                    "13e0fab4-005e-4605-9730-d46455b99447": {
                        "center": {
                            "x": -24035.38077434142,
                            "y": -13472.991632436255
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "13e0fab4-005e-4605-9730-d46455b99447"
                    },
                    "06438907-4824-4fde-9d9b-08342c32372c": {
                        "center": {
                            "x": -24035.38077434142,
                            "y": -10953.164597947887
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "06438907-4824-4fde-9d9b-08342c32372c"
                    },
                    "fe3707d2-1673-457c-a576-a51403721299": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "13e0fab4-005e-4605-9730-d46455b99447",
                            "b3d9041c-721a-4b23-90d1-fdd9d5ddae9b"
                        ],
                        "heightAboveFloorM": -1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "fe3707d2-1673-457c-a576-a51403721299"
                    },
                    "1c44c5bb-4124-42e9-87a2-5d64cc16bde2": {
                        "center": {
                            "x": -24035.38077434142,
                            "y": 1430.2359861331674
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "1c44c5bb-4124-42e9-87a2-5d64cc16bde2"
                    },
                    "29711703-feac-4795-a4de-9e52f3102684": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "06438907-4824-4fde-9d9b-08342c32372c",
                            "1c44c5bb-4124-42e9-87a2-5d64cc16bde2"
                        ],
                        "heightAboveFloorM": 2.7999999999999985,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "29711703-feac-4795-a4de-9e52f3102684"
                    },
                    "9e94e5db-83ce-41da-87e9-7765080c9a6d": {
                        "center": {
                            "x": 3766.1551112760353,
                            "y": 1430.2359861331674
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "9e94e5db-83ce-41da-87e9-7765080c9a6d"
                    },
                    "cd29bc53-be72-42c3-9388-fba219f0545c": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "1c44c5bb-4124-42e9-87a2-5d64cc16bde2",
                            "9e94e5db-83ce-41da-87e9-7765080c9a6d"
                        ],
                        "heightAboveFloorM": 2.7999999999999985,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "cd29bc53-be72-42c3-9388-fba219f0545c"
                    },
                    "ddfc6f84-d2b7-4fcb-a954-d250b97c7ca4": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "9e94e5db-83ce-41da-87e9-7765080c9a6d",
                            "ff868cde-03df-486e-8f7b-6779378386aa"
                        ],
                        "heightAboveFloorM": 2.7999999999999985,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ddfc6f84-d2b7-4fcb-a954-d250b97c7ca4"
                    },
                    "37c0d877-7459-4950-b207-7fb4fdd261b0": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "06438907-4824-4fde-9d9b-08342c32372c",
                            "b3d9041c-721a-4b23-90d1-fdd9d5ddae9b"
                        ],
                        "heightAboveFloorM": -1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "network": "RETICULATIONS",
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "PIPE",
                        "uid": "37c0d877-7459-4950-b207-7fb4fdd261b0"
                    },
                    "b3d9041c-721a-4b23-90d1-fdd9d5ddae9b": {
                        "center": {
                            "x": -24035.38077434142,
                            "y": -10953.164597947887
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "b3d9041c-721a-4b23-90d1-fdd9d5ddae9b"
                    },
                    "aa79a0c4-39c3-4e63-8a97-6ca6c4f5e70e": {
                        "heightAboveFloorM": 1,
                        "heightMM": 500,
                        "widthMM": 1200,
                        "inletSystemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "inletUid": "1ef30858-4e4a-42d2-98e0-07e4e2fac089",
                        "outletSystemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "outletTemperatureC": null,
                        "outletUid": "f75de7db-723a-4e6c-8e63-8ebe6566551f",
                        "center": {
                            "x": -25372.794654388537,
                            "y": -13472.80807779579
                        },
                        "rightToLeft": false,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "type": "PLANT",
                        "uid": "aa79a0c4-39c3-4e63-8a97-6ca6c4f5e70e",
                        "name": "Booster",
                        "rotation": 0,
                        "plant": {
                            "type": "CUSTOM",
                            "pressureLoss": {
                                "pressureMethod": "FIXED_PRESSURE_LOSS",
                                "pressureLossKPA": 90,
                                "staticPressureKPA": null,
                                "pumpPressureKPA": null
                            }
                        }
                    },
                    "1ef30858-4e4a-42d2-98e0-07e4e2fac089": {
                        "center": {
                            "x": -600,
                            "y": 0
                        },
                        "parentUid": "aa79a0c4-39c3-4e63-8a97-6ca6c4f5e70e",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "uid": "1ef30858-4e4a-42d2-98e0-07e4e2fac089",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "f75de7db-723a-4e6c-8e63-8ebe6566551f": {
                        "center": {
                            "x": 600,
                            "y": 0
                        },
                        "parentUid": "aa79a0c4-39c3-4e63-8a97-6ca6c4f5e70e",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "uid": "f75de7db-723a-4e6c-8e63-8ebe6566551f",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "a7b03604-8f70-492c-a92a-f15c359ebf1c": {
                        "center": {
                            "x": -26182.976409231404,
                            "y": -13472.991632436255
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "a7b03604-8f70-492c-a92a-f15c359ebf1c"
                    },
                    "20e12e5c-3629-43fd-95ae-da066b9dd992": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "1855d963-5b19-4122-ac07-6cfeaa49ed7e",
                            "a7b03604-8f70-492c-a92a-f15c359ebf1c"
                        ],
                        "heightAboveFloorM": -1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "20e12e5c-3629-43fd-95ae-da066b9dd992"
                    },
                    "1127c7c0-0729-4320-b8c2-8ef8fe55e881": {
                        "center": {
                            "x": -24539.933600610057,
                            "y": -13472.991632436255
                        },
                        "color": null,
                        "parentUid": "883c8bcd-a994-4c3e-82ec-748f683e2cba",
                        "calculationHeightM": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "type": "FITTING",
                        "uid": "1127c7c0-0729-4320-b8c2-8ef8fe55e881"
                    },
                    "f075449c-c0db-4ade-9f2d-60b9bc99316b": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "1127c7c0-0729-4320-b8c2-8ef8fe55e881",
                            "13e0fab4-005e-4605-9730-d46455b99447"
                        ],
                        "heightAboveFloorM": -1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "f075449c-c0db-4ade-9f2d-60b9bc99316b"
                    },
                    "2a22eb4b-f392-49d3-b34f-9ae139aa5ee7": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "f75de7db-723a-4e6c-8e63-8ebe6566551f",
                            "1127c7c0-0729-4320-b8c2-8ef8fe55e881"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "2a22eb4b-f392-49d3-b34f-9ae139aa5ee7"
                    },
                    "ffb087ff-4fb6-4215-809c-927313b0dec1": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "1ef30858-4e4a-42d2-98e0-07e4e2fac089",
                            "a7b03604-8f70-492c-a92a-f15c359ebf1c"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ffb087ff-4fb6-4215-809c-927313b0dec1"
                    }
                },
                "floorHeightM": 15
            },
            "4f2fa256-73a7-41b5-b584-14a40c36b7f0": {
                "abbreviation": "L1",
                "entities": {
                    "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f": {
                        "parentUid": null,
                        "type": "BACKGROUND_IMAGE",
                        "filename": "Level 01 [02].pdf",
                        "center": {
                            "x": 21813.216694899533,
                            "y": -1250.7796751385595
                        },
                        "crop": {
                            "x": -33545.97568535645,
                            "y": -19441.221229677452,
                            "w": 55622.30779835827,
                            "h": 31514.46682047974
                        },
                        "offset": {
                            "x": 0,
                            "y": 0
                        },
                        "page": 1,
                        "paperSize": {
                            "name": "Not detected",
                            "widthMM": 840.9121140142518,
                            "heightMM": 594
                        },
                        "pointA": null,
                        "pointB": null,
                        "rotation": 0,
                        "scaleFactor": 1,
                        "scaleName": "1:100",
                        "uid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "totalPages": 1,
                        "key": "32468c33-ac3e-40cd-b369-c269559aa747.png"
                    },
                    "5db47840-86be-4747-aed3-79922d92b2c9": {
                        "abbreviation": "B",
                        "center": {
                            "x": 2536.0380190552387,
                            "y": -7583.024810570847
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "5db47840-86be-4747-aed3-79922d92b2c9",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "88af38a7-bfe6-4549-9e28-bee8341b7ee4"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "90d85f69-eab9-4d8e-ad4e-46a4180a32a6"
                            }
                        }
                    },
                    "88af38a7-bfe6-4549-9e28-bee8341b7ee4": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "5db47840-86be-4747-aed3-79922d92b2c9",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "88af38a7-bfe6-4549-9e28-bee8341b7ee4",
                        "configuration": 0
                    },
                    "90d85f69-eab9-4d8e-ad4e-46a4180a32a6": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "5db47840-86be-4747-aed3-79922d92b2c9",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "90d85f69-eab9-4d8e-ad4e-46a4180a32a6",
                        "configuration": 0
                    },
                    "1fbdf457-5d20-4bec-bf06-f4ed6f91e7d2": {
                        "abbreviation": "B",
                        "center": {
                            "x": 3516.162145484617,
                            "y": -7583.024810570847
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "1fbdf457-5d20-4bec-bf06-f4ed6f91e7d2",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "ca77bab0-7f69-4e97-a30c-951b3d852c62"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "46ed556d-984f-4e8f-904f-d61a8abfac29"
                            }
                        }
                    },
                    "ca77bab0-7f69-4e97-a30c-951b3d852c62": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "1fbdf457-5d20-4bec-bf06-f4ed6f91e7d2",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "ca77bab0-7f69-4e97-a30c-951b3d852c62",
                        "configuration": 0
                    },
                    "46ed556d-984f-4e8f-904f-d61a8abfac29": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "1fbdf457-5d20-4bec-bf06-f4ed6f91e7d2",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "46ed556d-984f-4e8f-904f-d61a8abfac29",
                        "configuration": 0
                    },
                    "7169286b-c5b9-4582-b389-fe04b5fd6bf8": {
                        "abbreviation": "B",
                        "center": {
                            "x": 4487.574057456848,
                            "y": -7583.024810570847
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "7169286b-c5b9-4582-b389-fe04b5fd6bf8",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "67bbb11b-b24a-48e2-8df9-7df8a9b6c54c"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "71ee6ada-6634-404f-8ce1-74d041d02a52"
                            }
                        }
                    },
                    "67bbb11b-b24a-48e2-8df9-7df8a9b6c54c": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "7169286b-c5b9-4582-b389-fe04b5fd6bf8",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "67bbb11b-b24a-48e2-8df9-7df8a9b6c54c",
                        "configuration": 0
                    },
                    "71ee6ada-6634-404f-8ce1-74d041d02a52": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "7169286b-c5b9-4582-b389-fe04b5fd6bf8",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "71ee6ada-6634-404f-8ce1-74d041d02a52",
                        "configuration": 0
                    },
                    "1ab76fe0-36ba-4640-bdb6-dc63fec5aab7": {
                        "abbreviation": "B",
                        "center": {
                            "x": 5576.600864600601,
                            "y": -7583.024810570847
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "1ab76fe0-36ba-4640-bdb6-dc63fec5aab7",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "53a93f60-5b0a-43bc-b6df-fffe4a057e25"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "f92c69d7-ec16-42cc-97e9-10042f853c1a"
                            }
                        }
                    },
                    "53a93f60-5b0a-43bc-b6df-fffe4a057e25": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "1ab76fe0-36ba-4640-bdb6-dc63fec5aab7",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "53a93f60-5b0a-43bc-b6df-fffe4a057e25",
                        "configuration": 0
                    },
                    "f92c69d7-ec16-42cc-97e9-10042f853c1a": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "1ab76fe0-36ba-4640-bdb6-dc63fec5aab7",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "f92c69d7-ec16-42cc-97e9-10042f853c1a",
                        "configuration": 0
                    },
                    "41fe4a9f-ece8-48ec-b385-88c25b1da037": {
                        "abbreviation": "B",
                        "center": {
                            "x": 6552.368883801406,
                            "y": -7583.024810570847
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "41fe4a9f-ece8-48ec-b385-88c25b1da037",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "ad70a616-36d4-41d5-9209-c54fcbfce92a"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "ca4b4108-d375-42fd-a954-75b42b1e638f"
                            }
                        }
                    },
                    "ad70a616-36d4-41d5-9209-c54fcbfce92a": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "41fe4a9f-ece8-48ec-b385-88c25b1da037",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "ad70a616-36d4-41d5-9209-c54fcbfce92a",
                        "configuration": 0
                    },
                    "ca4b4108-d375-42fd-a954-75b42b1e638f": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "41fe4a9f-ece8-48ec-b385-88c25b1da037",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "ca4b4108-d375-42fd-a954-75b42b1e638f",
                        "configuration": 0
                    },
                    "474c77d9-480f-49aa-914f-a533d9a0cd4b": {
                        "abbreviation": "B",
                        "center": {
                            "x": 7523.780795773637,
                            "y": -7583.024810570847
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "474c77d9-480f-49aa-914f-a533d9a0cd4b",
                        "fixtureUnits": null,
                        "name": "basin",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 180,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "warm-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "warm-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "f9ff076c-deee-4908-8e55-1a4368f906bd"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "430cc668-9b92-4ff0-8504-156e4dfbf7d5"
                            }
                        }
                    },
                    "f9ff076c-deee-4908-8e55-1a4368f906bd": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "474c77d9-480f-49aa-914f-a533d9a0cd4b",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "warm-water",
                        "uid": "f9ff076c-deee-4908-8e55-1a4368f906bd",
                        "configuration": 0
                    },
                    "430cc668-9b92-4ff0-8504-156e4dfbf7d5": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "474c77d9-480f-49aa-914f-a533d9a0cd4b",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "430cc668-9b92-4ff0-8504-156e4dfbf7d5",
                        "configuration": 0
                    },
                    "4072cc7d-e30b-4d6c-a0f4-fc74a8c5ff0d": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 1718.8246517890366,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "4072cc7d-e30b-4d6c-a0f4-fc74a8c5ff0d",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "07585f6f-c5d2-408e-8046-680867f70400"
                            }
                        }
                    },
                    "07585f6f-c5d2-408e-8046-680867f70400": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "4072cc7d-e30b-4d6c-a0f4-fc74a8c5ff0d",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "07585f6f-c5d2-408e-8046-680867f70400",
                        "configuration": 0
                    },
                    "96589f47-2b5d-4d97-a8f9-14830d7ef8ce": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 2632.978119234038,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "96589f47-2b5d-4d97-a8f9-14830d7ef8ce",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "0fa8d6d1-c290-4aa2-b1a2-c591ee7a51ab"
                            }
                        }
                    },
                    "0fa8d6d1-c290-4aa2-b1a2-c591ee7a51ab": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "96589f47-2b5d-4d97-a8f9-14830d7ef8ce",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "0fa8d6d1-c290-4aa2-b1a2-c591ee7a51ab",
                        "configuration": 0
                    },
                    "3f766ceb-be1a-4676-9508-59e8e0217569": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 3576.06049387667,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "3f766ceb-be1a-4676-9508-59e8e0217569",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "d92ef1bf-5983-4ca5-bbff-34bdf91dd5d5"
                            }
                        }
                    },
                    "d92ef1bf-5983-4ca5-bbff-34bdf91dd5d5": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "3f766ceb-be1a-4676-9508-59e8e0217569",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "d92ef1bf-5983-4ca5-bbff-34bdf91dd5d5",
                        "configuration": 0
                    },
                    "4b676e03-f9fd-4739-b76c-585d640f2ff3": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 4499.3998894147735,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "4b676e03-f9fd-4739-b76c-585d640f2ff3",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "8da7eae5-b33e-498c-a01f-b9d1c6d396a8"
                            }
                        }
                    },
                    "8da7eae5-b33e-498c-a01f-b9d1c6d396a8": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "4b676e03-f9fd-4739-b76c-585d640f2ff3",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "8da7eae5-b33e-498c-a01f-b9d1c6d396a8",
                        "configuration": 0
                    },
                    "8a68d6aa-88e4-44f7-abed-547817778cf9": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 5558.129437210508,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "8a68d6aa-88e4-44f7-abed-547817778cf9",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "369e575c-6fc3-4d90-bf12-3ef4ded61520"
                            }
                        }
                    },
                    "369e575c-6fc3-4d90-bf12-3ef4ded61520": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "8a68d6aa-88e4-44f7-abed-547817778cf9",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "369e575c-6fc3-4d90-bf12-3ef4ded61520",
                        "configuration": 0
                    },
                    "93738108-5bc3-4a07-8ec8-f8e5bc1022b3": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 6482.89728712189,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "93738108-5bc3-4a07-8ec8-f8e5bc1022b3",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "0d50967e-f4c2-43b7-bdb0-78afb862eefc"
                            }
                        }
                    },
                    "0d50967e-f4c2-43b7-bdb0-78afb862eefc": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "93738108-5bc3-4a07-8ec8-f8e5bc1022b3",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "0d50967e-f4c2-43b7-bdb0-78afb862eefc",
                        "configuration": 0
                    },
                    "11b68be3-b936-4e88-8a7f-9f65ac94a78a": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 7364.451686102828,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "11b68be3-b936-4e88-8a7f-9f65ac94a78a",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "8fa2663d-39a1-409d-8e9c-65f5fe33ded8"
                            }
                        }
                    },
                    "8fa2663d-39a1-409d-8e9c-65f5fe33ded8": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "11b68be3-b936-4e88-8a7f-9f65ac94a78a",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "8fa2663d-39a1-409d-8e9c-65f5fe33ded8",
                        "configuration": 0
                    },
                    "7124e82b-fde5-47a2-94eb-a565f1bb93d4": {
                        "abbreviation": "WC",
                        "center": {
                            "x": 8297.862226200294,
                            "y": -10788.154735908485
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "7124e82b-fde5-47a2-94eb-a565f1bb93d4",
                        "fixtureUnits": null,
                        "name": "wc",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 0,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "a4bff9ab-7fc2-4329-aced-619531b6feda"
                            }
                        }
                    },
                    "a4bff9ab-7fc2-4329-aced-619531b6feda": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "7124e82b-fde5-47a2-94eb-a565f1bb93d4",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "a4bff9ab-7fc2-4329-aced-619531b6feda",
                        "configuration": 0
                    },
                    "515edd69-39f0-4aab-abd7-39a1e88189ad": {
                        "center": {
                            "x": -6514.908420627215,
                            "y": -6395.494319557404
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "515edd69-39f0-4aab-abd7-39a1e88189ad"
                    },
                    "22419e2f-4e97-4537-945f-378937c448dc": {
                        "center": {
                            "x": 10006.507457856263,
                            "y": -6395.494319557404
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "22419e2f-4e97-4537-945f-378937c448dc"
                    },
                    "f2ec9419-edbc-47e3-9b8e-b2eba1794daf": {
                        "abbreviation": "KS",
                        "center": {
                            "x": 16097.79556117918,
                            "y": -5402.6456937629755
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "type": "FIXTURE",
                        "uid": "f2ec9419-edbc-47e3-9b8e-b2eba1794daf",
                        "fixtureUnits": null,
                        "name": "kitchenSinkHot",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 14.99999999999445,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "hot-water",
                            "cold-water"
                        ],
                        "roughIns": {
                            "hot-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "adfcddc4-0e1e-4829-bfd7-5c31114560bf"
                            },
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "16972f6b-01d3-4b85-9923-19b01a7b4643"
                            }
                        }
                    },
                    "adfcddc4-0e1e-4829-bfd7-5c31114560bf": {
                        "center": {
                            "x": -100,
                            "y": 0
                        },
                        "parentUid": "f2ec9419-edbc-47e3-9b8e-b2eba1794daf",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "hot-water",
                        "uid": "adfcddc4-0e1e-4829-bfd7-5c31114560bf",
                        "configuration": 0
                    },
                    "16972f6b-01d3-4b85-9923-19b01a7b4643": {
                        "center": {
                            "x": 100,
                            "y": 0
                        },
                        "parentUid": "f2ec9419-edbc-47e3-9b8e-b2eba1794daf",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "16972f6b-01d3-4b85-9923-19b01a7b4643",
                        "configuration": 0
                    },
                    "5c994c03-388e-4485-af89-9c2717bb6e7e": {
                        "center": {
                            "x": 10006.507457856263,
                            "y": -5376.763789252733
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "5c994c03-388e-4485-af89-9c2717bb6e7e"
                    },
                    "dceadb63-4e97-4003-83e4-98483299a567": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "22419e2f-4e97-4537-945f-378937c448dc",
                            "5c994c03-388e-4485-af89-9c2717bb6e7e"
                        ],
                        "heightAboveFloorM": 2.7,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "dceadb63-4e97-4003-83e4-98483299a567"
                    },
                    "cb3ee8cc-cf92-42da-9b8d-51fa718fc923": {
                        "center": {
                            "x": -6021.915445054752,
                            "y": -10037.768455092497
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "cb3ee8cc-cf92-42da-9b8d-51fa718fc923"
                    },
                    "44c7da22-c230-44e7-b8ef-81905a849424": {
                        "center": {
                            "x": -6840.759184820836,
                            "y": -10037.768455092497
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "44c7da22-c230-44e7-b8ef-81905a849424"
                    },
                    "aa7c2aea-1727-4e7f-839a-912ba3497353": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "cb3ee8cc-cf92-42da-9b8d-51fa718fc923",
                            "44c7da22-c230-44e7-b8ef-81905a849424"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "aa7c2aea-1727-4e7f-839a-912ba3497353"
                    },
                    "d80cbf7f-e347-4be4-bda4-041d2a427faa": {
                        "center": {
                            "x": -6840.759184820836,
                            "y": -5974.778432906202
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "d80cbf7f-e347-4be4-bda4-041d2a427faa"
                    },
                    "d919a4e2-25e9-4984-b93e-011e57492e49": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "44c7da22-c230-44e7-b8ef-81905a849424",
                            "d80cbf7f-e347-4be4-bda4-041d2a427faa"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "d919a4e2-25e9-4984-b93e-011e57492e49"
                    },
                    "f306289f-579c-46aa-9aec-07541df9a791": {
                        "center": {
                            "x": 9585.528215015813,
                            "y": -5974.778432906202
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "f306289f-579c-46aa-9aec-07541df9a791"
                    },
                    "f5685d67-f3ae-45eb-b139-f1f66c3341a3": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "d80cbf7f-e347-4be4-bda4-041d2a427faa",
                            "f306289f-579c-46aa-9aec-07541df9a791"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "f5685d67-f3ae-45eb-b139-f1f66c3341a3"
                    },
                    "0f7306dc-819f-46a1-bb1c-2e1ce8076fec": {
                        "center": {
                            "x": 9585.528215015813,
                            "y": -4923.89879207729
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "0f7306dc-819f-46a1-bb1c-2e1ce8076fec"
                    },
                    "f95ebb42-565a-404f-8a92-adbb2721d9a4": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "f306289f-579c-46aa-9aec-07541df9a791",
                            "0f7306dc-819f-46a1-bb1c-2e1ce8076fec"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "f95ebb42-565a-404f-8a92-adbb2721d9a4"
                    },
                    "6866814d-4d28-4966-b08a-a054f2008d9c": {
                        "center": {
                            "x": 10566.526178016236,
                            "y": -4923.89879207729
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "6866814d-4d28-4966-b08a-a054f2008d9c"
                    },
                    "4665d5ca-3c1e-4143-8908-32d38c5fbede": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "0f7306dc-819f-46a1-bb1c-2e1ce8076fec",
                            "6866814d-4d28-4966-b08a-a054f2008d9c"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "4665d5ca-3c1e-4143-8908-32d38c5fbede"
                    },
                    "06d2188c-5288-47de-a594-6c69d8e3773f": {
                        "center": {
                            "x": 10566.526178016236,
                            "y": -6804.68115502312
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "06d2188c-5288-47de-a594-6c69d8e3773f"
                    },
                    "d0d0d79d-6055-447b-974c-dd801410c983": {
                        "center": {
                            "x": -5568.074329757579,
                            "y": -6804.68115502312
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.94117647058823,
                                "s": 0.8518,
                                "l": 0.3961,
                                "a": 0.45
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45
                            },
                            "hsv": {
                                "h": 272.94117647058823,
                                "s": 0.9199697591532563,
                                "v": 0.7334979800000001,
                                "a": 0.45
                            },
                            "oldHue": 272.94117647058823,
                            "source": "rgba",
                            "a": 0.45
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "type": "FITTING",
                        "uid": "d0d0d79d-6055-447b-974c-dd801410c983"
                    },
                    "f9259b57-608c-4c31-bd59-8c3a84d62a8e": {
                        "center": {
                            "x": 10566.526178016236,
                            "y": -5428.527598273218
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "hot-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "f9259b57-608c-4c31-bd59-8c3a84d62a8e"
                    },
                    "046deaee-555d-4188-96b2-f504589532d3": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "f9259b57-608c-4c31-bd59-8c3a84d62a8e",
                            "6866814d-4d28-4966-b08a-a054f2008d9c"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "046deaee-555d-4188-96b2-f504589532d3"
                    },
                    "29270605-9008-4886-bd7b-25974ef0354a": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "f9259b57-608c-4c31-bd59-8c3a84d62a8e",
                            "06d2188c-5288-47de-a594-6c69d8e3773f"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "29270605-9008-4886-bd7b-25974ef0354a"
                    },
                    "7e51dbcc-213f-4064-9e7a-150ef095d2db": {
                        "center": {
                            "x": 10257.529217259118,
                            "y": -5376.763789252733
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "dc2548d3-87bf-478b-8585-7edb859bca94",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "7e51dbcc-213f-4064-9e7a-150ef095d2db",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "dc2548d3-87bf-478b-8585-7edb859bca94": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "7e51dbcc-213f-4064-9e7a-150ef095d2db",
                            "16972f6b-01d3-4b85-9923-19b01a7b4643"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "dc2548d3-87bf-478b-8585-7edb859bca94"
                    },
                    "698efb2e-60e7-4073-8c1f-b0cca6b17457": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "7e51dbcc-213f-4064-9e7a-150ef095d2db",
                            "5c994c03-388e-4485-af89-9c2717bb6e7e"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "698efb2e-60e7-4073-8c1f-b0cca6b17457"
                    },
                    "4e53cb22-c953-445b-a59f-8871be2f4a82": {
                        "center": {
                            "x": 10944.708377549752,
                            "y": -5428.527598273218
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "71b79f59-c69f-4fa2-a0ad-c29dca1fcfca",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "4e53cb22-c953-445b-a59f-8871be2f4a82",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "71b79f59-c69f-4fa2-a0ad-c29dca1fcfca": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "4e53cb22-c953-445b-a59f-8871be2f4a82",
                            "adfcddc4-0e1e-4829-bfd7-5c31114560bf"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "71b79f59-c69f-4fa2-a0ad-c29dca1fcfca"
                    },
                    "a0cf6f2b-6eb8-4151-b08d-b07c6c3be720": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "4e53cb22-c953-445b-a59f-8871be2f4a82",
                            "f9259b57-608c-4c31-bd59-8c3a84d62a8e"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "a0cf6f2b-6eb8-4151-b08d-b07c6c3be720"
                    },
                    "08aed207-e38d-4d02-8ec6-4bb78bfc2c11": {
                        "coldRoughInUid": "f13e34b6-d899-4c73-89a5-9e97562d2992",
                        "hotRoughInUid": "8e5f8a15-5106-4f58-ae0c-beb3a300458d",
                        "maxFlowRateLS": null,
                        "maxHotColdPressureDifferentialPCT": null,
                        "maxInletPressureKPA": null,
                        "minFlowRateLS": null,
                        "minInletPressureKPA": null,
                        "pipeDistanceMM": 150,
                        "rotation": 180,
                        "valveLengthMM": 200,
                        "valve": {
                            "type": "TMV",
                            "warmOutputUid": "c8cda9f4-38b8-43bd-8265-87d0eb6c59b5",
                            "coldOutputUid": "86986d69-5410-4e97-bf6e-d8399fe6898e",
                            "catalogId": "tmv"
                        },
                        "type": "BIG_VALVE",
                        "center": {
                            "x": 1432.8109546997948,
                            "y": -7415.050928852046
                        },
                        "heightAboveFloorM": 1,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "outputTemperatureC": 50,
                        "uid": "08aed207-e38d-4d02-8ec6-4bb78bfc2c11"
                    },
                    "f13e34b6-d899-4c73-89a5-9e97562d2992": {
                        "center": {
                            "x": 75,
                            "y": 0
                        },
                        "parentUid": "08aed207-e38d-4d02-8ec6-4bb78bfc2c11",
                        "type": "SYSTEM_NODE",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "uid": "f13e34b6-d899-4c73-89a5-9e97562d2992",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "8e5f8a15-5106-4f58-ae0c-beb3a300458d": {
                        "center": {
                            "x": -75,
                            "y": 0
                        },
                        "parentUid": "08aed207-e38d-4d02-8ec6-4bb78bfc2c11",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "uid": "8e5f8a15-5106-4f58-ae0c-beb3a300458d",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "c8cda9f4-38b8-43bd-8265-87d0eb6c59b5": {
                        "center": {
                            "x": -75,
                            "y": 100
                        },
                        "parentUid": "08aed207-e38d-4d02-8ec6-4bb78bfc2c11",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "uid": "c8cda9f4-38b8-43bd-8265-87d0eb6c59b5",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "86986d69-5410-4e97-bf6e-d8399fe6898e": {
                        "center": {
                            "x": 75,
                            "y": 100
                        },
                        "parentUid": "08aed207-e38d-4d02-8ec6-4bb78bfc2c11",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "86986d69-5410-4e97-bf6e-d8399fe6898e",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "51b230af-4a58-425a-888f-e2da0ed53ccf": {
                        "center": {
                            "x": 1357.8109546997948,
                            "y": -6395.494319557404
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "51b230af-4a58-425a-888f-e2da0ed53ccf"
                    },
                    "6ff30a70-380b-4f05-92c1-dfc685454e74": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "51b230af-4a58-425a-888f-e2da0ed53ccf",
                            "515edd69-39f0-4aab-abd7-39a1e88189ad"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "6ff30a70-380b-4f05-92c1-dfc685454e74"
                    },
                    "22766997-e5e6-42b7-a663-30cebeff50b9": {
                        "center": {
                            "x": 1507.8109546997948,
                            "y": -6804.68115502312
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "hot-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "22766997-e5e6-42b7-a663-30cebeff50b9"
                    },
                    "4a0bd6af-7dba-4df2-8be9-5ea77d469dc3": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.94117647058823,
                                "s": 0.8518,
                                "l": 0.3961,
                                "a": 0.45
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45
                            },
                            "hsv": {
                                "h": 272.94117647058823,
                                "s": 0.9199697591532563,
                                "v": 0.7334979800000001,
                                "a": 0.45
                            },
                            "oldHue": 272.94117647058823,
                            "source": "rgba",
                            "a": 0.45
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "22766997-e5e6-42b7-a663-30cebeff50b9",
                            "d0d0d79d-6055-447b-974c-dd801410c983"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "4a0bd6af-7dba-4df2-8be9-5ea77d469dc3"
                    },
                    "afd7056c-c153-4482-8fb2-90e49723bc0a": {
                        "coldRoughInUid": "0fcad641-4dc2-45b4-9724-21c882ac3636",
                        "hotRoughInUid": "ec787bdf-7d1e-44cb-b966-f72d0539c69c",
                        "maxFlowRateLS": null,
                        "maxHotColdPressureDifferentialPCT": null,
                        "maxInletPressureKPA": null,
                        "minFlowRateLS": null,
                        "minInletPressureKPA": null,
                        "pipeDistanceMM": 150,
                        "rotation": 180,
                        "valveLengthMM": 200,
                        "valve": {
                            "type": "TMV",
                            "warmOutputUid": "314b955a-78fe-4b13-a0ed-e31d65d628ab",
                            "coldOutputUid": "c08f3229-8b60-4dcf-ae97-c7da3a3559cb",
                            "catalogId": "tmv"
                        },
                        "type": "BIG_VALVE",
                        "center": {
                            "x": 8598.201498548766,
                            "y": -7413.145521519471
                        },
                        "heightAboveFloorM": 1,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "outputTemperatureC": 50,
                        "uid": "afd7056c-c153-4482-8fb2-90e49723bc0a"
                    },
                    "0fcad641-4dc2-45b4-9724-21c882ac3636": {
                        "center": {
                            "x": 75,
                            "y": 0
                        },
                        "parentUid": "afd7056c-c153-4482-8fb2-90e49723bc0a",
                        "type": "SYSTEM_NODE",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "uid": "0fcad641-4dc2-45b4-9724-21c882ac3636",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "ec787bdf-7d1e-44cb-b966-f72d0539c69c": {
                        "center": {
                            "x": -75,
                            "y": 0
                        },
                        "parentUid": "afd7056c-c153-4482-8fb2-90e49723bc0a",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "hot-water",
                        "uid": "ec787bdf-7d1e-44cb-b966-f72d0539c69c",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "314b955a-78fe-4b13-a0ed-e31d65d628ab": {
                        "center": {
                            "x": -75,
                            "y": 100
                        },
                        "parentUid": "afd7056c-c153-4482-8fb2-90e49723bc0a",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "uid": "314b955a-78fe-4b13-a0ed-e31d65d628ab",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "c08f3229-8b60-4dcf-ae97-c7da3a3559cb": {
                        "center": {
                            "x": 75,
                            "y": 100
                        },
                        "parentUid": "afd7056c-c153-4482-8fb2-90e49723bc0a",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "c08f3229-8b60-4dcf-ae97-c7da3a3559cb",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "46c90f82-fa3c-49ae-a787-c579d20ac5ae": {
                        "center": {
                            "x": 8523.201498548766,
                            "y": -6395.494319557404
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "46c90f82-fa3c-49ae-a787-c579d20ac5ae"
                    },
                    "7b1de821-748f-48f8-b5ee-1631ffa943f4": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "46c90f82-fa3c-49ae-a787-c579d20ac5ae",
                            "51b230af-4a58-425a-888f-e2da0ed53ccf"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "7b1de821-748f-48f8-b5ee-1631ffa943f4"
                    },
                    "e6fb586d-2d3b-4ff5-9cd0-909b1511e3ad": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "46c90f82-fa3c-49ae-a787-c579d20ac5ae",
                            "22419e2f-4e97-4537-945f-378937c448dc"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "e6fb586d-2d3b-4ff5-9cd0-909b1511e3ad"
                    },
                    "9b942ed6-4c67-4726-922e-368aa63ac309": {
                        "center": {
                            "x": 8673.201498548766,
                            "y": -6804.68115502312
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "hot-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "9b942ed6-4c67-4726-922e-368aa63ac309"
                    },
                    "ae6d0f91-e4e5-497a-9d7c-b8cb3cd67f46": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "9b942ed6-4c67-4726-922e-368aa63ac309",
                            "22766997-e5e6-42b7-a663-30cebeff50b9"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ae6d0f91-e4e5-497a-9d7c-b8cb3cd67f46"
                    },
                    "7c33d5c3-8b7e-4b87-adfe-6a7ece6b5fcc": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "9b942ed6-4c67-4726-922e-368aa63ac309",
                            "06d2188c-5288-47de-a594-6c69d8e3773f"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "7c33d5c3-8b7e-4b87-adfe-6a7ece6b5fcc"
                    },
                    "8c8e1b14-7ddd-4c5c-98a5-8f908019bb8d": {
                        "center": {
                            "x": -6514.908420627215,
                            "y": -10390.65308345704
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "b3409e40-3c7a-4981-84b5-d9ea28849963",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "8c8e1b14-7ddd-4c5c-98a5-8f908019bb8d",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "b3409e40-3c7a-4981-84b5-d9ea28849963": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "8c8e1b14-7ddd-4c5c-98a5-8f908019bb8d",
                            "924c02c5-e487-453b-b84b-35ef0bc57533"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "b3409e40-3c7a-4981-84b5-d9ea28849963"
                    },
                    "ca9581b3-bc85-46ee-8bc5-6f84ce293108": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "8c8e1b14-7ddd-4c5c-98a5-8f908019bb8d",
                            "515edd69-39f0-4aab-abd7-39a1e88189ad"
                        ],
                        "heightAboveFloorM": 2.7,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "ca9581b3-bc85-46ee-8bc5-6f84ce293108"
                    },
                    "f90294f0-4af1-44f2-83a9-243609c7eee9": {
                        "center": {
                            "x": -6021.915445054752,
                            "y": -10390.65308345704
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "92a8fc4f-d22d-4b48-8522-6e3a08849c34",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "f90294f0-4af1-44f2-83a9-243609c7eee9",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "92a8fc4f-d22d-4b48-8522-6e3a08849c34": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "f90294f0-4af1-44f2-83a9-243609c7eee9",
                            "99a0b1d3-6376-412c-b5d0-f0e2df4d7a3d"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "92a8fc4f-d22d-4b48-8522-6e3a08849c34"
                    },
                    "3642763e-fa73-49d5-a387-06aa71175772": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "f90294f0-4af1-44f2-83a9-243609c7eee9",
                            "cb3ee8cc-cf92-42da-9b8d-51fa718fc923"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "3642763e-fa73-49d5-a387-06aa71175772"
                    },
                    "8cfb1394-a59a-4010-842b-a6482d29957d": {
                        "center": {
                            "x": -5568.074329757579,
                            "y": -10390.65308345704
                        },
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.94117647058823,
                                "s": 0.8518,
                                "l": 0.3961,
                                "a": 0.45
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45
                            },
                            "hsv": {
                                "h": 272.94117647058823,
                                "s": 0.9199697591532563,
                                "v": 0.7334979800000001,
                                "a": 0.45
                            },
                            "oldHue": 272.94117647058823,
                            "source": "rgba",
                            "a": 0.45
                        },
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "1a05173c-5559-47f2-bae8-f836aaa29fd5",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "8cfb1394-a59a-4010-842b-a6482d29957d",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "1a05173c-5559-47f2-bae8-f836aaa29fd5": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.94117647058823,
                                "s": 0.8518,
                                "l": 0.3961,
                                "a": 0.45
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45
                            },
                            "hsv": {
                                "h": 272.94117647058823,
                                "s": 0.9199697591532563,
                                "v": 0.7334979800000001,
                                "a": 0.45
                            },
                            "oldHue": 272.94117647058823,
                            "source": "rgba",
                            "a": 0.45
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "8cfb1394-a59a-4010-842b-a6482d29957d",
                            "d0d0d79d-6055-447b-974c-dd801410c983"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "1a05173c-5559-47f2-bae8-f836aaa29fd5"
                    },
                    "3c3d92c9-e16f-45db-bb2a-d47c84b782e1": {
                        "color": {
                            "hex": "#6D0FBB",
                            "hsl": {
                                "h": 272.94117647058823,
                                "s": 0.8518,
                                "l": 0.3961,
                                "a": 0.45
                            },
                            "hex8": "#6D0FBB73",
                            "rgba": {
                                "r": 109,
                                "g": 15,
                                "b": 187,
                                "a": 0.45
                            },
                            "hsv": {
                                "h": 272.94117647058823,
                                "s": 0.9199697591532563,
                                "v": 0.7334979800000001,
                                "a": 0.45
                            },
                            "oldHue": 272.94117647058823,
                            "source": "rgba",
                            "a": 0.45
                        },
                        "diameterMM": null,
                        "endpointUid": [
                            "8cfb1394-a59a-4010-842b-a6482d29957d",
                            "e4d947f4-572c-4b64-974c-834ccd734e8b"
                        ],
                        "heightAboveFloorM": 2.599999999999998,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "3c3d92c9-e16f-45db-bb2a-d47c84b782e1"
                    },
                    "19d2839d-c894-4350-948e-b12454971255": {
                        "center": {
                            "x": 1357.8109546997948,
                            "y": -7072.861426241072
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "55075009-226a-4f7a-ab59-ca1e15a5591d",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "19d2839d-c894-4350-948e-b12454971255",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "55075009-226a-4f7a-ab59-ca1e15a5591d": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "19d2839d-c894-4350-948e-b12454971255",
                            "51b230af-4a58-425a-888f-e2da0ed53ccf"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "55075009-226a-4f7a-ab59-ca1e15a5591d"
                    },
                    "830f86de-146c-468c-b79b-0134b1c1c2e4": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "19d2839d-c894-4350-948e-b12454971255",
                            "f13e34b6-d899-4c73-89a5-9e97562d2992"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "830f86de-146c-468c-b79b-0134b1c1c2e4"
                    },
                    "ca572692-175f-4dc2-8b6a-36713307d6e9": {
                        "center": {
                            "x": 1507.8109546997948,
                            "y": -7072.861426241072
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "3587da82-0888-47b8-8aa8-d844bb1d5161",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "ca572692-175f-4dc2-8b6a-36713307d6e9",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "3587da82-0888-47b8-8aa8-d844bb1d5161": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "ca572692-175f-4dc2-8b6a-36713307d6e9",
                            "22766997-e5e6-42b7-a663-30cebeff50b9"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "3587da82-0888-47b8-8aa8-d844bb1d5161"
                    },
                    "1b2a4008-56d4-4111-a1fa-19a69eb44ae6": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "ca572692-175f-4dc2-8b6a-36713307d6e9",
                            "8e5f8a15-5106-4f58-ae0c-beb3a300458d"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "1b2a4008-56d4-4111-a1fa-19a69eb44ae6"
                    },
                    "81ae6c47-3b20-4bc9-86c9-11dcb7cd246f": {
                        "center": {
                            "x": 8523.201498548766,
                            "y": -7013.253281721392
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "a0645eb1-e401-4448-89b3-77946445e7c3",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "81ae6c47-3b20-4bc9-86c9-11dcb7cd246f",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "a0645eb1-e401-4448-89b3-77946445e7c3": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "81ae6c47-3b20-4bc9-86c9-11dcb7cd246f",
                            "46c90f82-fa3c-49ae-a787-c579d20ac5ae"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "a0645eb1-e401-4448-89b3-77946445e7c3"
                    },
                    "bafd37c8-3cdc-4910-aefe-48f040c26fd3": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "81ae6c47-3b20-4bc9-86c9-11dcb7cd246f",
                            "0fcad641-4dc2-45b4-9724-21c882ac3636"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "bafd37c8-3cdc-4910-aefe-48f040c26fd3"
                    },
                    "c071da89-0a4c-40a2-946e-1a46a206dc2d": {
                        "center": {
                            "x": 8673.201498548766,
                            "y": -7013.253281721392
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "sourceUid": "2eaefe3c-5976-48ef-9428-1952a2d8fea4",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "c071da89-0a4c-40a2-946e-1a46a206dc2d",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "2eaefe3c-5976-48ef-9428-1952a2d8fea4": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "c071da89-0a4c-40a2-946e-1a46a206dc2d",
                            "9b942ed6-4c67-4726-922e-368aa63ac309"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "2eaefe3c-5976-48ef-9428-1952a2d8fea4"
                    },
                    "76af9bc6-9c67-4252-94c6-fe5626f6ab7f": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "c071da89-0a4c-40a2-946e-1a46a206dc2d",
                            "ec787bdf-7d1e-44cb-b966-f72d0539c69c"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "hot-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "76af9bc6-9c67-4252-94c6-fe5626f6ab7f"
                    },
                    "8ca591db-92cb-4298-9532-48e91a6662f1": {
                        "center": {
                            "x": 1690.4793093748121,
                            "y": -7485.315168829331
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "8ca591db-92cb-4298-9532-48e91a6662f1"
                    },
                    "6f81c2e5-86e7-4838-a629-d0575dff7e6f": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "86986d69-5410-4e97-bf6e-d8399fe6898e",
                            "8ca591db-92cb-4298-9532-48e91a6662f1"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "6f81c2e5-86e7-4838-a629-d0575dff7e6f"
                    },
                    "45bb0146-b780-4a98-8832-9f05289dc1d9": {
                        "center": {
                            "x": 4995.97550760688,
                            "y": -7485.315168829331
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "45bb0146-b780-4a98-8832-9f05289dc1d9"
                    },
                    "8251dcae-63f1-4c26-b269-958fcb62b252": {
                        "center": {
                            "x": 4995.97550760688,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "8251dcae-63f1-4c26-b269-958fcb62b252"
                    },
                    "6b17729f-8fcb-4ee5-aa30-71e583e0177b": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "45bb0146-b780-4a98-8832-9f05289dc1d9",
                            "8251dcae-63f1-4c26-b269-958fcb62b252"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "6b17729f-8fcb-4ee5-aa30-71e583e0177b"
                    },
                    "c328f0d3-a1bf-4173-bf41-42c6e1bf00b4": {
                        "center": {
                            "x": 1718.8246517890366,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "c328f0d3-a1bf-4173-bf41-42c6e1bf00b4"
                    },
                    "bcb52945-d398-4625-b451-d5e45b776cbc": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "c328f0d3-a1bf-4173-bf41-42c6e1bf00b4",
                            "07585f6f-c5d2-408e-8046-680867f70400"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "bcb52945-d398-4625-b451-d5e45b776cbc"
                    },
                    "ff9b46f1-3677-4d6d-a570-33fc2c3168fa": {
                        "center": {
                            "x": 2632.978119234038,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "ff9b46f1-3677-4d6d-a570-33fc2c3168fa"
                    },
                    "d00d7e3b-ad3e-4946-bfc2-921a52e0e20a": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "ff9b46f1-3677-4d6d-a570-33fc2c3168fa",
                            "c328f0d3-a1bf-4173-bf41-42c6e1bf00b4"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "d00d7e3b-ad3e-4946-bfc2-921a52e0e20a"
                    },
                    "9e1217cd-8c60-45b3-8e9b-edbd9c4fe7ec": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "ff9b46f1-3677-4d6d-a570-33fc2c3168fa",
                            "0fa8d6d1-c290-4aa2-b1a2-c591ee7a51ab"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "9e1217cd-8c60-45b3-8e9b-edbd9c4fe7ec"
                    },
                    "dbf87f6e-2376-4ca4-9466-97cf2af0e2ff": {
                        "center": {
                            "x": 3578.149442015074,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "dbf87f6e-2376-4ca4-9466-97cf2af0e2ff"
                    },
                    "4d551985-0f94-46a0-a063-f53d04d889f6": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "dbf87f6e-2376-4ca4-9466-97cf2af0e2ff",
                            "ff9b46f1-3677-4d6d-a570-33fc2c3168fa"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "4d551985-0f94-46a0-a063-f53d04d889f6"
                    },
                    "e5af62fd-7f19-4be2-968e-a05c0f84a834": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "dbf87f6e-2376-4ca4-9466-97cf2af0e2ff",
                            "d92ef1bf-5983-4ca5-bbff-34bdf91dd5d5"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "e5af62fd-7f19-4be2-968e-a05c0f84a834"
                    },
                    "a63e3bbc-f25c-4ef0-93f8-7ae431739abf": {
                        "center": {
                            "x": 4499.3998894147735,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "a63e3bbc-f25c-4ef0-93f8-7ae431739abf"
                    },
                    "88f2b12c-1941-498d-8556-0607951e2e59": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "a63e3bbc-f25c-4ef0-93f8-7ae431739abf",
                            "dbf87f6e-2376-4ca4-9466-97cf2af0e2ff"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "88f2b12c-1941-498d-8556-0607951e2e59"
                    },
                    "850a718f-daf2-44a4-a160-f8b6aeea9e45": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "a63e3bbc-f25c-4ef0-93f8-7ae431739abf",
                            "8251dcae-63f1-4c26-b269-958fcb62b252"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "850a718f-daf2-44a4-a160-f8b6aeea9e45"
                    },
                    "94a2136b-90c9-4733-a822-b4ec02c0fb7c": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "a63e3bbc-f25c-4ef0-93f8-7ae431739abf",
                            "8da7eae5-b33e-498c-a01f-b9d1c6d396a8"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "94a2136b-90c9-4733-a822-b4ec02c0fb7c"
                    },
                    "0b32d302-5962-4c38-a4ff-52dfd4284ff0": {
                        "center": {
                            "x": 2437.170416051613,
                            "y": -7485.315168829331
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "0b32d302-5962-4c38-a4ff-52dfd4284ff0"
                    },
                    "fef55f32-4716-4a56-a23f-8929356baf20": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "0b32d302-5962-4c38-a4ff-52dfd4284ff0",
                            "8ca591db-92cb-4298-9532-48e91a6662f1"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "fef55f32-4716-4a56-a23f-8929356baf20"
                    },
                    "d8b10978-a251-4f31-93de-9c2bd0f3ce46": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "0b32d302-5962-4c38-a4ff-52dfd4284ff0",
                            "90d85f69-eab9-4d8e-ad4e-46a4180a32a6"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "d8b10978-a251-4f31-93de-9c2bd0f3ce46"
                    },
                    "2752810c-89be-4e24-96a3-22d6eaa5ee90": {
                        "center": {
                            "x": 3417.4950265589505,
                            "y": -7485.315168829331
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "2752810c-89be-4e24-96a3-22d6eaa5ee90"
                    },
                    "ecdcd7d7-b5df-4e2f-8006-667c6fe48e70": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "2752810c-89be-4e24-96a3-22d6eaa5ee90",
                            "0b32d302-5962-4c38-a4ff-52dfd4284ff0"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "ecdcd7d7-b5df-4e2f-8006-667c6fe48e70"
                    },
                    "4e1d0c5c-e5c7-4ffb-af47-2f190b7078d8": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "2752810c-89be-4e24-96a3-22d6eaa5ee90",
                            "46ed556d-984f-4e8f-904f-d61a8abfac29"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "4e1d0c5c-e5c7-4ffb-af47-2f190b7078d8"
                    },
                    "da68795d-bf0f-4f8c-8acf-b863e34c054b": {
                        "center": {
                            "x": 4387.703685541692,
                            "y": -7485.315168829331
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "da68795d-bf0f-4f8c-8acf-b863e34c054b"
                    },
                    "bd6eb84c-d664-47bd-965e-7e46ad035cb0": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "da68795d-bf0f-4f8c-8acf-b863e34c054b",
                            "2752810c-89be-4e24-96a3-22d6eaa5ee90"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "bd6eb84c-d664-47bd-965e-7e46ad035cb0"
                    },
                    "664a370e-1185-4f33-9fe6-6371ce858884": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "da68795d-bf0f-4f8c-8acf-b863e34c054b",
                            "45bb0146-b780-4a98-8832-9f05289dc1d9"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "664a370e-1185-4f33-9fe6-6371ce858884"
                    },
                    "dea5d791-823c-4428-8284-89aaedd12e97": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "da68795d-bf0f-4f8c-8acf-b863e34c054b",
                            "71ee6ada-6634-404f-8ce1-74d041d02a52"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "dea5d791-823c-4428-8284-89aaedd12e97"
                    },
                    "0807e685-e8ab-4ae3-a602-3079d9eac4a1": {
                        "center": {
                            "x": 1658.9412052840125,
                            "y": -7434.672213037622
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "0807e685-e8ab-4ae3-a602-3079d9eac4a1"
                    },
                    "8a36eec1-dab6-4ad2-8e98-f35aee315acb": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "c8cda9f4-38b8-43bd-8265-87d0eb6c59b5",
                            "0807e685-e8ab-4ae3-a602-3079d9eac4a1"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "8a36eec1-dab6-4ad2-8e98-f35aee315acb"
                    },
                    "7f17a016-8010-4a28-9fb4-9be88bc89d86": {
                        "center": {
                            "x": 4590.143453132336,
                            "y": -7434.672213037622
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "7f17a016-8010-4a28-9fb4-9be88bc89d86"
                    },
                    "13c3ccbc-7beb-4285-b0d9-68da0a399e97": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "7f17a016-8010-4a28-9fb4-9be88bc89d86",
                            "67bbb11b-b24a-48e2-8df9-7df8a9b6c54c"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "13c3ccbc-7beb-4285-b0d9-68da0a399e97"
                    },
                    "15809c20-c406-409d-b60b-b9c94e5c9683": {
                        "center": {
                            "x": 3623.8881958705606,
                            "y": -7434.672213037622
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "15809c20-c406-409d-b60b-b9c94e5c9683"
                    },
                    "ce10722b-5b70-430d-a5af-cd95414c13aa": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "15809c20-c406-409d-b60b-b9c94e5c9683",
                            "7f17a016-8010-4a28-9fb4-9be88bc89d86"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "ce10722b-5b70-430d-a5af-cd95414c13aa"
                    },
                    "874e80e7-1184-4cc6-a715-86ced992db3b": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "15809c20-c406-409d-b60b-b9c94e5c9683",
                            "ca77bab0-7f69-4e97-a30c-951b3d852c62"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "874e80e7-1184-4cc6-a715-86ced992db3b"
                    },
                    "87409b3c-6745-427a-84d9-b0beaf0377c6": {
                        "center": {
                            "x": 2634.0214379614117,
                            "y": -7434.672213037622
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "87409b3c-6745-427a-84d9-b0beaf0377c6"
                    },
                    "ba46c06f-0083-4831-b0d6-c7f6cfd89102": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "87409b3c-6745-427a-84d9-b0beaf0377c6",
                            "15809c20-c406-409d-b60b-b9c94e5c9683"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "ba46c06f-0083-4831-b0d6-c7f6cfd89102"
                    },
                    "2f1fcd2e-d78c-4cf2-bce0-be2bc01ff2da": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "87409b3c-6745-427a-84d9-b0beaf0377c6",
                            "0807e685-e8ab-4ae3-a602-3079d9eac4a1"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "2f1fcd2e-d78c-4cf2-bce0-be2bc01ff2da"
                    },
                    "adc806cc-9685-4d99-8c2a-603247b13664": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "87409b3c-6745-427a-84d9-b0beaf0377c6",
                            "88af38a7-bfe6-4549-9e28-bee8341b7ee4"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "adc806cc-9685-4d99-8c2a-603247b13664"
                    },
                    "482e92b5-16ea-4fa4-8604-09219fa4d867": {
                        "center": {
                            "x": 8382.408005941237,
                            "y": -7424.143221572091
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "482e92b5-16ea-4fa4-8604-09219fa4d867"
                    },
                    "d913fb8b-9a69-466b-8abc-0698c90f9d1c": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "314b955a-78fe-4b13-a0ed-e31d65d628ab",
                            "482e92b5-16ea-4fa4-8604-09219fa4d867"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "d913fb8b-9a69-466b-8abc-0698c90f9d1c"
                    },
                    "59502467-a86c-45a4-a418-5c23e87709a5": {
                        "center": {
                            "x": 5677.426861301548,
                            "y": -7424.143221572091
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "warm-water",
                        "type": "FITTING",
                        "uid": "59502467-a86c-45a4-a418-5c23e87709a5"
                    },
                    "a429f067-9a20-47ae-b145-068f747ba990": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "59502467-a86c-45a4-a418-5c23e87709a5",
                            "53a93f60-5b0a-43bc-b6df-fffe4a057e25"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "a429f067-9a20-47ae-b145-068f747ba990"
                    },
                    "d30fe62d-cc28-467f-8b19-d0e17ac9fea8": {
                        "center": {
                            "x": 6654.435512894106,
                            "y": -7424.143221572091
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "d30fe62d-cc28-467f-8b19-d0e17ac9fea8"
                    },
                    "70f08312-3489-47cb-9fad-ee2c4f2d24c8": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "d30fe62d-cc28-467f-8b19-d0e17ac9fea8",
                            "59502467-a86c-45a4-a418-5c23e87709a5"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "70f08312-3489-47cb-9fad-ee2c4f2d24c8"
                    },
                    "3bf0a35e-4152-4050-bf1f-3682f9d20c90": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "d30fe62d-cc28-467f-8b19-d0e17ac9fea8",
                            "ad70a616-36d4-41d5-9209-c54fcbfce92a"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "3bf0a35e-4152-4050-bf1f-3682f9d20c90"
                    },
                    "1eb9e9ca-119a-4126-83e1-069110afd763": {
                        "center": {
                            "x": 7626.148724640636,
                            "y": -7424.143221572091
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "warm-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "1eb9e9ca-119a-4126-83e1-069110afd763"
                    },
                    "f2ab5da5-c2c5-468b-8e5f-66657a391b64": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "1eb9e9ca-119a-4126-83e1-069110afd763",
                            "d30fe62d-cc28-467f-8b19-d0e17ac9fea8"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "f2ab5da5-c2c5-468b-8e5f-66657a391b64"
                    },
                    "a21c6085-1bdd-48e2-811f-ce738a70cfab": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "1eb9e9ca-119a-4126-83e1-069110afd763",
                            "482e92b5-16ea-4fa4-8604-09219fa4d867"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "a21c6085-1bdd-48e2-811f-ce738a70cfab"
                    },
                    "89654d17-b0e2-477c-a80d-451559949797": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "1eb9e9ca-119a-4126-83e1-069110afd763",
                            "f9ff076c-deee-4908-8e55-1a4368f906bd"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "warm-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "89654d17-b0e2-477c-a80d-451559949797"
                    },
                    "535bb450-7d29-4b8f-af56-ddeff61ed370": {
                        "center": {
                            "x": 8330.442224162642,
                            "y": -7482.8981071664875
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "535bb450-7d29-4b8f-af56-ddeff61ed370"
                    },
                    "2fc4af1f-c490-4651-9686-42e3102d4db5": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "c08f3229-8b60-4dcf-ae97-c7da3a3559cb",
                            "535bb450-7d29-4b8f-af56-ddeff61ed370"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "2fc4af1f-c490-4651-9686-42e3102d4db5"
                    },
                    "a920e5b6-9941-4e9b-a905-fe6f59075d73": {
                        "center": {
                            "x": 5078.180134492024,
                            "y": -7482.8981071664875
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "a920e5b6-9941-4e9b-a905-fe6f59075d73"
                    },
                    "33f4c8b7-520e-4e11-852e-fb07760c1632": {
                        "center": {
                            "x": 5078.180134492024,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "33f4c8b7-520e-4e11-852e-fb07760c1632"
                    },
                    "5d740ae5-afde-4be0-be36-52881ea52fa7": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "a920e5b6-9941-4e9b-a905-fe6f59075d73",
                            "33f4c8b7-520e-4e11-852e-fb07760c1632"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "5d740ae5-afde-4be0-be36-52881ea52fa7"
                    },
                    "cd735a03-af99-4341-aef9-afe2cb8834be": {
                        "center": {
                            "x": 8295.456737999175,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "cd735a03-af99-4341-aef9-afe2cb8834be"
                    },
                    "23e4b00b-f9ba-4fb0-b5ec-424cc0459e4a": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "cd735a03-af99-4341-aef9-afe2cb8834be",
                            "a4bff9ab-7fc2-4329-aced-619531b6feda"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "23e4b00b-f9ba-4fb0-b5ec-424cc0459e4a"
                    },
                    "00e433e2-78a1-4042-acd3-99a708f54d26": {
                        "center": {
                            "x": 7363.369524456091,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "00e433e2-78a1-4042-acd3-99a708f54d26"
                    },
                    "766598c2-c359-4b25-9c61-c2349c120182": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "00e433e2-78a1-4042-acd3-99a708f54d26",
                            "cd735a03-af99-4341-aef9-afe2cb8834be"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "766598c2-c359-4b25-9c61-c2349c120182"
                    },
                    "aad50cf3-bd6e-415a-a3ab-5835a0d0b8a4": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "00e433e2-78a1-4042-acd3-99a708f54d26",
                            "8fa2663d-39a1-409d-8e9c-65f5fe33ded8"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "aad50cf3-bd6e-415a-a3ab-5835a0d0b8a4"
                    },
                    "284d58b5-291b-4007-9baa-9b05511d6c5b": {
                        "center": {
                            "x": 6483.240423627794,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "284d58b5-291b-4007-9baa-9b05511d6c5b"
                    },
                    "f8398cf8-291c-4fd4-a6b5-7c73c862c796": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "284d58b5-291b-4007-9baa-9b05511d6c5b",
                            "00e433e2-78a1-4042-acd3-99a708f54d26"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "f8398cf8-291c-4fd4-a6b5-7c73c862c796"
                    },
                    "cea7f06f-4835-45dd-8ece-f83ca564e6c4": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "284d58b5-291b-4007-9baa-9b05511d6c5b",
                            "0d50967e-f4c2-43b7-bdb0-78afb862eefc"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "cea7f06f-4835-45dd-8ece-f83ca564e6c4"
                    },
                    "10418acc-6097-4ad8-bb66-813e0d0ee9b2": {
                        "center": {
                            "x": 5551.525197310159,
                            "y": -10925.07677217378
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "10418acc-6097-4ad8-bb66-813e0d0ee9b2"
                    },
                    "ece626e6-c7c6-4601-af47-8171f3973cc0": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "10418acc-6097-4ad8-bb66-813e0d0ee9b2",
                            "284d58b5-291b-4007-9baa-9b05511d6c5b"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "ece626e6-c7c6-4601-af47-8171f3973cc0"
                    },
                    "dae363f6-c1c8-4344-a226-75d9d6334f76": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "10418acc-6097-4ad8-bb66-813e0d0ee9b2",
                            "33f4c8b7-520e-4e11-852e-fb07760c1632"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "dae363f6-c1c8-4344-a226-75d9d6334f76"
                    },
                    "8fd3c75d-a358-466b-8ce5-e29cd1e75691": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "10418acc-6097-4ad8-bb66-813e0d0ee9b2",
                            "369e575c-6fc3-4d90-bf12-3ef4ded61520"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "8fd3c75d-a358-466b-8ce5-e29cd1e75691"
                    },
                    "d163537a-328f-4b0d-aa09-fe202d40c6ed": {
                        "center": {
                            "x": 5474.751154202066,
                            "y": -7482.8981071664875
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "d163537a-328f-4b0d-aa09-fe202d40c6ed"
                    },
                    "e46fd22c-b48d-45b6-beb8-4618dfc32307": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "d163537a-328f-4b0d-aa09-fe202d40c6ed",
                            "a920e5b6-9941-4e9b-a905-fe6f59075d73"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "e46fd22c-b48d-45b6-beb8-4618dfc32307"
                    },
                    "8c6a2ae6-254e-4c5d-a978-1ce85ccd0711": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "d163537a-328f-4b0d-aa09-fe202d40c6ed",
                            "f92c69d7-ec16-42cc-97e9-10042f853c1a"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "8c6a2ae6-254e-4c5d-a978-1ce85ccd0711"
                    },
                    "bef8b50d-da16-4ed3-9f0b-4744c1b56337": {
                        "center": {
                            "x": 6454.125999204178,
                            "y": -7482.8981071664875
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "bef8b50d-da16-4ed3-9f0b-4744c1b56337"
                    },
                    "edaac992-7927-40e1-9f0c-3c0aab075f73": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "bef8b50d-da16-4ed3-9f0b-4744c1b56337",
                            "d163537a-328f-4b0d-aa09-fe202d40c6ed"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "edaac992-7927-40e1-9f0c-3c0aab075f73"
                    },
                    "fedd8d5e-8db2-4d9a-90c2-4753a967c92c": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "bef8b50d-da16-4ed3-9f0b-4744c1b56337",
                            "ca4b4108-d375-42fd-a954-75b42b1e638f"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "fedd8d5e-8db2-4d9a-90c2-4753a967c92c"
                    },
                    "5730063e-c59d-4773-a4af-5d5f4bbc6022": {
                        "center": {
                            "x": 7424.3454420953385,
                            "y": -7482.8981071664875
                        },
                        "color": null,
                        "parentUid": "c4c97bf5-4bbd-4405-bc75-0bb09e46b23f",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "5730063e-c59d-4773-a4af-5d5f4bbc6022"
                    },
                    "e58d533d-6e90-4679-aadb-d492a1944674": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "5730063e-c59d-4773-a4af-5d5f4bbc6022",
                            "bef8b50d-da16-4ed3-9f0b-4744c1b56337"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "e58d533d-6e90-4679-aadb-d492a1944674"
                    },
                    "0c03f9eb-9f9e-4998-ba2a-bfe8d558845b": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "5730063e-c59d-4773-a4af-5d5f4bbc6022",
                            "535bb450-7d29-4b8f-af56-ddeff61ed370"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "0c03f9eb-9f9e-4998-ba2a-bfe8d558845b"
                    },
                    "8f0b7948-4f11-4f75-86b1-220f39146fd9": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "5730063e-c59d-4773-a4af-5d5f4bbc6022",
                            "430cc668-9b92-4ff0-8504-156e4dfbf7d5"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "8f0b7948-4f11-4f75-86b1-220f39146fd9"
                    }
                },
                "floorHeightM": 19,
                "name": "Level 1",
                "uid": "4f2fa256-73a7-41b5-b584-14a40c36b7f0"
            },
            "2c029ee2-c3f6-49be-bfb0-7215d03f86d2": {
                "abbreviation": "R",
                "entities": {
                    "ae920a4b-184b-4508-9b3b-5ecabc5c76c1": {
                        "parentUid": null,
                        "type": "BACKGROUND_IMAGE",
                        "filename": "Roof [02].pdf",
                        "center": {
                            "x": 21715.52686823901,
                            "y": -1226.3497573018903
                        },
                        "crop": {
                            "x": -34335.55887548557,
                            "y": -18843.922988686427,
                            "w": 55899.01237019617,
                            "h": 31068.0826646985
                        },
                        "offset": {
                            "x": 0,
                            "y": 0
                        },
                        "page": 1,
                        "paperSize": {
                            "name": "Not detected",
                            "widthMM": 840.9121140142518,
                            "heightMM": 594
                        },
                        "pointA": null,
                        "pointB": null,
                        "rotation": 0,
                        "scaleFactor": 1,
                        "scaleName": "1:100",
                        "uid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "totalPages": 1,
                        "key": "39aa765c-b8b1-4f4b-a305-79a4cd934f4e.png"
                    },
                    "c3439528-c948-4a58-aeb5-977e45f8e6d4": {
                        "heightAboveFloorM": 2,
                        "heightMM": 3200,
                        "widthMM": 3200,
                        "inletSystemUid": "cold-water",
                        "inletUid": "7dc7ed3e-1ce2-4b19-b255-547b5a914f36",
                        "outletSystemUid": "cold-water",
                        "outletTemperatureC": null,
                        "outletUid": "3f45ee3d-4bf1-4f3a-9be1-578a056a7a32",
                        "center": {
                            "x": -14818.047502689635,
                            "y": -5602.488827909994
                        },
                        "rightToLeft": false,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "type": "PLANT",
                        "uid": "c3439528-c948-4a58-aeb5-977e45f8e6d4",
                        "name": "Tank",
                        "rotation": 90,
                        "plant": {
                            "type": "TANK",
                            "pressureLoss": {
                                "pressureMethod": "STATIC_PRESSURE",
                                "staticPressureKPA": 20
                            }
                        }
                    },
                    "7dc7ed3e-1ce2-4b19-b255-547b5a914f36": {
                        "center": {
                            "x": -1600,
                            "y": 0
                        },
                        "parentUid": "c3439528-c948-4a58-aeb5-977e45f8e6d4",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "7dc7ed3e-1ce2-4b19-b255-547b5a914f36",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "3f45ee3d-4bf1-4f3a-9be1-578a056a7a32": {
                        "center": {
                            "x": 1600,
                            "y": 0
                        },
                        "parentUid": "c3439528-c948-4a58-aeb5-977e45f8e6d4",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "3f45ee3d-4bf1-4f3a-9be1-578a056a7a32",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "1910d32c-6bc1-4621-a095-14c22b09b9eb": {
                        "heightAboveFloorM": 0.75,
                        "heightMM": 1300,
                        "widthMM": 1300,
                        "inletSystemUid": "cold-water",
                        "inletUid": "1ec0ea04-13c5-44c6-a16b-2e51ce4dc4b3",
                        "outletSystemUid": "cold-water",
                        "outletTemperatureC": null,
                        "outletUid": "f1991223-be7c-4a55-8ed3-81f914447518",
                        "center": {
                            "x": -14825.140013662145,
                            "y": -2993.0647395459855
                        },
                        "rightToLeft": false,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "type": "PLANT",
                        "uid": "1910d32c-6bc1-4621-a095-14c22b09b9eb",
                        "name": "Pump",
                        "rotation": 90,
                        "plant": {
                            "type": "PUMP",
                            "pressureLoss": {
                                "pressureMethod": "PUMP_DUTY",
                                "pumpPressureKPA": 400
                            }
                        }
                    },
                    "1ec0ea04-13c5-44c6-a16b-2e51ce4dc4b3": {
                        "center": {
                            "x": -650,
                            "y": 0
                        },
                        "parentUid": "1910d32c-6bc1-4621-a095-14c22b09b9eb",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "1ec0ea04-13c5-44c6-a16b-2e51ce4dc4b3",
                        "allowAllSystems": false,
                        "configuration": 0
                    },
                    "f1991223-be7c-4a55-8ed3-81f914447518": {
                        "center": {
                            "x": 650,
                            "y": 0
                        },
                        "parentUid": "1910d32c-6bc1-4621-a095-14c22b09b9eb",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "uid": "f1991223-be7c-4a55-8ed3-81f914447518",
                        "allowAllSystems": false,
                        "configuration": 1
                    },
                    "013d1441-9622-4a5a-bf85-4fa7b7b29390": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "3f45ee3d-4bf1-4f3a-9be1-578a056a7a32",
                            "1ec0ea04-13c5-44c6-a16b-2e51ce4dc4b3"
                        ],
                        "heightAboveFloorM": 2,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "013d1441-9622-4a5a-bf85-4fa7b7b29390"
                    },
                    "03376c42-12f6-42dc-820d-a7cfc489936f": {
                        "center": {
                            "x": -14818.047502689635,
                            "y": -10306.687529747574
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "03376c42-12f6-42dc-820d-a7cfc489936f"
                    },
                    "aeae45e2-74a7-4d93-b08e-edfed304a612": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "7dc7ed3e-1ce2-4b19-b255-547b5a914f36",
                            "03376c42-12f6-42dc-820d-a7cfc489936f"
                        ],
                        "heightAboveFloorM": 2,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "aeae45e2-74a7-4d93-b08e-edfed304a612"
                    },
                    "d4de5960-3d52-41bb-bf8e-2a88bcb3b1e6": {
                        "center": {
                            "x": -6866.22644479747,
                            "y": -10306.687529747574
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "d4de5960-3d52-41bb-bf8e-2a88bcb3b1e6"
                    },
                    "c6f685b7-d0f1-4eab-b95f-43bd3f4f6646": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "03376c42-12f6-42dc-820d-a7cfc489936f",
                            "d4de5960-3d52-41bb-bf8e-2a88bcb3b1e6"
                        ],
                        "heightAboveFloorM": 2,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "c6f685b7-d0f1-4eab-b95f-43bd3f4f6646"
                    },
                    "8f4192ac-3226-452d-b8fe-52c183201932": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "d4de5960-3d52-41bb-bf8e-2a88bcb3b1e6",
                            "2edbc5b5-ad0a-4672-873b-00f6cfaf637d"
                        ],
                        "heightAboveFloorM": 2,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "8f4192ac-3226-452d-b8fe-52c183201932"
                    },
                    "5ff71d44-5350-44b0-8406-f67b1ad496c8": {
                        "center": {
                            "x": -14825.140013662145,
                            "y": -2115.048756966822
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "5ff71d44-5350-44b0-8406-f67b1ad496c8"
                    },
                    "451495fc-4243-4acf-b269-9e0808a3f1f2": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "f1991223-be7c-4a55-8ed3-81f914447518",
                            "5ff71d44-5350-44b0-8406-f67b1ad496c8"
                        ],
                        "heightAboveFloorM": 0.75,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "451495fc-4243-4acf-b269-9e0808a3f1f2"
                    },
                    "36e80a31-19e1-4c1b-89b2-f3b4ff6e7f05": {
                        "center": {
                            "x": -12443.790287837324,
                            "y": -2115.048756966822
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "36e80a31-19e1-4c1b-89b2-f3b4ff6e7f05"
                    },
                    "293335e6-4309-4051-b984-605cffadf1b4": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "5ff71d44-5350-44b0-8406-f67b1ad496c8",
                            "36e80a31-19e1-4c1b-89b2-f3b4ff6e7f05"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "293335e6-4309-4051-b984-605cffadf1b4"
                    },
                    "45602dd2-25a3-4fd1-8cd4-8d0c2eaf1ee2": {
                        "center": {
                            "x": -12443.790287837324,
                            "y": -10072.424956167542
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "45602dd2-25a3-4fd1-8cd4-8d0c2eaf1ee2"
                    },
                    "78b3938e-04a7-44f1-ad3d-6bc2166f63b7": {
                        "center": {
                            "x": -6417.218593966691,
                            "y": -10072.424956167542
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "78b3938e-04a7-44f1-ad3d-6bc2166f63b7"
                    },
                    "9f538144-4082-4697-bf66-98742aa5fc45": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "45602dd2-25a3-4fd1-8cd4-8d0c2eaf1ee2",
                            "78b3938e-04a7-44f1-ad3d-6bc2166f63b7"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "9f538144-4082-4697-bf66-98742aa5fc45"
                    },
                    "29a75c2a-035f-4d2e-a9c2-776135d8f4e0": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "78b3938e-04a7-44f1-ad3d-6bc2166f63b7",
                            "924c02c5-e487-453b-b84b-35ef0bc57533"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "29a75c2a-035f-4d2e-a9c2-776135d8f4e0"
                    },
                    "15189a30-a0c1-47d4-a83f-1fc3de7e0b68": {
                        "center": {
                            "x": -12443.790287837324,
                            "y": -7381.335705666268
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "15189a30-a0c1-47d4-a83f-1fc3de7e0b68"
                    },
                    "bde08082-f2fd-4295-b198-7366bdf95b57": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "15189a30-a0c1-47d4-a83f-1fc3de7e0b68",
                            "36e80a31-19e1-4c1b-89b2-f3b4ff6e7f05"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "bde08082-f2fd-4295-b198-7366bdf95b57"
                    },
                    "cef179d9-1814-4798-9cd3-52bab30a749a": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "15189a30-a0c1-47d4-a83f-1fc3de7e0b68",
                            "45602dd2-25a3-4fd1-8cd4-8d0c2eaf1ee2"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "cef179d9-1814-4798-9cd3-52bab30a749a"
                    },
                    "56c975b5-dd15-4982-a888-52a2749f6620": {
                        "center": {
                            "x": 5283.440094316029,
                            "y": -7381.335705666268
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "56c975b5-dd15-4982-a888-52a2749f6620"
                    },
                    "dd872fc5-24f9-484a-95aa-6505646b9ca5": {
                        "center": {
                            "x": 5283.440094316029,
                            "y": -5131.479109590926
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "calculationHeightM": null,
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "dd872fc5-24f9-484a-95aa-6505646b9ca5"
                    },
                    "4e7964fe-7f6d-472a-a7c9-85e2afd9960b": {
                        "node": {
                            "type": 0,
                            "continuousFlowLS": 2.3,
                            "designFlowRateLS": 0,
                            "gasFlowRateMJH": 0,
                            "gasPressureKPA": 0,
                            "loadingUnits": 0,
                            "variant": "CONTINUOUS"
                        },
                        "minPressureKPA": null,
                        "maxPressureKPA": null,
                        "systemUidOption": null,
                        "center": {
                            "x": 7333.1962556159415,
                            "y": -5131.479109590926
                        },
                        "color": null,
                        "calculationHeightM": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "type": "LOAD_NODE",
                        "linkedToUid": null,
                        "uid": "4e7964fe-7f6d-472a-a7c9-85e2afd9960b"
                    },
                    "7a2ad92b-2f90-47a7-977b-db3fd72ff392": {
                        "abbreviation": "H",
                        "center": {
                            "x": 5283.440094316029,
                            "y": -3120.62114808926
                        },
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "type": "FIXTURE",
                        "uid": "7a2ad92b-2f90-47a7-977b-db3fd72ff392",
                        "fixtureUnits": null,
                        "name": "hoseTap",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": -90,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "f330aa97-b46f-402f-8d1d-53c1cfd074c0"
                            }
                        }
                    },
                    "f330aa97-b46f-402f-8d1d-53c1cfd074c0": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "7a2ad92b-2f90-47a7-977b-db3fd72ff392",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "f330aa97-b46f-402f-8d1d-53c1cfd074c0",
                        "configuration": 0
                    },
                    "b3337164-00e0-4d25-a38b-bff4e8dce842": {
                        "center": {
                            "x": 5562.100527175069,
                            "y": -5131.479109590926
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "b16b76a5-f9fe-4813-875a-37e3648cc509",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "b3337164-00e0-4d25-a38b-bff4e8dce842",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "b16b76a5-f9fe-4813-875a-37e3648cc509": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "b3337164-00e0-4d25-a38b-bff4e8dce842",
                            "dd872fc5-24f9-484a-95aa-6505646b9ca5"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "b16b76a5-f9fe-4813-875a-37e3648cc509"
                    },
                    "fcb93af1-1ced-4210-a2ea-4d137b557dae": {
                        "center": {
                            "x": 5283.440094316029,
                            "y": -4859.304146420685
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "8a4d698c-6c75-42e5-ab73-a46d3ee6da61",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "fcb93af1-1ced-4210-a2ea-4d137b557dae",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "8a4d698c-6c75-42e5-ab73-a46d3ee6da61": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "fcb93af1-1ced-4210-a2ea-4d137b557dae",
                            "dd872fc5-24f9-484a-95aa-6505646b9ca5"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "8a4d698c-6c75-42e5-ab73-a46d3ee6da61"
                    },
                    "257c5a66-5d91-407b-917f-ed57484de340": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "fcb93af1-1ced-4210-a2ea-4d137b557dae",
                            "f330aa97-b46f-402f-8d1d-53c1cfd074c0"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "257c5a66-5d91-407b-917f-ed57484de340"
                    },
                    "6b93c705-f8f2-42c5-84b3-da28e99cc1e0": {
                        "center": {
                            "x": 5283.440094316029,
                            "y": -6656.33908011014
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "effa6fef-a59b-47e1-8c12-1b2156637dc9",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "6b93c705-f8f2-42c5-84b3-da28e99cc1e0",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "effa6fef-a59b-47e1-8c12-1b2156637dc9": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "6b93c705-f8f2-42c5-84b3-da28e99cc1e0",
                            "56c975b5-dd15-4982-a888-52a2749f6620"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "effa6fef-a59b-47e1-8c12-1b2156637dc9"
                    },
                    "c1511141-b612-41a5-b98d-e0becb258af0": {
                        "center": {
                            "x": 5283.440094316029,
                            "y": -5791.100037963365
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "2276821c-b9de-4b73-a990-891931598428",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "c1511141-b612-41a5-b98d-e0becb258af0",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "a5f040c6-8daa-48e8-abfd-50d41ffeef73": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "c1511141-b612-41a5-b98d-e0becb258af0",
                            "dd872fc5-24f9-484a-95aa-6505646b9ca5"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "a5f040c6-8daa-48e8-abfd-50d41ffeef73"
                    },
                    "64b30da6-16b5-41f5-b12b-6f02bfadcd52": {
                        "center": {
                            "x": 5283.440094316029,
                            "y": -6370.731210793253
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "0f9a8335-c8da-4ebb-a202-59be9f5673a1",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "64b30da6-16b5-41f5-b12b-6f02bfadcd52",
                        "valve": {
                            "catalogId": "strainer",
                            "type": "STRAINER"
                        }
                    },
                    "422896e7-514e-45e7-b7c5-eb1a4de2d9d9": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "64b30da6-16b5-41f5-b12b-6f02bfadcd52",
                            "6b93c705-f8f2-42c5-84b3-da28e99cc1e0"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "422896e7-514e-45e7-b7c5-eb1a4de2d9d9"
                    },
                    "378bcf35-7764-4980-9687-1d2e7e206f3f": {
                        "center": {
                            "x": 5283.440094316029,
                            "y": -6072.153484844512
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "0f9a8335-c8da-4ebb-a202-59be9f5673a1",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "378bcf35-7764-4980-9687-1d2e7e206f3f",
                        "valve": {
                            "type": "RPZD_DOUBLE_SHARED",
                            "catalogId": "RPZD",
                            "sizeMM": null,
                            "isolateOneWhenCalculatingHeadLoss": true
                        }
                    },
                    "0f9a8335-c8da-4ebb-a202-59be9f5673a1": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "378bcf35-7764-4980-9687-1d2e7e206f3f",
                            "64b30da6-16b5-41f5-b12b-6f02bfadcd52"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "0f9a8335-c8da-4ebb-a202-59be9f5673a1"
                    },
                    "2276821c-b9de-4b73-a990-891931598428": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "378bcf35-7764-4980-9687-1d2e7e206f3f",
                            "c1511141-b612-41a5-b98d-e0becb258af0"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "2276821c-b9de-4b73-a990-891931598428"
                    },
                    "7c71a267-4763-4f5f-b3c8-ce3bd178943a": {
                        "center": {
                            "x": 5870.283653023031,
                            "y": -5131.479109590926
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "00935715-2940-425d-a921-b62713838065",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "7c71a267-4763-4f5f-b3c8-ce3bd178943a",
                        "valve": {
                            "pressureDropKPA": 0.15,
                            "catalogId": "waterMeter",
                            "type": "WATER_METER"
                        }
                    },
                    "00935715-2940-425d-a921-b62713838065": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "7c71a267-4763-4f5f-b3c8-ce3bd178943a",
                            "b3337164-00e0-4d25-a38b-bff4e8dce842"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "00935715-2940-425d-a921-b62713838065"
                    },
                    "0285f100-b49e-4767-a710-98a2413c7679": {
                        "center": {
                            "x": 6180.1183331682805,
                            "y": -5131.479109590926
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "3345701c-8e17-4acb-adc7-cba2948fcb6b",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "0285f100-b49e-4767-a710-98a2413c7679",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "3345701c-8e17-4acb-adc7-cba2948fcb6b": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "0285f100-b49e-4767-a710-98a2413c7679",
                            "7c71a267-4763-4f5f-b3c8-ce3bd178943a"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "3345701c-8e17-4acb-adc7-cba2948fcb6b"
                    },
                    "c3c161f8-11d3-420d-91c3-368429af1692": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "0285f100-b49e-4767-a710-98a2413c7679",
                            "4e7964fe-7f6d-472a-a7c9-85e2afd9960b"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "c3c161f8-11d3-420d-91c3-368429af1692"
                    },
                    "d4f20d83-ab1b-4b22-8392-8f1e45a5d5c2": {
                        "center": {
                            "x": -9908.022369172328,
                            "y": -6977.271008951266
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "dc7a8462-26a3-4e03-a410-26595e0fdb44",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "d4f20d83-ab1b-4b22-8392-8f1e45a5d5c2",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "a102f823-fefa-4c7f-84b3-ecef21e31d33": {
                        "abbreviation": "H",
                        "center": {
                            "x": -1378.5540413615454,
                            "y": -5294.793931231464
                        },
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "type": "FIXTURE",
                        "uid": "a102f823-fefa-4c7f-84b3-ecef21e31d33",
                        "fixtureUnits": null,
                        "name": "hoseTap",
                        "outletAboveFloorM": null,
                        "pipeDistanceMM": 200,
                        "probabilityOfUsagePCT": null,
                        "rotation": 89.99999999998697,
                        "warmTempC": null,
                        "roughInsInOrder": [
                            "cold-water"
                        ],
                        "roughIns": {
                            "cold-water": {
                                "continuousFlowLS": null,
                                "designFlowRateLS": null,
                                "loadingUnits": null,
                                "maxPressureKPA": null,
                                "minPressureKPA": null,
                                "allowAllSystems": false,
                                "uid": "e0b2b4bc-01e6-483b-a2c4-b3bd428b64f3"
                            }
                        }
                    },
                    "e0b2b4bc-01e6-483b-a2c4-b3bd428b64f3": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "parentUid": "a102f823-fefa-4c7f-84b3-ecef21e31d33",
                        "type": "SYSTEM_NODE",
                        "calculationHeightM": null,
                        "allowAllSystems": false,
                        "systemUid": "cold-water",
                        "uid": "e0b2b4bc-01e6-483b-a2c4-b3bd428b64f3",
                        "configuration": 0
                    },
                    "8cc3686f-d1a4-43ba-a85d-f2641a10e91a": {
                        "center": {
                            "x": -1378.5540413615454,
                            "y": -7387.103592377216
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "8cc3686f-d1a4-43ba-a85d-f2641a10e91a"
                    },
                    "908eecb3-81d1-4fa5-9f81-b68df4c23683": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "8cc3686f-d1a4-43ba-a85d-f2641a10e91a",
                            "56c975b5-dd15-4982-a888-52a2749f6620"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "908eecb3-81d1-4fa5-9f81-b68df4c23683"
                    },
                    "b9a6551e-6f10-4686-8a85-3d4572309038": {
                        "center": {
                            "x": -9908.075378940088,
                            "y": -7382.657477384466
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "b9a6551e-6f10-4686-8a85-3d4572309038"
                    },
                    "1e939ac4-f928-46e3-83c6-5bc41a88a82a": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "b9a6551e-6f10-4686-8a85-3d4572309038",
                            "8cc3686f-d1a4-43ba-a85d-f2641a10e91a"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "1e939ac4-f928-46e3-83c6-5bc41a88a82a"
                    },
                    "55e61388-702b-4198-bfe4-a3f6da0a51f1": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "b9a6551e-6f10-4686-8a85-3d4572309038",
                            "15189a30-a0c1-47d4-a83f-1fc3de7e0b68"
                        ],
                        "heightAboveFloorM": 2.499999999999999,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "55e61388-702b-4198-bfe4-a3f6da0a51f1"
                    },
                    "dc7a8462-26a3-4e03-a410-26595e0fdb44": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "d4f20d83-ab1b-4b22-8392-8f1e45a5d5c2",
                            "b9a6551e-6f10-4686-8a85-3d4572309038"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "dc7a8462-26a3-4e03-a410-26595e0fdb44"
                    },
                    "1fd2f761-3e48-4287-9fd5-4bb5511cf8e6": {
                        "node": {
                            "type": 0,
                            "continuousFlowLS": 0,
                            "designFlowRateLS": 0,
                            "gasFlowRateMJH": 0,
                            "gasPressureKPA": 0,
                            "loadingUnits": 5,
                            "variant": "FIXTURE"
                        },
                        "minPressureKPA": null,
                        "maxPressureKPA": null,
                        "systemUidOption": null,
                        "center": {
                            "x": -7675.7612257799665,
                            "y": -4925.386686295322
                        },
                        "color": null,
                        "calculationHeightM": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "type": "LOAD_NODE",
                        "linkedToUid": null,
                        "uid": "1fd2f761-3e48-4287-9fd5-4bb5511cf8e6"
                    },
                    "8ed6f249-f79d-4df1-b2a1-0797ee56a760": {
                        "center": {
                            "x": -9908.608850149103,
                            "y": -4925.386686295322
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "systemUid": "cold-water",
                        "calculationHeightM": null,
                        "type": "FITTING",
                        "uid": "8ed6f249-f79d-4df1-b2a1-0797ee56a760"
                    },
                    "f00ea431-0bf8-44cd-98bc-80f4f93d620c": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "8ed6f249-f79d-4df1-b2a1-0797ee56a760",
                            "d4f20d83-ab1b-4b22-8392-8f1e45a5d5c2"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "f00ea431-0bf8-44cd-98bc-80f4f93d620c"
                    },
                    "77bfe2f6-8af6-4685-92bb-f55b6f37e8b5": {
                        "color": null,
                        "diameterMM": null,
                        "lengthM": null,
                        "endpointUid": [
                            "1fd2f761-3e48-4287-9fd5-4bb5511cf8e6",
                            "8ed6f249-f79d-4df1-b2a1-0797ee56a760"
                        ],
                        "heightAboveFloorM": 1,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "77bfe2f6-8af6-4685-92bb-f55b6f37e8b5"
                    },
                    "e901791d-bf8c-43be-98ec-b2f2c6202013": {
                        "center": {
                            "x": -1378.5540413615454,
                            "y": -7060.4285405495975
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "sourceUid": "d5a32b55-a118-4fcd-8486-bf0ea510478d",
                        "systemUidOption": null,
                        "type": "DIRECTED_VALVE",
                        "calculationHeightM": null,
                        "uid": "e901791d-bf8c-43be-98ec-b2f2c6202013",
                        "valve": {
                            "isClosed": false,
                            "catalogId": "ballValve",
                            "makeIsolationCaseOnRingMains": true,
                            "type": "ISOLATION_VALVE"
                        }
                    },
                    "d5a32b55-a118-4fcd-8486-bf0ea510478d": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "e901791d-bf8c-43be-98ec-b2f2c6202013",
                            "e0b2b4bc-01e6-483b-a2c4-b3bd428b64f3"
                        ],
                        "heightAboveFloorM": 0.5,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "d5a32b55-a118-4fcd-8486-bf0ea510478d"
                    },
                    "37553116-8f6a-489f-b2ec-f462da982fff": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "e901791d-bf8c-43be-98ec-b2f2c6202013",
                            "8cc3686f-d1a4-43ba-a85d-f2641a10e91a"
                        ],
                        "heightAboveFloorM": 0.5,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "cold-water",
                        "network": "RETICULATIONS",
                        "type": "PIPE",
                        "uid": "37553116-8f6a-489f-b2ec-f462da982fff"
                    },
                    "513c5868-f528-419f-a2ca-56b539fbdc0a": {
                        "calculationHeightM": null,
                        "center": {
                            "x": -9909.381898041776,
                            "y": -2220.7723604275157
                        },
                        "color": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "systemUid": "cold-water",
                        "type": "FITTING",
                        "uid": "513c5868-f528-419f-a2ca-56b539fbdc0a"
                    },
                    "6fffdfe4-9042-4817-b785-e5026bd681dd": {
                        "node": {
                            "type": 0,
                            "continuousFlowLS": 10,
                            "designFlowRateLS": 0,
                            "gasFlowRateMJH": 0,
                            "gasPressureKPA": 0,
                            "loadingUnits": 0,
                            "variant": "CONTINUOUS"
                        },
                        "minPressureKPA": 250,
                        "maxPressureKPA": 1100,
                        "systemUidOption": null,
                        "center": {
                            "x": 3678.183709259618,
                            "y": 7550.891736265294
                        },
                        "color": null,
                        "calculationHeightM": null,
                        "parentUid": "ae920a4b-184b-4508-9b3b-5ecabc5c76c1",
                        "type": "LOAD_NODE",
                        "linkedToUid": null,
                        "uid": "6fffdfe4-9042-4817-b785-e5026bd681dd"
                    },
                    "58b5e7a4-bbb3-49bf-b44f-3fe4b7069517": {
                        "color": null,
                        "diameterMM": null,
                        "endpointUid": [
                            "ff868cde-03df-486e-8f7b-6779378386aa",
                            "6fffdfe4-9042-4817-b785-e5026bd681dd"
                        ],
                        "heightAboveFloorM": 1,
                        "lengthM": null,
                        "material": null,
                        "maximumVelocityMS": null,
                        "parentUid": null,
                        "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                        "network": "CONNECTIONS",
                        "type": "PIPE",
                        "uid": "58b5e7a4-bbb3-49bf-b44f-3fe4b7069517"
                    }
                },
                "floorHeightM": 22,
                "name": "Roof",
                "uid": "2c029ee2-c3f6-49be-bfb0-7215d03f86d2"
            }
        },
        "shared": {
            "2edbc5b5-ad0a-4672-873b-00f6cfaf637d": {
                "bottomHeightM": null,
                "topHeightM": null,
                "center": {
                    "x": 14849.300423441538,
                    "y": -11930.406394121754
                },
                "color": null,
                "material": null,
                "maximumVelocityMS": null,
                "calculationHeightM": null,
                "parentUid": null,
                "diameterMM": null,
                "systemUid": "cold-water",
                "temperatureC": null,
                "type": "RISER",
                "uid": "2edbc5b5-ad0a-4672-873b-00f6cfaf637d"
            },
            "924c02c5-e487-453b-b84b-35ef0bc57533": {
                "bottomHeightM": null,
                "topHeightM": null,
                "center": {
                    "x": 15298.308274272318,
                    "y": -11926.05887419947
                },
                "color": null,
                "material": null,
                "maximumVelocityMS": null,
                "calculationHeightM": null,
                "parentUid": null,
                "diameterMM": null,
                "systemUid": "cold-water",
                "temperatureC": null,
                "type": "RISER",
                "uid": "924c02c5-e487-453b-b84b-35ef0bc57533"
            },
            "e4d947f4-572c-4b64-974c-834ccd734e8b": {
                "bottomHeightM": null,
                "topHeightM": 21.9,
                "center": {
                    "x": 16245.142365141954,
                    "y": -11926.544618743585
                },
                "color": {
                    "hex": "#6D0FBB",
                    "hsl": {
                        "h": 272.94117647058823,
                        "s": 0.8518,
                        "l": 0.3961,
                        "a": 0.45
                    },
                    "hex8": "#6D0FBB73",
                    "rgba": {
                        "r": 109,
                        "g": 15,
                        "b": 187,
                        "a": 0.45
                    },
                    "hsv": {
                        "h": 272.94117647058823,
                        "s": 0.9199697591532563,
                        "v": 0.7334979800000001,
                        "a": 0.45
                    },
                    "oldHue": 272.94117647058823,
                    "source": "rgba",
                    "a": 0.45
                },
                "material": null,
                "maximumVelocityMS": null,
                "calculationHeightM": null,
                "parentUid": null,
                "diameterMM": null,
                "systemUid": "hot-water",
                "temperatureC": null,
                "type": "RISER",
                "uid": "e4d947f4-572c-4b64-974c-834ccd734e8b"
            },
            "99a0b1d3-6376-412c-b5d0-f0e2df4d7a3d": {
                "bottomHeightM": null,
                "topHeightM": 21.9,
                "center": {
                    "x": 15791.30124984478,
                    "y": -11930.892138665868
                },
                "color": null,
                "material": null,
                "maximumVelocityMS": null,
                "calculationHeightM": null,
                "parentUid": null,
                "diameterMM": null,
                "systemUid": "hot-water",
                "temperatureC": null,
                "type": "RISER",
                "uid": "99a0b1d3-6376-412c-b5d0-f0e2df4d7a3d"
            },
            "ff868cde-03df-486e-8f7b-6779378386aa": {
                "bottomHeightM": null,
                "topHeightM": null,
                "center": {
                    "x": 25492.551370782185,
                    "y": 6673.977252251281
                },
                "color": null,
                "material": null,
                "maximumVelocityMS": null,
                "calculationHeightM": null,
                "parentUid": null,
                "diameterMM": null,
                "systemUid": "68193261-fff6-4842-8573-b1872dedbd86",
                "temperatureC": null,
                "type": "RISER",
                "uid": "ff868cde-03df-486e-8f7b-6779378386aa"
            }
        }
    },
    "inverse": {
        "metadata": {
            "generalInfo": {
                "title": "Untitled",
                "projectNumber": "",
                "projectStage": "",
                "designer": "",
                "reviewed": "",
                "approved": "",
                "client": "",
                "description": ""
            },
            "flowSystems": [
                {
                    "name": "Cold Water",
                    "temperature": 20,
                    "color": {
                        "hex": "#009CE0"
                    },
                    "uid": "cold-water",
                    "fluid": "water",
                    "hasReturnSystem": false,
                    "returnIsInsulated": false,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.5,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.5,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 16
                        }
                    }
                },
                {
                    "name": "Hot Water",
                    "temperature": 65,
                    "color": {
                        "hex": "#F44E3B"
                    },
                    "uid": "hot-water",
                    "fluid": "water",
                    "hasReturnSystem": true,
                    "returnIsInsulated": true,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 16
                        }
                    }
                },
                {
                    "name": "Warm Water",
                    "temperature": 50,
                    "color": {
                        "hex": "#F49000"
                    },
                    "uid": "warm-water",
                    "fluid": "water",
                    "hasReturnSystem": false,
                    "returnIsInsulated": false,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 1.2,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 16
                        }
                    }
                },
                {
                    "name": "Gas",
                    "temperature": 20,
                    "color": {
                        "hex": "#FCDC00"
                    },
                    "uid": "gas",
                    "fluid": "naturalGas",
                    "hasReturnSystem": false,
                    "returnIsInsulated": false,
                    "returnMaxVelocityMS": 1,
                    "insulationMaterial": "mmKemblaInsulation",
                    "insulationJacket": "allServiceJacket",
                    "insulationThicknessMM": 25,
                    "networks": {
                        "RISERS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 20,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "RETICULATIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 20,
                            "material": "copperTypeB",
                            "minimumPipeSize": 15
                        },
                        "CONNECTIONS": {
                            "spareCapacityPCT": 0,
                            "velocityMS": 3,
                            "material": "pexSdr74",
                            "minimumPipeSize": 16
                        }
                    }
                }
            ],
            "availableFixtures": [
                "basin",
                "bath",
                "shower",
                "kitchenSink",
                "wc",
                "washingMachine",
                "laundryTrough"
            ]
        },
        "levels": {
            "ground": {
                "entities": {
                    "883c8bcd-a994-4c3e-82ec-748f683e2cba": {
                        "deleted": true
                    },
                    "7c470d70-8f12-4bff-8ebb-862fc84870c2": {
                        "deleted": true
                    },
                    "f261b766-9a0f-42da-bc73-1549eff202c7": {
                        "deleted": true
                    },
                    "3b95a13b-be67-4cb1-8169-c50da9489473": {
                        "deleted": true
                    },
                    "0de28125-ac31-42ad-9068-a1cd0a8665a4": {
                        "deleted": true
                    },
                    "7fbbf586-f8a8-471c-800d-1aaebd137202": {
                        "deleted": true
                    },
                    "aaaa60b4-1c5a-4efb-a6a2-d0f6ec524324": {
                        "deleted": true
                    },
                    "364dd4c8-8055-46f6-a272-f16aecfbd2b3": {
                        "deleted": true
                    },
                    "2256c697-fde5-410a-a739-66a0aedef169": {
                        "deleted": true
                    },
                    "ff4868ed-f939-4126-b193-d35d7de35b3b": {
                        "deleted": true
                    },
                    "e9fa6226-96fd-44cb-9227-d0a6ac813f58": {
                        "deleted": true
                    },
                    "dc770adf-458c-43bd-86f8-bccd584987a5": {
                        "deleted": true
                    },
                    "f82dc441-0fe1-4133-9239-65ee0a34cdcf": {
                        "deleted": true
                    },
                    "3e560b7c-ca24-4838-8d1a-1b9b4a7ba315": {
                        "deleted": true
                    },
                    "12380a89-1229-4da6-bd08-cc6df6cbc00d": {
                        "deleted": true
                    },
                    "c7d42acd-3585-433f-a466-7c4a205cb51c": {
                        "deleted": true
                    },
                    "fc792b4b-06d4-42b5-ab2a-8075e79bc1e5": {
                        "deleted": true
                    },
                    "17f9fff1-96fc-4117-9cd9-9ffb771413fa": {
                        "deleted": true
                    },
                    "e667efcc-0acd-498e-90db-8d382787f959": {
                        "deleted": true
                    },
                    "9cba9e81-3781-4d30-8f1f-34d257edb52c": {
                        "deleted": true
                    },
                    "bbec31c6-2b73-496e-820d-9511aea525c0": {
                        "deleted": true
                    },
                    "ce426e18-4530-4c9e-91c7-ded4000ce863": {
                        "deleted": true
                    },
                    "c3fc0aab-5bc4-46c4-8bac-5cea5d3515f3": {
                        "deleted": true
                    },
                    "f9e70a31-4312-4147-9396-3b0d5dae570b": {
                        "deleted": true
                    },
                    "2c1a4c3e-4ee1-4797-8743-a36c5f93c4dc": {
                        "deleted": true
                    },
                    "b5b10a68-c711-4547-a0f0-373c8f0f4064": {
                        "deleted": true
                    },
                    "7233a08f-e43d-43c6-a76e-0cab9bd0a3b1": {
                        "deleted": true
                    },
                    "3d0f731c-1cb3-40a2-aaec-16f9550c7ce0": {
                        "deleted": true
                    },
                    "cbce59c7-3410-48d8-aee7-48b09e83825f": {
                        "deleted": true
                    },
                    "0ef1cd13-8edd-4924-9524-172e0544adff": {
                        "deleted": true
                    },
                    "05508f9b-0021-42ab-925f-da2948d28bad": {
                        "deleted": true
                    },
                    "95e7994c-f12a-4568-887a-ec1f6cd6dd0e": {
                        "deleted": true
                    },
                    "5fecb1dc-dbf6-426b-80e7-5689e3d130de": {
                        "deleted": true
                    },
                    "0970f36f-37f7-4d85-a170-f2793d973220": {
                        "deleted": true
                    },
                    "ba4dfe8a-c9c4-45f3-b877-ec821d02df0d": {
                        "deleted": true
                    },
                    "d758a8a9-fb2d-42c0-acfe-da29b9a7f1a3": {
                        "deleted": true
                    },
                    "8b9f3752-7c68-4dd3-9335-6f1412cf9fa1": {
                        "deleted": true
                    },
                    "1af9ade6-5d66-447a-8ce6-d306d6f81acc": {
                        "deleted": true
                    },
                    "d77f15e7-f357-4654-9171-e0475214c039": {
                        "deleted": true
                    },
                    "fccd1ab3-74f6-4124-92f1-74285c95b7ff": {
                        "deleted": true
                    },
                    "5fbd1bee-c424-49be-b431-827df90213cb": {
                        "deleted": true
                    },
                    "6da87f0b-a0d6-4ffd-9b9d-f43085a1d3cf": {
                        "deleted": true
                    },
                    "628550de-688d-448b-84fe-2216624fd7e8": {
                        "deleted": true
                    },
                    "a9e8520b-06e1-4980-84c1-19d24268e6fa": {
                        "deleted": true
                    },
                    "d7e506f1-a091-403d-863a-17c9d168dff1": {
                        "deleted": true
                    },
                    "627bc9c8-db1a-4672-b201-a721ee7dd3b2": {
                        "deleted": true
                    },
                    "0fe31025-c2cf-4f38-8389-4fa8b77ee2b7": {
                        "deleted": true
                    },
                    "1fc01957-88c7-4e61-bb94-68b168d894bc": {
                        "deleted": true
                    },
                    "240a17fd-96b2-4c0b-aa0e-738bc2a7f7e7": {
                        "deleted": true
                    },
                    "a767951a-92b2-48f0-b232-636cb835c63f": {
                        "deleted": true
                    },
                    "665216c0-a433-482a-a342-60ecf784c607": {
                        "deleted": true
                    },
                    "833c44c7-b496-47cc-86fb-0f7dd7584530": {
                        "deleted": true
                    },
                    "37383e57-4532-43ff-926a-97d6d7d1852b": {
                        "deleted": true
                    },
                    "a7b98059-ba88-47ad-80b1-99ef42223a90": {
                        "deleted": true
                    },
                    "915869ff-0032-4930-b450-752514265dcc": {
                        "deleted": true
                    },
                    "657087b7-9d13-44b0-b588-a2367458e63e": {
                        "deleted": true
                    },
                    "819a968e-ca9a-47af-8190-7d29cba41186": {
                        "deleted": true
                    },
                    "ca3191c2-30fc-4fda-ba67-593967d730f2": {
                        "deleted": true
                    },
                    "8bba8008-bdbe-43c5-b743-17c62486f82b": {
                        "deleted": true
                    },
                    "bfe6fd08-9f94-4e3e-a0e2-f0b826e5d7f4": {
                        "deleted": true
                    },
                    "3b310fc7-89df-486d-a090-2b29d992c2cd": {
                        "deleted": true
                    },
                    "f9cd11ca-67c2-441c-9c24-0a62b5b96553": {
                        "deleted": true
                    },
                    "7fc26b71-0c14-4c31-b16a-f273bc82806d": {
                        "deleted": true
                    },
                    "dd0fc813-2b9a-42d1-b4be-cede08cf9d02": {
                        "deleted": true
                    },
                    "1586428e-ec42-4c44-b168-4831dad7d472": {
                        "deleted": true
                    },
                    "e7ce25ef-5ec4-43ad-bee4-bc92444d021f": {
                        "deleted": true
                    },
                    "f639f562-fce4-4e56-a415-126f14fccd3d": {
                        "deleted": true
                    },
                    "eed2f33e-9070-4bbf-87b8-9e4b16ac4c12": {
                        "deleted": true
                    },
                    "1eb0c5cb-0167-4708-b9e8-dbb1986555a8": {
                        "deleted": true
                    },
                    "8d90950d-e57e-4b2d-93e4-9a921a99c7f9": {
                        "deleted": true
                    },
                    "3f35d949-5de1-480d-a943-6072911f0833": {
                        "deleted": true
                    },
                    "90f4f467-720d-42bc-a100-d11ee15576f7": {
                        "deleted": true
                    },
                    "e695eb80-9fca-4d11-b0fb-693a38425156": {
                        "deleted": true
                    },
                    "cc48c2fa-27c4-4f40-8a8c-a8c20f14c2b7": {
                        "deleted": true
                    },
                    "3e0ab0bb-c812-4ad4-b45f-1587ff8ef1e5": {
                        "deleted": true
                    },
                    "acf2bf43-fdef-47be-898c-336a94b21532": {
                        "deleted": true
                    },
                    "2de6de8f-7f1c-48cf-b33a-c72cb137c97a": {
                        "deleted": true
                    },
                    "ed3d0b8f-807e-49e5-829a-2661a57bbe26": {
                        "deleted": true
                    },
                    "737ebdc9-2b9d-48d8-b5b7-879f1e288807": {
                        "deleted": true
                    },
                    "84224f8e-1a1a-4b38-afd2-27051d823f42": {
                        "deleted": true
                    },
                    "e8e42631-5f02-40c8-81ec-b91263d11c65": {
                        "deleted": true
                    },
                    "7dc77696-9eef-4b06-8055-182fe1f91ced": {
                        "deleted": true
                    },
                    "70114ca3-57f4-43f9-b50a-acbad407746e": {
                        "deleted": true
                    },
                    "b0aa1ed2-f912-4dfe-b38b-08373d8d289f": {
                        "deleted": true
                    },
                    "6dbf712e-b559-475c-8261-3cbd3358224a": {
                        "deleted": true
                    },
                    "53377ac8-f78c-4b37-91fd-01f675b39306": {
                        "deleted": true
                    },
                    "9f1e2533-6df7-470c-86d9-ad430e69fea3": {
                        "deleted": true
                    },
                    "bd0f4202-1611-4480-b368-bd7564c74e41": {
                        "deleted": true
                    },
                    "28fc3636-9157-475b-b043-373d48517ba9": {
                        "deleted": true
                    },
                    "48a798b7-b385-4bcd-a46b-bc946b19acaf": {
                        "deleted": true
                    },
                    "3fad7c47-d46f-4dd1-9b27-fa23fdd4c9ab": {
                        "deleted": true
                    },
                    "0cf9f0d7-c186-45fb-b9b7-334c96402763": {
                        "deleted": true
                    },
                    "8e7a552a-dff4-4bd2-99d1-2f91fd88efba": {
                        "deleted": true
                    },
                    "567e0514-e592-4118-b8a0-9014217243ce": {
                        "deleted": true
                    },
                    "cc4d406e-6e24-4f32-be60-afcd3ce32c3b": {
                        "deleted": true
                    },
                    "111bcdb1-cca6-4788-89d0-7e42c9ad093e": {
                        "deleted": true
                    },
                    "a7487a8f-7c10-4e08-89cf-e09f44f5f882": {
                        "deleted": true
                    },
                    "b31720eb-b6ea-48b9-af4f-ebe339349f57": {
                        "deleted": true
                    },
                    "efab15ca-bdff-472d-9f57-ebd207c68c0a": {
                        "deleted": true
                    },
                    "bc781ba3-ce62-4c48-931d-a4d7d0e03a57": {
                        "deleted": true
                    },
                    "ba1354f1-966c-4958-9b86-c8c55c3fd153": {
                        "deleted": true
                    },
                    "5544178e-b56b-4539-9f51-1f75a6623216": {
                        "deleted": true
                    },
                    "922241b7-caf0-40b9-9470-3d98348ae2c5": {
                        "deleted": true
                    },
                    "0b294582-49ca-4a5a-9b41-055243261d69": {
                        "deleted": true
                    },
                    "dba23c2f-734e-4c9b-9313-51b2f0df9cd1": {
                        "deleted": true
                    },
                    "b483f932-a45b-44b4-b5cb-60fa94eea124": {
                        "deleted": true
                    },
                    "a1f5787d-a28c-4347-bcc4-f82ae046c888": {
                        "deleted": true
                    },
                    "3a1b05fa-6011-4201-ab1c-ab4470127882": {
                        "deleted": true
                    },
                    "64a6041b-0f91-4bbe-94bd-6ca5b05d9e4e": {
                        "deleted": true
                    },
                    "19781734-62aa-498d-b557-01ff20d8f129": {
                        "deleted": true
                    },
                    "af99942d-31e7-4bf3-9f37-ff35cc7296a0": {
                        "deleted": true
                    },
                    "b6a80b2e-e3ec-4e35-88ae-887484b5cab3": {
                        "deleted": true
                    },
                    "521109a9-16fb-4678-9790-6216499cd3c9": {
                        "deleted": true
                    },
                    "c9c064bd-0f9a-45ca-b37a-70089611df31": {
                        "deleted": true
                    },
                    "19ba80b3-d32e-45c9-b85d-73877965ed94": {
                        "deleted": true
                    },
                    "baaaedef-1b2e-4aec-bb7e-bfdf0d253e3a": {
                        "deleted": true
                    },
                    "63bf0478-382f-4452-89b4-e48a1b084aeb": {
                        "deleted": true
                    },
                    "293b3dfe-d776-459d-a545-766a3fe43bde": {
                        "deleted": true
                    },
                    "ca1e977c-3058-40e0-8bad-bf5d2d7f525d": {
                        "deleted": true
                    },
                    "a98a8a70-1ff7-4b82-9068-ba7062556645": {
                        "deleted": true
                    },
                    "40a26730-d139-464c-9f38-a131198d45bb": {
                        "deleted": true
                    },
                    "1abd1b9f-54f3-4ea5-b4f7-6ac705b3db38": {
                        "deleted": true
                    },
                    "fb24da9c-72de-4081-801d-9cde682e47cc": {
                        "deleted": true
                    },
                    "cb5362a0-93b2-461d-ad88-d5fe881b40f6": {
                        "deleted": true
                    },
                    "745bb69c-7099-4adf-84e8-4f5902bab351": {
                        "deleted": true
                    },
                    "a70ce7b1-b32c-40e4-9b98-a61253b7ccc8": {
                        "deleted": true
                    },
                    "f0c2fa12-057b-4e67-8a61-dc93be1ef783": {
                        "deleted": true
                    },
                    "43f9fd0b-8aa2-4726-900c-c0529cdb98cf": {
                        "deleted": true
                    },
                    "7f84f89c-a5e6-4829-839b-73233475b8bf": {
                        "deleted": true
                    },
                    "c9f8f59e-553a-4cb4-a566-528bc8c6b1c6": {
                        "deleted": true
                    },
                    "91c742b2-47ed-4cb3-85a5-d5a96ce71e04": {
                        "deleted": true
                    },
                    "e66f6c38-19bf-43dd-a2a9-f64f66f1a1e6": {
                        "deleted": true
                    },
                    "834a601f-64ce-4b9d-9080-71c68858b706": {
                        "deleted": true
                    },
                    "d09f2c55-22e8-4d01-b298-4785bc2b499b": {
                        "deleted": true
                    },
                    "89880949-3d8a-4419-bd83-2cb052786f12": {
                        "deleted": true
                    },
                    "f17aae19-cbd9-4da2-89a6-32f33b1a2945": {
                        "deleted": true
                    },
                    "115ea465-c2a5-4c2f-b994-e620b35b1f24": {
                        "deleted": true
                    },
                    "1a4a2572-b2e9-4e6b-9024-792f37951223": {
                        "deleted": true
                    },
                    "f8660599-635d-4970-b767-018182d97a95": {
                        "deleted": true
                    },
                    "c011670e-58d9-4f70-8c51-0d9913bc8510": {
                        "deleted": true
                    },
                    "011f6a2d-8a7b-4eef-bfab-f88d0fea3200": {
                        "deleted": true
                    },
                    "212f1abb-a4f6-4c10-b43a-5c5d16c4918a": {
                        "deleted": true
                    },
                    "627c5c28-aebb-44af-bacc-93ebf4f97b4a": {
                        "deleted": true
                    },
                    "14c49950-87cb-4f3d-b030-ab5886978be8": {
                        "deleted": true
                    },
                    "1add8f24-28e9-4dd5-8976-22a31e8c7fd4": {
                        "deleted": true
                    },
                    "93a2a70e-bbb8-4ace-a108-0ba023b3fa03": {
                        "deleted": true
                    },
                    "134dba28-aead-4155-b22f-bcd923caaf01": {
                        "deleted": true
                    },
                    "09747444-adc5-43e9-92b9-3189f6c162b9": {
                        "deleted": true
                    },
                    "2c231c4a-47ba-49ec-9c75-8c5acf5d0d3f": {
                        "deleted": true
                    },
                    "3aa6fbb0-047e-4549-ae72-80d04ddf2140": {
                        "deleted": true
                    },
                    "ac11ec5b-e372-4013-be18-0284f8bbdd86": {
                        "deleted": true
                    },
                    "00597d49-e54e-4cfd-88cb-e1101ab84a5a": {
                        "deleted": true
                    },
                    "9a865e0f-a41c-49d4-b070-95e322ed2d32": {
                        "deleted": true
                    },
                    "255dd2b3-1bd1-466d-9606-da9e21682919": {
                        "deleted": true
                    },
                    "331c3b5a-429b-4ff2-8895-f69e3386d52c": {
                        "deleted": true
                    },
                    "2692ede2-caf8-49f3-b1d3-21044a3665b4": {
                        "deleted": true
                    },
                    "ec497a01-b28e-4250-b71d-d7e75866e30a": {
                        "deleted": true
                    },
                    "0282db5d-7fe4-4346-8cc6-ae442bed25f2": {
                        "deleted": true
                    },
                    "6ff16f08-0c91-4eb3-8420-52023077f486": {
                        "deleted": true
                    },
                    "72401ade-3746-41f4-99e3-33328f6593ee": {
                        "deleted": true
                    },
                    "eba8b4d3-f4ff-4d05-be54-018ef7ddf399": {
                        "deleted": true
                    },
                    "5afb198e-ff45-4f38-beaf-46b355f38f0f": {
                        "deleted": true
                    },
                    "f2332b05-452d-427b-8097-e3064673588b": {
                        "deleted": true
                    },
                    "085c8a13-a903-4b1c-bdb2-9d674760a01e": {
                        "deleted": true
                    },
                    "dbb36114-cc24-493e-937b-afb7a161199f": {
                        "deleted": true
                    },
                    "69fc92bd-8145-4ce8-ae54-e9a659a21f69": {
                        "deleted": true
                    },
                    "0b010ce9-c661-4f58-9be1-2794200e98f9": {
                        "deleted": true
                    },
                    "9ca462cd-a4fc-43cd-8d07-e19acd99c64b": {
                        "deleted": true
                    },
                    "79bc6cb7-fb79-421d-9fd1-2eb7107bdcf3": {
                        "deleted": true
                    },
                    "90a33554-7014-4a06-ae79-99cc54662d0f": {
                        "deleted": true
                    },
                    "9f4c6aa4-bee0-4d90-9f30-e173157157e0": {
                        "deleted": true
                    },
                    "f2a7f764-fc6c-45f3-bea0-5fb4654b48fe": {
                        "deleted": true
                    },
                    "0dae8258-b6c0-47c0-bed1-e76424d25d73": {
                        "deleted": true
                    },
                    "31d7d662-8bd9-4e4f-92c4-ab20126aad2c": {
                        "deleted": true
                    },
                    "e937dac1-e26c-486b-a77f-bd7847675080": {
                        "deleted": true
                    },
                    "c5955f66-dc50-4788-8f19-f4aea5b0c8f4": {
                        "deleted": true
                    },
                    "dcf69b4d-2b24-4503-8e1d-3d859cc3acf3": {
                        "deleted": true
                    },
                    "166cb028-2079-4e58-8ee7-ef96d7574b5b": {
                        "deleted": true
                    },
                    "ac1a7d2d-7d39-4035-bb93-b7c5eff68829": {
                        "deleted": true
                    },
                    "dbca6c7e-2cc0-4e1c-a308-6e9bcefcd35a": {
                        "deleted": true
                    },
                    "c6d2999d-b180-40a3-8524-fa371c5381e7": {
                        "deleted": true
                    },
                    "92c1f143-2b99-49e5-ac3f-3338a6c3fb96": {
                        "deleted": true
                    },
                    "c710ee6a-2a33-47c8-9b33-8d4f55dd14b3": {
                        "deleted": true
                    },
                    "52cd4e6a-39d4-4dd8-8861-e59b3d59764c": {
                        "deleted": true
                    },
                    "47ed2f13-757c-4583-b431-00c7f7546d57": {
                        "deleted": true
                    },
                    "d3e35d00-8e6d-45ca-913a-05229d842ce7": {
                        "deleted": true
                    },
                    "903e5aca-6760-4490-bcaa-0d5f498fc0e0": {
                        "deleted": true
                    },
                    "a4604ecc-fbf5-4f7d-b915-bf55b56a9e51": {
                        "deleted": true
                    },
                    "1c5511e8-c716-47d6-acec-3d818d7d9845": {
                        "deleted": true
                    },
                    "393afcb5-5da2-4d3c-a72d-64f178919da3": {
                        "deleted": true
                    },
                    "90b33585-43ef-4bb1-96bf-c031ed5fa76b": {
                        "deleted": true
                    },
                    "e35b5e84-27e2-48e8-8517-2da155d8b2d0": {
                        "deleted": true
                    },
                    "dcbe3bbd-4821-4adf-ace1-de221df6c9f1": {
                        "deleted": true
                    },
                    "bc237f14-bc88-4065-b987-6cad571683f1": {
                        "deleted": true
                    },
                    "ac0e6a14-46d0-4138-a886-314cbb122864": {
                        "deleted": true
                    },
                    "896c9ffa-de90-4e22-9af1-6b9125c469f3": {
                        "deleted": true
                    },
                    "dadb6bd8-139a-4703-ab4c-9902d5962433": {
                        "deleted": true
                    },
                    "9134b038-e169-4d0f-ad44-848cbf5e240a": {
                        "deleted": true
                    },
                    "2f513a20-49ca-45e6-a772-d5984ca54cdc": {
                        "deleted": true
                    },
                    "4e2b47cf-8321-422b-ba74-f68a75500843": {
                        "deleted": true
                    },
                    "79fdf5cb-fe9a-4912-b12b-c4b903157168": {
                        "deleted": true
                    },
                    "00e36d57-d02b-47a2-bb4c-20c390996961": {
                        "deleted": true
                    },
                    "35f3e777-c687-4c4d-8a09-6cb4e6ec66df": {
                        "deleted": true
                    },
                    "7ed19aa4-6d4a-4d5d-b446-b99dab105fb3": {
                        "deleted": true
                    },
                    "61147ba9-764b-4657-9060-78810ccbf4b9": {
                        "deleted": true
                    },
                    "253b3096-f04c-45d0-840e-71c1c37ee2b7": {
                        "deleted": true
                    },
                    "ef3059d2-c7e2-414b-8195-fbaedee768a3": {
                        "deleted": true
                    },
                    "034f6a6e-5056-485e-a2ff-5ddbc86307e7": {
                        "deleted": true
                    },
                    "1e657f8e-4da3-4f6a-9c51-95103ef2d3d7": {
                        "deleted": true
                    },
                    "00c1fc86-a63b-405b-aa75-6dc77134c233": {
                        "deleted": true
                    },
                    "22eec533-43a6-4ea0-95e3-26ef8b3370fe": {
                        "deleted": true
                    },
                    "2bf89f70-27c9-4351-af7b-e8a8a48b4953": {
                        "deleted": true
                    },
                    "32aa24aa-2e00-4df4-8cb2-8b96c8472f35": {
                        "deleted": true
                    },
                    "b1c0c41b-0c8a-4d93-b2d5-7e058494468f": {
                        "deleted": true
                    },
                    "14ac630c-807a-4d9d-9a63-c3eab67eb41f": {
                        "deleted": true
                    },
                    "836c5207-78e7-4258-a47b-dbd4ff5f1b23": {
                        "deleted": true
                    },
                    "2b308343-5268-4cb8-bfd2-c23d9e3afa96": {
                        "deleted": true
                    },
                    "4061e185-80d9-450a-878d-e65e99f9dfa9": {
                        "deleted": true
                    },
                    "9378f75d-b13f-481f-98d0-22f2f10f4505": {
                        "deleted": true
                    },
                    "af9d36d7-94eb-404b-804c-b5534cd9fa8b": {
                        "deleted": true
                    },
                    "70dd8ef9-23db-4a0c-a2c9-ae74e4bdde41": {
                        "deleted": true
                    },
                    "868bd0ce-c56c-440f-b3b8-283ee9226a01": {
                        "deleted": true
                    },
                    "4d1df30f-2355-4c30-b321-4ec36d09a55e": {
                        "deleted": true
                    },
                    "1ab78a48-0fa3-42c0-a7cb-746f4b4def18": {
                        "deleted": true
                    },
                    "c9cb6a8c-fc04-4b2e-87f8-9671bfa392a2": {
                        "deleted": true
                    },
                    "1855d963-5b19-4122-ac07-6cfeaa49ed7e": {
                        "deleted": true
                    },
                    "ca640aed-ec46-4e52-83a6-14b2c8f2776a": {
                        "deleted": true
                    },
                    "13e0fab4-005e-4605-9730-d46455b99447": {
                        "deleted": true
                    },
                    "06438907-4824-4fde-9d9b-08342c32372c": {
                        "deleted": true
                    },
                    "fe3707d2-1673-457c-a576-a51403721299": {
                        "deleted": true
                    },
                    "1c44c5bb-4124-42e9-87a2-5d64cc16bde2": {
                        "deleted": true
                    },
                    "29711703-feac-4795-a4de-9e52f3102684": {
                        "deleted": true
                    },
                    "9e94e5db-83ce-41da-87e9-7765080c9a6d": {
                        "deleted": true
                    },
                    "cd29bc53-be72-42c3-9388-fba219f0545c": {
                        "deleted": true
                    },
                    "ddfc6f84-d2b7-4fcb-a954-d250b97c7ca4": {
                        "deleted": true
                    },
                    "37c0d877-7459-4950-b207-7fb4fdd261b0": {
                        "deleted": true
                    },
                    "b3d9041c-721a-4b23-90d1-fdd9d5ddae9b": {
                        "deleted": true
                    },
                    "aa79a0c4-39c3-4e63-8a97-6ca6c4f5e70e": {
                        "deleted": true
                    },
                    "1ef30858-4e4a-42d2-98e0-07e4e2fac089": {
                        "deleted": true
                    },
                    "f75de7db-723a-4e6c-8e63-8ebe6566551f": {
                        "deleted": true
                    },
                    "a7b03604-8f70-492c-a92a-f15c359ebf1c": {
                        "deleted": true
                    },
                    "20e12e5c-3629-43fd-95ae-da066b9dd992": {
                        "deleted": true
                    },
                    "1127c7c0-0729-4320-b8c2-8ef8fe55e881": {
                        "deleted": true
                    },
                    "f075449c-c0db-4ade-9f2d-60b9bc99316b": {
                        "deleted": true
                    },
                    "2a22eb4b-f392-49d3-b34f-9ae139aa5ee7": {
                        "deleted": true
                    },
                    "ffb087ff-4fb6-4215-809c-927313b0dec1": {
                        "deleted": true
                    }
                },
                "floorHeightM": 0
            },
            "4f2fa256-73a7-41b5-b584-14a40c36b7f0": {
                "deleted": true
            },
            "2c029ee2-c3f6-49be-bfb0-7215d03f86d2": {
                "deleted": true
            }
        },
        "shared": {
            "2edbc5b5-ad0a-4672-873b-00f6cfaf637d": {
                "deleted": true
            },
            "924c02c5-e487-453b-b84b-35ef0bc57533": {
                "deleted": true
            },
            "e4d947f4-572c-4b64-974c-834ccd734e8b": {
                "deleted": true
            },
            "99a0b1d3-6376-412c-b5d0-f0e2df4d7a3d": {
                "deleted": true
            },
            "ff868cde-03df-486e-8f7b-6779378386aa": {
                "deleted": true
            }
        }
    },
    "id": 0
}
