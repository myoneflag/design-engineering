import {Cost, PsdCountEntry} from "../../../calculations/utils";
import {CalculationField, FieldCategory} from "./calculation-field";
import {Units} from "../../../../../common/src/lib/measurements";
import {DrawableEntityConcrete} from "../../../../../common/src/api/document/entities/concrete-entity";
import { WarningDetail } from "./warnings"
import { NamedEntity } from "../../../../../common/src/api/document/drawing";

export enum CalculationType { 
    RiserCalculation,
    PipeCalculation,
    BigValveCalculation,
    DirectedValveCalculation,
    FittingCalculation,
    FixtureCalculation,
    SystemNodeCalculation,
    LoadNodeCalculation,
    FlowSourceCalculation,
    PlantCalculation,
    GasApplianceCalculation
}

export interface PsdCalculation {
    psdUnits: PsdCountEntry | null;
}

export interface NameCalculation extends NamedEntity {
}

export interface Calculation {
    type: CalculationType;
    warnings: WarningDetail[] | null;
    cost: Cost | null;
    costBreakdown: Array<{ qty: number, path: string }> | null;
    expandedEntities: DrawableEntityConcrete[] | null;
    reference?: string;
}

export interface PressureCalculation {
    pressureKPA: number | null;
    staticPressureKPA: number | null;
}

export function addPressureCalculationFields(
    fields: CalculationField[],
    systemUid: string | undefined,
    propPrefix: string = "",
    extraPressureProps?: Partial<CalculationField>,
    extraStaticProps?: Partial<CalculationField>,
) {
    fields.push(
        {
            property: propPrefix + "pressureKPA",
            title: "Residual Pressure",
            short: "",
            units: Units.KiloPascals,
            systemUid,
            category: FieldCategory.Pressure,
            ...extraPressureProps,
        },
        {
            property: propPrefix + "staticPressureKPA",
            title: "Static Pressure",
            short: "",
            units: Units.KiloPascals,
            systemUid,
            category: FieldCategory.Pressure,
            ...extraStaticProps,
        }
    );
}
