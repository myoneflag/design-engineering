import { PsdStandard, PSDStandardType } from "./types";

export default interface PsdEquation extends PsdStandard {
    type: PSDStandardType.EQUATION;
    name: string;
    equation: string;
    variables: { [key: string]: string };
}
