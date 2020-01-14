import { PsdCountEntry } from "../../../calculations/utils";
import { DrawableEntity } from "../../../../../common/src/api/document/drawing";

export interface PsdCalculation {
    psdUnits: PsdCountEntry | null;
}

export interface Calculation {
    warning: string | null;
}
