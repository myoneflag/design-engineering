import {DrawableEntity} from '../../../../src/store/document/types';
import {PsdCountEntry} from "../../../calculations/utils";

export interface PsdCalculation {
    psdUnits: PsdCountEntry | null;
}

export interface Calculation {
    warning: string | null;
}
