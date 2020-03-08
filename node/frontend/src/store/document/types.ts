import * as Operations from "../../../../common/src/api/document/operation-transforms";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DrawingMode } from "../../../src/htmlcanvas/types";
import { DemandType } from "../../../src/calculations/types";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { ValveId } from "../../../src/htmlcanvas/lib/types";
import { DrawingState, initialDrawing } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { Operation } from "../../../../common/src/models/Operation";
import { PAPER_SIZES, PaperSize, PaperSizeName } from "../../../../common/src/api/paper-config";

// Because of how the diffing engine works, there are restrictions on the data structure for the document state.
// Rules are:
// 1. Structure is to remain static, except naturally Arrays.
// 2. Objects in arrays must be the same type.
// 3. Objects with uids can be placed as direct array elements to take advantage of the update, add, and delete
//    operations.
// 4. 'uid' is a special field. Use it only as a uuid and for atomic objects where different operations on it
//    should be combined.

export interface CalculationUiSettings {
    demandType: DemandType | null;
}

export interface UIState {
    viewPort: ViewPort | null;
    loaded: boolean;
    drawingMode: DrawingMode;
    demandType: DemandType;

    gridLines: GridLineMode;

    lastCalculationId: number;
    lastCalculationUiSettings: CalculationUiSettings;
    isCalculating: boolean;

    selectedUids: string[];

    lastUsedFixtureUid: string | null;
    lastUsedValveVid: ValveId | null;

    calculationFilters: CalculationFilters;
    levelUid: string | null;
    viewOnly: boolean;
    viewOnlyReason: string | null;
    historyIndex: number;

    pastesByLevel: { [key: string]: number };

    exportSettings: ExportUiSettings;
}

export interface ExportUiSettings {
    paperSize: PaperSize;
    scale: string;
    detail: number;
    coverSheet: boolean;
    floorPlans: boolean;
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

    documentId: number;
}

export interface DiffFilter {
    metadata: {};
    levels: any;
    shared: any;
}

export const initialUIState: UIState = {
    demandType: DemandType.PSD,
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
    isCalculating: false,
    calculationFilters: {},
    levelUid: null,
    viewOnly: true,
    viewOnlyReason: null,

    pastesByLevel: {},

    exportSettings: {
        paperSize: PAPER_SIZES.A1,
        scale: "1:100",
        detail: -8,
        coverSheet: true,
        floorPlans: true
    }
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
    undoStack: [],
    undoIndex: 0,
    diffFilter: blankDiffFilter(),
    optimisticHistory: [],
    stagedCommits: [],
    history: [],
    fullHistory: [],
    nextId: 1,
    uiState: cloneSimple(initialUIState),
    documentId: -1
};

export interface EntityParam {
    entity: DrawableEntityConcrete;
    levelUid: string;
}

export interface EntityParamNullable {
    entity: DrawableEntityConcrete;
    levelUid: string | null;
}
