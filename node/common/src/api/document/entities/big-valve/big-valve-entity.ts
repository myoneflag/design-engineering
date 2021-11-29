import { EntityType } from "../types";
import { FieldType, PropertyField } from "../property-field";
import InvisibleNodeEntity from "../Invisible-node-entity";
import { Catalog } from "../../../catalog/types";
import { COLORS, Coord, DrawableEntity, DrawingState, SelectedMaterialManufacturer } from "../../drawing";
import { cloneSimple, parseCatalogNumberOrMin } from "../../../../lib/utils";
import { Units } from "../../../../lib/measurements";

export enum BigValveType {
    TMV = "TMV",
    RPZD_HOT_COLD = "RPZD_HOT_COLD",
    TEMPERING = "TEMPERING"
}

export interface TmvValve {
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
            title: "Height Above Floor",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveFloorM",
            units: Units.Meters,
        },

        {
            property: "outputTemperatureC",
            title: "Output Temperature",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: 100 },
            multiFieldId: "outputTemperatureC",
            units: Units.Celsius
        },

        {
            property: "minInletPressureKPA",
            title: "Min. Inlet Pressure",
            hasDefault: true,
            isCalculated: false,
            highlightOnOverride: COLORS.YELLOW,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "minInletPressureKPA",
            units: Units.KiloPascals
        },

        {
            property: "maxInletPressureKPA",
            title: "Max. Inlet Pressure",
            hasDefault: true,
            highlightOnOverride: COLORS.YELLOW,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "maxInletPressureKPA",
            units: Units.KiloPascals
        },

        {
            property: "minFlowRateLS",
            title: "Min. Flow Rate",
            hasDefault: true,
            isCalculated: false,
            highlightOnOverride: COLORS.YELLOW,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "minFlowRateLS",
            units: Units.LitersPerSecond
        },

        {
            property: "maxFlowRateLS",
            title: "Max. Flow Rate",
            hasDefault: true,
            isCalculated: false,
            highlightOnOverride: COLORS.YELLOW,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "maxFlowRateLS",
            units: Units.LitersPerSecond
        }
    ];
}

export function fillDefaultBigValveFields(defaultCatalog: Catalog, value: BigValveEntity, drawing: DrawingState) {
    const result = cloneSimple(value);
    const checkSelectedMaterialManufacturer = drawing.metadata.catalog.mixingValves.find((material: SelectedMaterialManufacturer) => material.uid === 'tmv');
    const manufacturer = checkSelectedMaterialManufacturer && checkSelectedMaterialManufacturer.manufacturer || 'generic';

    const arr: Array<"minInletPressureKPA" | "maxInletPressureKPA" | "minFlowRateLS" | "maxFlowRateLS"> = [
        "minInletPressureKPA",
        "maxInletPressureKPA",
        "minFlowRateLS",
        "maxFlowRateLS"
    ];

    arr.forEach((field) => {
        if (result[field] === null) {
            result[field] = parseCatalogNumberOrMin(defaultCatalog.mixingValves.tmv[field][manufacturer]);
        }
    });
    return result;
}

export enum FlowConfiguration {
    INPUT,
    OUTPUT,
    BOTH
}
