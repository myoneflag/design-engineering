import { PsdStandard, PSDStandardType } from "../../../../src/store/catalog/psd-standard/types";

export default interface LoadingUnitTable extends PsdStandard {
    type: PSDStandardType.LU_LOOKUP_TABLE;
    name: string;
    table: { [key: string]: string };
}
