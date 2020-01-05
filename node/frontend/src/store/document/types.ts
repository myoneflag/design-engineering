import * as Operations from "./operation-transforms/operation-transforms";
import {
    PIPE_SIZING_METHODS,
    RING_MAIN_CALCULATION_METHODS,
    SupportedDwellingStandards,
    SupportedPsdStandards
} from "../../../src/config";
import { EntityType } from "../../../src/store/document/entities/types";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DrawingMode } from "../../../src/htmlcanvas/types";
import { DemandType } from "../../../src/calculations/types";
import { DrawableEntityConcrete } from "../../../src/store/document/entities/concrete-entity";
import { cloneSimple } from "../../../src/lib/utils";
import { ValveId } from "../../../src/htmlcanvas/lib/types";
import RiserEntity from "./entities/riser-entity";

// Because of how the diffing engine works, there are restrictions on the data structure for the document state.
// Rules are:
// 1. Structure is to remain static, except naturally Arrays.
// 2. Objects in arrays must be the same type.
// 3. Objects with uids can be placed as direct array elements to take advantage of the update, add, and delete
//    operations.
// 4. 'uid' is a special field. Use it only as a uuid and for atomic objects where different operations on it
//    should be combined.

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

export interface Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
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

export interface CalculationUiSettings {
    demandType: DemandType | null;
}

export interface UIState {
    viewPort: ViewPort | null;
    loaded: boolean;
    drawingMode: DrawingMode;
    demandType: DemandType;

    lastCalculationId: number;
    lastCalculationUiSettings: CalculationUiSettings;
    isCalculating: boolean;

    lastUsedFixtureUid: string | null;
    lastUsedValveVid: ValveId | null;

    calculationFilters: CalculationFilters;
    levelUid: string | null;
    viewOnly: boolean;
    viewOnlyReason: string | null;
}

export interface CalculationFilters {
    [key: string]: CalculationFilter;
}
export interface CalculationFilter {
    name: string;
    enabled: boolean;
    filters: { [key: string]: FilterKey };
}
export interface FilterKey {
    name: string;
    enabled: boolean;
}
/**
 * A document is a drawing + all of its history and meta attributes.
 */
export interface DocumentState {
    // This is the drawing that we last received or last sent to the server.
    committedDrawing: DrawingState;
    diffFilter: DiffFilter;
    // This is the current drawing that is connected in real time to vue components.
    // Operations are generated by diffing this view with the drawing state.
    drawing: DrawingState;

    optimisticHistory: Operations.OperationTransformConcrete[];

    stagedCommits: Operations.OperationTransformConcrete[];

    // A list of operations that have been performed on the committedDrawing.
    // This implies that changes in the drawing state are not reflected in operations.
    // This also implies that changes are updated from the server.
    history: Operations.OperationTransformConcrete[];
    nextId: number;

    uiState: UIState;

    documentId: number;
}

export interface DiffFilter {
    metadata: {};
    levels: any;
    shared: any;
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
    ringMainCalculationMethod: string;
    pipeSizingMethod: string;

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
            ringMainCalculationMethod: RING_MAIN_CALCULATION_METHODS[0].key!,
            pipeSizingMethod: PIPE_SIZING_METHODS[0].key!,

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

export const initialUIState: UIState = {
    demandType: DemandType.PSD,
    drawingMode: DrawingMode.FloorPlan,
    loaded: false,
    viewPort: null,

    lastUsedFixtureUid: null,
    lastUsedValveVid: null,

    lastCalculationId: 0,
    lastCalculationUiSettings: {
        demandType: null
    },
    isCalculating: false,
    calculationFilters: {},
    levelUid: null,
    viewOnly: true,
    viewOnlyReason: null,
};

export function blankDiffFilter() {
    return {
        shared: {},
        levels: {},
        metadata: false
    };
}

export const initialDocumentState: DocumentState = {
    committedDrawing: cloneSimple(initialDrawing),
    drawing: cloneSimple(initialDrawing),
    diffFilter: blankDiffFilter(),
    optimisticHistory: [],
    stagedCommits: [],
    history: [],
    nextId: 1,
    uiState: cloneSimple(initialUIState),
    documentId: -1
};

export interface EntityParam {
    entity: DrawableEntityConcrete;
    levelUid: string;
}
