import {FieldType, PropertyField} from "./property-field";
import {EntityType} from "./types";
import {CenteredEntity, Color, COLORS, DrawableEntity} from "../drawing";
import {Units} from "../../../lib/measurements";
import {DocumentState} from "../../../../../frontend/src/store/document/types";
import {isGas} from "../../config";
import {Catalog} from "../../catalog/types";

export enum NodeType {
    LOAD_NODE,
    DWELLING
}

export interface LoadNode {
    type: NodeType.LOAD_NODE;
    loadingUnits: number;
    designFlowRateLS: number;
    continuousFlowLS: number;
    gasFlowRateMJH: number;
}

export interface DwellingNode {
    type: NodeType.DWELLING;
    dwellings: number;
    continuousFlowLS: number;
    gasFlowRateMJH: number;
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

export function makeLoadNodesFields(doc: DocumentState, value: LoadNodeEntity, catalog: Catalog): PropertyField[] {
    const fields: PropertyField[] = [
        {
            property: "systemUidOption",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems: doc.drawing.metadata.flowSystems },
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

    const system = doc.drawing.metadata.flowSystems.find((f) => f.uid === value.systemUidOption);

    const nodeIsGas = isGas(system ? system.fluid : 'water', catalog);

    switch (value.node.type) {
        case NodeType.LOAD_NODE:
            if (nodeIsGas || value.systemUidOption === null) {
                fields.push(
                    {
                        property: "node.gasFlowRateMJH",
                        title: "Gas Demand",
                        hasDefault: false,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: { min: 0, max: null },
                        multiFieldId: "gasFlowRateMJH",
                        units: Units.MegajoulesPerHour
                    }
                );
            }

            if (!nodeIsGas || value.systemUidOption === null) {
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
                    },
                );
            }
            break;
        case NodeType.DWELLING:
            if (nodeIsGas || value.systemUidOption === null) {
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

            if (!nodeIsGas || value.systemUidOption === null) {
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
            }
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
