import { EntityType } from "../document/entities/types";

export interface PipeCalculationReportEntry {
    type: EntityType;
    nominalSizeMM: number | null;
    lengthM: number | null;
}

export interface RiserCalculationReportEntry {
    type: EntityType;
    expandedEntities: PipeCalculationReportEntry[]
}

export default interface AbbreviatedCalculationReport {
    calculations: {
        [key: string]: PipeCalculationReportEntry | RiserCalculationReportEntry;
    }
}
