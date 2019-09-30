import {PsdStandard, PSDStandardType} from '@/store/catalog/psd-standard/types';

export default interface LoadingUnitTable extends PsdStandard {
    type: PSDStandardType.LU_LOOKUP_TABLE;
    table: {[key: string]: string};
}
