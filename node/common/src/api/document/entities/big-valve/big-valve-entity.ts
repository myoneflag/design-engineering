import { EntityType } from "../types";
import { FieldType, PropertyField } from "../property-field";
import InvisibleNodeEntity from "../Invisible-node-entity";
import { Catalog } from "../../../catalog/types";
import { Coord, DrawableEntity } from "../../drawing";
import { cloneSimple, parseCatalogNumberOrMin } from "../../../../lib/utils";

export enum BigValveType {
    TMV = "TMV",
    RPZD_HOT_COLD = "RPZD_HOT_COLD",
    TEMPERING = "TEMPERING"
}

export interface TmvValve {
    // ATM Machine. Sigh
    type: BigValveType.TMV;
    catalogId: "tmv";
    warmOutputUid: string;
    coldOutputUid: string;
}

export interface TemperingValve {
    type: BigValveType.TEMPERING;
    catalogId: "temperingValve";
    warmOutputUid: string;
}

export interface RpzdHotColdValve {
    type: BigValveType.RPZD_HOT_COLD;
    catalogId: "RPZD";
    hotOutputUid: string;
    coldOutputUid: string;
}

export default interface BigValveEntity extends DrawableEntity {
    center: Coord;
    type: EntityType.BIG_VALVE;
    rotation: number;
    coldRoughInUid: string;
    hotRoughInUid: string;

    valve: TmvValve | TemperingValve | RpzdHotColdValve;

    pipeDistanceMM: number;
    valveLengthMM: number;
    heightAboveFloorM: number;

    outputTemperatureC: number;

    minInletPressureKPA: number | null;
    maxInletPressureKPA: number | null;
    maxHotColdPressureDifferentialPCT: number | null;
    minFlowRateLS: number | null;
    maxFlowRateLS: number | null;
}

export interface SystemNodeEntity extends InvisibleNodeEntity {
    type: EntityType.SYSTEM_NODE;
    systemUid: string;
    allowAllSystems: boolean;
    configuration: FlowConfiguration;
}

export function makeBigValveFields(entity: BigValveEntity): PropertyField[] {
    return [
        {
            property: "rotation",
            title: "Rotation: (Degrees)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Rotation,
            params: null,
            multiFieldId: "rotation"
        },

        {
            property: "heightAboveFloorM",
            title: "Height Above Floor (m)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveFloorM"
        },

        {
            property: "outputTemperatureC",
            title: "Output Temperature (°C)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: 100 },
            multiFieldId: "outputTemperatureC"
        },

        {
            property: "minInletPressureKPA",
            title: "Min. Inlet Pressure (KPA)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "minInletPressureKPA"
        },

        {
            property: "maxInletPressureKPA",
            title: "Max. Inlet Pressure (KPA)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "maxInletPressureKPA"
        },

        {
            property: "minFlowRateLS",
            title: "Min. Flow Rate (L/s)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "minFlowRateLS"
        },

        {
            property: "maxFlowRateLS",
            title: "Max. Flow Rate (L/s)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "maxFlowRateLS"
        }
    ];
}

export function fillDefaultBigValveFields(defaultCatalog: Catalog, value: BigValveEntity) {
    const result = cloneSimple(value);

    const arr: Array<"minInletPressureKPA" | "maxInletPressureKPA" | "minFlowRateLS" | "maxFlowRateLS"> = [
        "minInletPressureKPA",
        "maxInletPressureKPA",
        "minFlowRateLS",
        "maxFlowRateLS"
    ];

    arr.forEach((field) => {
        if (result[field] === null) {
            result[field] = parseCatalogNumberOrMin(defaultCatalog.mixingValves.tmv[field]);
        }
    });
    return result;
}

export enum FlowConfiguration {
    INPUT,
    OUTPUT,
    BOTH
}
