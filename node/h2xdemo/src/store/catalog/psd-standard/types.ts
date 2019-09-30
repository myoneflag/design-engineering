export enum PSDStandardType {
    LU_LOOKUP_TABLE= 'LU_LOOKUP_TABLE',
    LU_HOT_COLD_TABLE = 'LU_HOT_COLD_TABLE',
    EQUATION = 'EQUATION',
}

export interface PsdStandard {
    type: PSDStandardType;
}
