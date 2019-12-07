
export enum DrawingMode {
    FloorPlan = 0,
    Hydraulics = 1,
    Calculations = 2,
}

export interface MouseMoveResult {
    handled: boolean;
    cursor: string | null;
}

export const UNHANDLED: MouseMoveResult = {
    handled: false,
    cursor: null,
};
