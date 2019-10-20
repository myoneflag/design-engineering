import {PsdStandard, PSDStandardType} from '@/store/catalog/psd-standard/types';

export default interface Equation extends PsdStandard {
    type: PSDStandardType.EQUATION;
    name: string;
    equation: string;
    variables: {[key: string]: string};
}