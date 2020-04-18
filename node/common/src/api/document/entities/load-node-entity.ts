import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { CenteredEntity, Color, COLORS, DrawableEntity, FlowSystemParameters } from "../drawing";
import { Units } from "../../../lib/measurements";
import { cloneSimple } from "../../../lib/utils";

export enum NodeType {
    LOAD_NODE,
    DWELLING
}

export interface LoadNode {
    type: NodeType.LOAD_NODE;
    loadingUnits: number;
    designFlowRateLS: number;
    continuousFlowLS: number;
}

export interface DwellingNode {
    type: NodeType.DWELLING;
    dwellings: number;
    continuousFlowLS: number;
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
}

export function makeLoadNodesFields(systems: FlowSystemParameters[], value: LoadNodeEntity): PropertyField[] {
    const fields: PropertyField[] = [
        {
            property: "systemUidOption",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems },
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

    switch (value.node.type) {
        case NodeType.LOAD_NODE:
            fields.push(
                {
                    property: "node.loadingUnits",
                    title: "Loading Units",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "loadingUnits"
                },

                {
                    property: "node.designFlowRateLS",
                    title: "Full Flow Rate",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "designFlowRateLS",
                    units: Units.LitersPerSecond,
                },

                {
                    property: "node.continuousFlowLS",
                    title: "Continuous Flow",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "continuousFlowLS",
                    units: Units.LitersPerSecond
                }
            );
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
                    property: "node.continuousFlowLS",
                    title: "Continuous Flow",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "continuousFlowLS",
                    units: Units.LitersPerSecond,
                }
            );
            break;
    }

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

    return fields;
}
