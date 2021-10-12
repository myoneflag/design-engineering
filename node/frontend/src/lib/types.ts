export const GROUND_FLOOR_MIN_HEIGHT_M = -0.5;

/* type of Warnings */
export interface WarningType {
    id: string;
    level: string;
    warning: string;
    type: string;
    hidden?: boolean;
    description: string;
    mode: string;
    helpLink: string;
    entity: string;
}
