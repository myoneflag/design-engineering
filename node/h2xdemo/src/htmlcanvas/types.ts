
export enum DrawingMode {
    FloorPlan,
    Hydraulics,
    Results,
}

export class EventHandler {

}

export interface MouseMoveResult {
    handled: boolean;
    cursor: string | null;
}

export const UNHANDLED: MouseMoveResult = {
    handled: false,
    cursor: null,
}
