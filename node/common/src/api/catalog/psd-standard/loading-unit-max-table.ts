import { PsdStandard, PSDStandardType } from "./types";

export default interface LoadingUnitMaxTable extends PsdStandard {
    type: PSDStandardType.LU_MAX_LOOKUP_TABLE;
    name: string;
    // first index: max. Second index: LU.
    table: { [key: string]: {[key: string]: string} };
}
