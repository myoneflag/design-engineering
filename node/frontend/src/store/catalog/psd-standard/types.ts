export enum PSDStandardType {
    LU_LOOKUP_TABLE= 'LU_LOOKUP_TABLE',
    LU_HOT_COLD_LOOKUP_TABLE = 'LU_HOT_COLD_LOOKUP_TABLE',
    EQUATION = 'EQUATION',
}

export enum DwellingStandardType {
    DWELLING_LOOKUP_TABLE_HOT_COLD = 'DWELLING_LOOKUP_TABLE_HOT_COLD',
    EQUATION = 'EQUATION',
}

export interface PsdStandard {
    type: PSDStandardType;
}
