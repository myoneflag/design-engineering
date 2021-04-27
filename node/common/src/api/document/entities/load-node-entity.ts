import {FieldType, PropertyField} from "./property-field";
import {EntityType} from "./types";
import {CenteredEntity, Color, COLORS, DrawableEntity, DrawingState} from "../drawing";
import {Units} from "../../../lib/measurements";
import {assertUnreachable, isGas} from "../../config";
import {Catalog} from "../../catalog/types";
import { NodeProps } from "../../../models/CustomEntity";
import { I18N } from "../../locale/values";
import { SupportedLocales } from "../../locale";

export enum NodeType {
    LOAD_NODE,
    DWELLING,
}

export enum NodeVariant {
    FIXTURE_GROUP = "FIXTURE-GROUP",
    FIXTURE = "FIXTURE",
    CONTINUOUS = "CONTINUOUS",
}

export interface LoadNode {
    type: NodeType.LOAD_NODE;
    loadingUnits: number | null;
    designFlowRateLS: number | null;
    continuousFlowLS: number | null;
    gasFlowRateMJH: number;
    gasPressureKPA: number;
    variant: NodeVariant;
    asnzFixtureUnits: number | null;
    enDischargeUnits: number | null;
    upcFixtureUnits: number | null;

}

export interface DwellingNode {
    type: NodeType.DWELLING;
    dwellings: number;
    continuousFlowLS: number | null;
    gasFlowRateMJH: number;
    gasPressureKPA: number;
    loadingUnits: number | null;
    designFlowRateLS: number | null;
    asnzFixtureUnits: number;
    enDischargeUnits: number;
    upcFixtureUnits: number;
}

export default interface LoadNodeEntity extends DrawableEntity, CenteredEntity {
    type: EntityType.LOAD_NODE;
    systemUidOption: string | null;
    color: Color | null;
    calculationHeightM: number | null;

    node: LoadNode | DwellingNode;
    minPressureKPA: number | null;
    maxPressureKPA: number | null;

    linkedToUid: string | null;
    customNodeId?: number | string;
    name?: string | null;
}

export function makeLoadNodesFields(drawing: DrawingState, value: LoadNodeEntity, catalog: Catalog, locale: SupportedLocales, systemUid: string | null): PropertyField[] {
    const fields: PropertyField[] = [
        {
            property: "systemUidOption",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems: drawing.metadata.flowSystems },
            multiFieldId: "systemUid"
        },

        {
            property: "color",
            title: "Color",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Color,
            params: null,
            multiFieldId: "color"
        }
    ];

    const system = drawing.metadata.flowSystems.find((f) => f.uid === systemUid);

    const nodeIsGas = isGas(system ? system.fluid : 'water', catalog);

    switch (value.node.type) {
        case NodeType.LOAD_NODE:
            if (!nodeIsGas || systemUid === null) {
                switch (value.node.variant) {
                    case undefined:
                    case null:
                    case NodeVariant.FIXTURE:
                        fields.push(
                            {
                                property: "node.loadingUnits",
                                title: I18N.loadingUnits[locale],
                                hasDefault: typeof value.customNodeId !== "undefined",
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "loadingUnits"
                            },
                            {
                                property: "node.designFlowRateLS",
                                title: "Full Flow Rate",
                                hasDefault: typeof value.customNodeId !== "undefined",
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "designFlowRateLS",
                                units: Units.LitersPerSecond,
                            },
                            {
                                property: "node.asnzFixtureUnits",
                                title: "AS/NZS3500.2:2018 Fixture Unit",
                                hasDefault: false,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "asnzFixtureUnits",
                                units: Units.None
                            },
                            {
                                property: "node.enDischargeUnits",
                                title: "EN 12056-2:2000 Discharge Unit",
                                hasDefault: false,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "enDischargeUnits",
                                units: Units.None
                            },
                            {
                                property: "node.upcFixtureUnits",
                                title: "2018 UPC Drainage Fixture Unit",
                                hasDefault: false,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "upcFixtureUnits",
                                units: Units.None
                            },
                        );
                        break;
                    case NodeVariant.CONTINUOUS:
                        fields.push(
                            {
                                property: "node.continuousFlowLS",
                                title: "Continuous Flow",
                                hasDefault: typeof value.customNodeId !== "undefined",
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "continuousFlowLS",
                                units: Units.LitersPerSecond
                            },
                            {
                                property: "node.asnzFixtureUnits",
                                title: "AS/NZS3500.2:2018 Fixture Unit",
                                hasDefault: false,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "asnzFixtureUnits",
                                units: Units.None
                            },
                            {
                                property: "node.enDischargeUnits",
                                title: "EN 12056-2:2000 Discharge Unit",
                                hasDefault: false,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "enDischargeUnits",
                                units: Units.None
                            },
                            {
                                property: "node.upcFixtureUnits",
                                title: "2018 UPC Drainage Fixture Unit",
                                hasDefault: false,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "upcFixtureUnits",
                                units: Units.None
                            },
                        );
                        break;
                    case NodeVariant.FIXTURE_GROUP:
                        fields.push(
                            {
                                property: "node.loadingUnits",
                                title: I18N.loadingUnits[locale],
                                hasDefault: typeof value.customNodeId !== "undefined",
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "loadingUnits"
                            },
                            {
                                property: "node.designFlowRateLS",
                                title: "Full Flow Rate",
                                hasDefault: typeof value.customNodeId !== "undefined",
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "designFlowRateLS",
                                units: Units.LitersPerSecond,
                            },
                            {
                                property: "node.continuousFlowLS",
                                title: "Continuous Flow",
                                hasDefault: typeof value.customNodeId !== "undefined",
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "continuousFlowLS",
                                units: Units.LitersPerSecond
                            },
                            {
                                property: "node.asnzFixtureUnits",
                                title: "AS/NZS3500.2:2018 Fixture Unit",
                                hasDefault: true,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "asnzFixtureUnits",
                                units: Units.None
                            },
                            {
                                property: "node.enDischargeUnits",
                                title: "EN 12056-2:2000 Discharge Unit",
                                hasDefault: true,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "enDischargeUnits",
                                units: Units.None
                            },
                            {
                                property: "node.upcFixtureUnits",
                                title: "2018 UPC Drainage Fixture Unit",
                                hasDefault: true,
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "upcFixtureUnits",
                                units: Units.None
                            },
                        );
                        break;
                    default:
                        // Do not assert unreachable.
                        //assertUnreachable(value.node.variant);
                }
            }
            break;
        case NodeType.DWELLING:
            fields.push(
                {
                    property: "node.dwellings",
                    title: "Dwelling Units",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "dwellings"
                },
                {
                    property: "node.loadingUnits",
                    title: I18N.loadingUnits[locale],
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "loadingUnits"
                },
                {
                    property: "node.designFlowRateLS",
                    title: "Full Flow Rate",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "designFlowRateLS",
                    units: Units.LitersPerSecond,
                },
            );

            if (!nodeIsGas || systemUid === null) {
                fields.push(
                    {
                        property: "node.continuousFlowLS",
                        title: "Continuous Flow",
                        hasDefault: true,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: { min: 0, max: null },
                        multiFieldId: "continuousFlowLS",
                        units: Units.LitersPerSecond,
                    },

                    {
                        property: "node.asnzFixtureUnits",
                        title: "AS/NZS3500.2:2018 Fixture Unit",
                        hasDefault: false,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: { min: 0, max: null },
                        multiFieldId: "asnzFixtureUnits",
                        units: Units.None
                    },
                    {
                        property: "node.enDischargeUnits",
                        title: "EN 12056-2:2000 Discharge Unit",
                        hasDefault: false,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: { min: 0, max: null },
                        multiFieldId: "enDischargeUnits",
                        units: Units.None
                    },
                    {
                        property: "node.upcFixtureUnits",
                        title: "2018 UPC Drainage Fixture Unit",
                        hasDefault: false,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: { min: 0, max: null },
                        multiFieldId: "upcFixtureUnits",
                        units: Units.None
                    },
                );
            }
            break;
    }

    if (!nodeIsGas || systemUid === null) {
        fields.push(
            {
                property: "minPressureKPA",
                title: "Min. Pressure",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "minPressureKPA",
                units: Units.KiloPascals,
            },
            {
                property: "maxPressureKPA",
                title: "Max. Pressure",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "maxPressureKPA",
                units: Units.KiloPascals,
            },
        );
    }

    if (nodeIsGas || systemUid === null) {

        if (value.node.type === NodeType.DWELLING) {

            fields.push(
                {
                    property: "node.gasFlowRateMJH",
                    title: "Gas Demand (Per Dwelling)",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    units: Units.MegajoulesPerHour,
                    params: { min: 0, max: null },
                    multiFieldId: "gasFlowRateMJH"
                },
            );
        } else {

            fields.push(
                {
                    property: "node.gasFlowRateMJH",
                    title: "Gas Demand",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    units: Units.MegajoulesPerHour,
                    params: { min: 0, max: null },
                    multiFieldId: "gasFlowRateMJH"
                },
            );
        }

        fields.push(
            {
                property: "node.gasPressureKPA",
                title: "Gas Pressure",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                units: Units.KiloPascals,
                params: { min: 0, max: null },
                multiFieldId: "gasPressureKPA"
            },
        );

    }

    return fields;
}
