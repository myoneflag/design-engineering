export enum DrawingMode {
    FloorPlan = 0,
    Hydraulics = 1,
    Calculations = 2,
    History = 3
}

export interface MouseMoveResult {
    handled: boolean;
    cursor: string | null;
}

export const UNHANDLED: MouseMoveResult = {
    handled: false,
    cursor: null
};

export enum Direction {
    Horizontal = 'horizontal',
    Vertical = 'vertical'
}
