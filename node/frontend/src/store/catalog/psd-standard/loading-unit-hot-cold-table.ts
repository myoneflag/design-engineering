import {PsdStandard, PSDStandardType} from '../../../../src/store/catalog/psd-standard/types';

export default interface LoadingUnitHotColdTable extends PsdStandard {
    type: PSDStandardType.LU_HOT_COLD_LOOKUP_TABLE;
    name: string;
    hotColdTable: {[key: string]: {cold: string, hot: string}};
}
