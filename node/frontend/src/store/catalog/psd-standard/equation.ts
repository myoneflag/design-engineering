import {PsdStandard, PSDStandardType} from '../../../../src/store/catalog/psd-standard/types';

export default interface Equation extends PsdStandard {
    type: PSDStandardType.EQUATION;
    name: string;
    equation: string;
    variables: {[key: string]: string};
}
