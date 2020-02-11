import { DrawableEntityConcrete } from "./entities/concrete-entity";
import {
    ComponentPressureLossMethod,
    PIPE_SIZING_METHODS,
    RingMainCalculationMethod,
    SupportedDwellingStandards,
    SupportedPsdStandards
} from "../config";
import RiserEntity from "./entities/riser-entity";
import { EntityType } from "./entities/types";

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
        flowSystems: FlowSystemParameters[];
        calculationParams: CalculationParameters;
        availableFixtures: string[];
    };

    levels: { [key: string]: Level };
    shared: { [key: string]: RiserEntity };
}

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

export interface FlowSystemParameters extends WithID {
    name: string;
    temperature: number;
    color: Color;
    fluid: string;

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
    gravitationalAcceleration: number;
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
            description: ""
        },
        flowSystems: [
            // TODO: these values should get got from the database.
            {
                name: "Cold Water",
                temperature: 20,
                color: { hex: "#009CE0" },
                uid: "cold-water",
                fluid: "water",
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
                temperature: 60,
                color: { hex: "#F44E3B" },
                uid: "hot-water",
                fluid: "water",
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
            gravitationalAcceleration: 9.80665
        },
        availableFixtures: ["basin", "bath", "shower", "kitchenSink", "wc", "washingMachine", "laundryTrough"]
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

export interface Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
}
