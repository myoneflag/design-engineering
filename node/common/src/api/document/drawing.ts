import { DrawableEntityConcrete } from "./entities/concrete-entity";
import {
    ComponentPressureLossMethod,
    InsulationJackets,
    InsulationMaterials,
    PIPE_SIZING_METHODS,
    RingMainCalculationMethod,
    SupportedDwellingStandards,
    SupportedPsdStandards
} from "../config";
import RiserEntity from "./entities/riser-entity";
import { EntityType } from "./entities/types";
import { Choice } from "../../lib/utils";

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


    networks: { [key in keyof typeof NetworkType]: NetworkParams };
}

export interface CalculationParameters {
    psdMethod: SupportedPsdStandards;
    dwellingMethod: SupportedDwellingStandards | null;
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
    [key: string]: SelectedMaterialManufacturer[];
}

export interface SelectedMaterialManufacturer {
    uid: string;
    manufacturer: string;
}

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
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB"
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB"
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74"
                    }
                }
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
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB"
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB"
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74"
                    }
                }
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
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB"
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.2,
                        material: "copperTypeB"
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74"
                    }
                }
            }
        ],
        calculationParams: {
            psdMethod: SupportedPsdStandards.as35002018LoadingUnits,
            dwellingMethod: null,
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
            pipes: [],
            backflowValves: [],
            mixingValves: [],
            prv: [],
        }
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
