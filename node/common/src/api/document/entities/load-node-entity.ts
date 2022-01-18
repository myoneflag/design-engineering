import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { CenteredEntity, Color, COLORS, DrawableEntity, DrawingState } from "../drawing";
import { Units } from "../../../lib/measurements";
import { isGas, isLUStandard, SupportedPsdStandards } from "../../config";
import { Catalog } from "../../catalog/types";
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
    gasPressureKPA: number | null;
    variant: NodeVariant;
    asnzFixtureUnits: number | null;
    enDischargeUnits: number | null;
    upcFixtureUnits: number | null;
    diversity: number | null;
}

export interface DwellingNode {
    type: NodeType.DWELLING;
    dwellings: number;
    continuousFlowLS: number | null;
    gasFlowRateMJH: number;
    gasPressureKPA: number | null;
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
    const gasSystems = drawing.metadata.flowSystems.filter(i => isGas(i.uid, catalog.fluids, drawing.metadata.flowSystems));

    const fields: PropertyField[] = [
        {
            property: "systemUidOption",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: {
                systems: drawing.metadata.flowSystems,
                disabledSystems: value.node.type === NodeType.DWELLING ? gasSystems.map(({ uid }) => (uid)) : undefined,
            },
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

    const nameField: PropertyField = {
        property: "name",
        title: "Name",
        hasDefault: false,
        isCalculated: false,
        type: FieldType.Text,
        params: null,
        multiFieldId: "name",
    };

    const nodeIsGas = isGas(systemUid!, catalog.fluids, drawing.metadata.flowSystems);

    switch (value.node.type) {
        case NodeType.LOAD_NODE:
            if (!nodeIsGas || systemUid === null) {
                switch (value.node.variant) {
                    case undefined:
                    case null:
                    case NodeVariant.FIXTURE:
                        fields.unshift(nameField);
                        const psdStrategy = drawing
                            ? drawing.metadata.calculationParams.psdMethod
                            : SupportedPsdStandards.as35002018LoadingUnits;

                        fields.push(
                            {
                                property: "node.loadingUnits",
                                title: I18N.loadingUnits[locale],
                                hasDefault: typeof value.customNodeId !== "undefined",
                                isCalculated: false,
                                type: FieldType.Number,
                                params: { min: 0, max: null },
                                multiFieldId: "loadingUnits",
                                hideFromPropertyWindow: !isLUStandard(psdStrategy)
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
                                hideFromPropertyWindow: isLUStandard(psdStrategy)
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
                        fields.unshift(nameField);

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
                {
                    property: "node.diversity",
                    title: "Diversity",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "diversity",
                    units: Units.Percent
                },
            );
        }

        fields.push(
            {
                property: "node.gasPressureKPA",
                title: "Gas Pressure",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                units: Units.GasKiloPascals,
                params: { min: 0, max: null },
                multiFieldId: "gasPressureKPA"
            },
        );

    }

    return fields;
}

export function drawingContainsCustomNode(drawing: DrawingState, customNodeId: number): boolean {
    let found = false;
    for (const level of Object.values(drawing.levels)) {
        for (const entity of Object.values(level.entities)) {
            if (entity.type === EntityType.LOAD_NODE && entity.customNodeId === customNodeId) {
                found = true;
                break;
            }
        }
        if (found) break;
    }
    return found;
}
