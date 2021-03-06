import * as Operations from "../../../../common/src/api/document/operation-transforms";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DrawingMode } from "../../../src/htmlcanvas/types";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { ValveId } from "../../../src/htmlcanvas/lib/types";
import { DrawingState, initialDrawing } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { Operation } from "../../../../common/src/models/Operation";
import { PAPER_SIZES, PaperSize } from "../../../../common/src/api/paper-config";
import { SupportedLocales } from "../../../../common/src/api/locale";
import DirectedValveEntity from "../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { FieldCategory } from "./calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../common/src/api/config";

// Because of how the diffing engine works, there are restrictions on the data structure for the document state.
// Rules are:
// 1. Structure is to remain static, except naturally Arrays.
// 2. Objects in arrays must be the same type.
// 3. Objects with uids can be placed as direct array elements to take advantage of the update, add, and delete
//    operations.
// 4. 'uid' is a special field. Use it only as a uuid and for atomic objects where different operations on it
//    should be combined.

export interface CalculationUiSettings {

}

export enum PressureOrDrainage {
    Pressure = "pressure",
    Drainage = "drainage"
}

export interface UIState {
    viewPort: ViewPort | null;
    loaded: boolean;
    drawingMode: DrawingMode;

    gridLines: GridLineMode;

    lastCalculationId: number;
    lastCalculationUiSettings: CalculationUiSettings;
    lastCalculationSuccess: boolean,
    isCalculating: boolean;

    selectedUids: string[];

    lastUsedFixtureUid: string | null;
    lastUsedValveVid: ValveId | null;

    calculationFilters: CalculationFilters;
    calculationFilterSettings: CalculationFilterSettings;
    warningFilter: WarningFilter;
    systemFilter: {
        hiddenSystemUids: string[];
        tempVisibleSystemUids: string[];
    }

    levelUid: string | null;
    viewOnly: boolean;
    viewOnlyReason: string | null;
    historyIndex: number;

    snapTarget: string[];

    pastesByLevel: { [key: string]: number };

    exportSettings: ExportUiSettings;
    costAndLUTableOpen: boolean;

    pressureOrDrainage: "pressure" | "drainage";

    reCalculate: boolean;
    tempUids: string[];
}


export interface ExportUiSettings {
    paperSize: PaperSize;
    scale: string;
    detail: number;
    coverSheet: boolean;
    floorPlans: boolean;
    borderless?: boolean;
    isAppendix?: boolean;
}

export enum GridLineMode {
    NONE = "NONE",
    ORIGIN = "ORIGIN",
    FULL = "FULL"
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
    targets?: string[];
}

export enum CalculationFilterSettingType {
    Systems = "systems",
    View = "view",
}
export type CalculationFilterSettings = {
    [CalculationFilterSettingType.Systems]: {
        enabled: boolean,
        name: string,
        filters: { [key in string]: FilterSettingKey },
    },
    [CalculationFilterSettingType.View]: {
        enabled: boolean,
        name: string,
        filters: { [key in FilterSettingViewKeyValues]: FilterSettingKey },
    },
}
export type FilterSettingViewKeyValues =
    "all" |
    "custom" |
    "reference" |
    "pipe-sizing" |
    "pressure" |
    "heat-loss" |
    "grade-fall";
export interface FilterSettingKey extends FilterKey {
    pressureOrDrainage?: PressureOrDrainage;
    category?: FieldCategory[];
}

export interface WarningFilter {
    hiddenUids: string[];
    collapsedLevelType: LevelTypeKey[];
    showHiddenWarnings: boolean;
    showWarningsToPDF: boolean;
    activeEntityUid: string;
    editEntityUid: string;
}
export interface LevelTypeKey {
    levelUid: string;
    visible: boolean;
    types: EntityType[];
}

/**
 * A document is a drawing + all of its history and meta attributes.
 */
export interface DocumentState {
    isPreview: boolean | undefined;
    activeflowSystemId: number | 0;
    // This is the drawing that we last received or last sent to the server.
    committedDrawing: DrawingState;
    diffFilter: DiffFilter;
    // This is the current drawing that is connected in real time to vue components.
    // Operations are generated by diffing this view with the drawing state.
    drawing: DrawingState;

    undoStack: Operations.OperationTransformConcrete[][];
    undoIndex: number; // Index of the next undo that gets PUSHED. It is one ahead of the next item to undo itself.

    optimisticHistory: Operations.OperationTransformConcrete[];

    stagedCommits: Operations.OperationTransformConcrete[];

    fullHistory: Operation[];

    // A list of operations that have been performed on the committedDrawing.
    // This implies that changes in the drawing state are not reflected in operations.
    // This also implies that changes are updated from the server.
    history: Operations.OperationTransformConcrete[];
    nextId: number;

    uiState: UIState;
    locale: SupportedLocales;

    documentId: number;
    shareToken: string;
    isLoading: boolean;

    entityDependencies: Map<string, DirectedValveEntity>;
}

export interface DiffFilter {
    metadata: {};
    levels: any;
    shared: any;
}

export const initCalculationFilterSettings = {
    [CalculationFilterSettingType.Systems]: {
        enabled: true,
        name: "Systems",
        filters: {
            "all": {
                name: "Show All",
                enabled: true,
            },
            [StandardFlowSystemUids.ColdWater]: {
                name: "Cold Water",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Pressure
            },
            [StandardFlowSystemUids.HotWater]: {
                name: "Hot Water",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Pressure
            },
            [StandardFlowSystemUids.WarmWater]: {
                name: "Warm Water",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Pressure
            },
            [StandardFlowSystemUids.Gas]: {
                name: "Gas",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Pressure
            },
            [StandardFlowSystemUids.FireHydrant]: {
                name: "Fire Hydrant",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Pressure
            },
            [StandardFlowSystemUids.FireHoseReel]: {
                name: "Fire Hose Reel",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Pressure
            },
            [StandardFlowSystemUids.SewerDrainage]: {
                name: "Sewer Drainage",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Drainage
            },
            [StandardFlowSystemUids.SanitaryPlumbing]: {
                name: "Sanitary Plumbing",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Drainage
            },
            [StandardFlowSystemUids.GreaseWaste]: {
                name: "Grease Waste",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Drainage
            },
            [StandardFlowSystemUids.TradeWaste]: {
                name: "Trade Waste",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Drainage
            },
            [StandardFlowSystemUids.RisingMain]: {
                name: "Rising Main",
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Drainage
            },
        },
    },
    [CalculationFilterSettingType.View]: {
        enabled: true,
        name: "View",
        filters: {
            "all": {
                name: "All",
                enabled: false,
            },
            "custom": {
                name: "Custom",
                enabled: true,
            },
            "reference": {
                name: "Reference",
                enabled: false,
                category: [FieldCategory.EntityName]
            },
            "pipe-sizing": {
                name: "Pipe Sizing",
                enabled: false,
                category: [
                    FieldCategory.Size,
                    FieldCategory.LoadingUnits,
                    FieldCategory.Velocity,
                    FieldCategory.FlowRate,
                    FieldCategory.HeatLoss,
                ]
            },
            "pressure": {
                name: "Pressure",
                enabled: false,
                pressureOrDrainage: PressureOrDrainage.Pressure,
                category: [FieldCategory.Pressure]
            },
            "heat-loss": {
                name: "Heat Loss",
                enabled: false,
                pressureOrDrainage: PressureOrDrainage.Pressure,
                category: [
                    FieldCategory.HeatLoss,
                    FieldCategory.Volume,
                    FieldCategory.Length
                ]
            },
            "grade-fall": {
                name: "Grade/Fall",
                enabled: false,
                pressureOrDrainage: PressureOrDrainage.Drainage,
                category: [
                    FieldCategory.Location,
                    FieldCategory.Size,
                    FieldCategory.Length
                ]
            },
        },
    }
};

export const initialUIState: UIState = {
    drawingMode: DrawingMode.FloorPlan,
    loaded: false,
    viewPort: null,

    gridLines: GridLineMode.ORIGIN,

    lastUsedFixtureUid: null,
    lastUsedValveVid: null,

    selectedUids: [],
    historyIndex: 0,

    lastCalculationId: 0,
    lastCalculationUiSettings: {
        demandType: null
    },
    lastCalculationSuccess: false,
    isCalculating: false,
    calculationFilters: {},
    calculationFilterSettings: {...initCalculationFilterSettings},
    warningFilter: {
        hiddenUids: [],
        collapsedLevelType: [],
        showHiddenWarnings: true,
        showWarningsToPDF: true,
        activeEntityUid: '',
        editEntityUid: '',
    },
    systemFilter: {
        hiddenSystemUids: [],
        tempVisibleSystemUids: [],
    },
    levelUid: null,
    viewOnly: true,
    viewOnlyReason: null,

    pastesByLevel: {},
    snapTarget: [],

    exportSettings: {
        paperSize: PAPER_SIZES.A1,
        scale: "1:100",
        detail: -8,
        coverSheet: true,
        floorPlans: true
    },

    costAndLUTableOpen: true,
    pressureOrDrainage: "pressure",
    reCalculate: false,
    tempUids: [],
};

export function blankDiffFilter() {
    return {
        shared: {},
        levels: {},
        metadata: false
    };
}

export const initialDocumentState: DocumentState = {
    committedDrawing: initialDrawing(SupportedLocales.AU),
    drawing: initialDrawing(SupportedLocales.AU), // This gets replaced immediately upon loading after locales are known.
    undoStack: [],
    undoIndex: 0,
    diffFilter: blankDiffFilter(),
    optimisticHistory: [],
    stagedCommits: [],
    history: [],
    fullHistory: [],
    nextId: 1,
    uiState: cloneSimple(initialUIState),
    documentId: -1,
    shareToken: '',
    isLoading: false,
    locale: SupportedLocales.AU,
    isPreview: false,
    activeflowSystemId: 0,
    entityDependencies: new Map(),
};

export interface EntityParam {
    entity: DrawableEntityConcrete;
    levelUid: string;
}

export interface EntityParamNullable {
    entity: DrawableEntityConcrete;
    levelUid: string | null;
}
