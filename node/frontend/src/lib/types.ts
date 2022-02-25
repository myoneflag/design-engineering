export const GROUND_FLOOR_MIN_HEIGHT_M = -0.5;

export const ALL_KEY_VERSION = 5;

export interface CombineFilters {
    [key: string]: CombineFilter[];
}

export interface CombineFilter {
    name: string;
    fields: string[];
}
