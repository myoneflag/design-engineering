import { PsdStandard, PSDStandardType } from "./types";

export default interface LoadingUnitTable extends PsdStandard {
    type: PSDStandardType.LU_LOOKUP_TABLE;
    name: string;
    table: { [key: string]: string };
}
