import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { Color, ConnectableEntity, Coord, DrawingState, FlowSystemParameters } from "../drawing";
import { Choice, cloneSimple } from "../../../lib/utils";
import { Units } from "../../../lib/measurements";
import { isDrainage, isGas, StandardFlowSystemUids } from "../../config";
import { SupportedLocales } from "../../locale";
import { Catalog } from "../../catalog/types";

export interface FlowSourceEntityV11 extends ConnectableEntity {
    type: EntityType.FLOW_SOURCE;
    center: Coord;
    systemUid: string;

    heightAboveGroundM: number | null;
    color: Color | null;
    pressureKPA: number | null;
}

export default interface FlowSourceEntity extends ConnectableEntity {
    type: EntityType.FLOW_SOURCE;
    center: Coord;
    systemUid: string;

    heightAboveGroundM: number | null;
    color: Color | null;
    minPressureKPA: number | null;
    maxPressureKPA: number | null;
}

export function makeFlowSourceFields(systems: FlowSystemParameters[], entity: FlowSourceEntity, catalog: Catalog, locale: SupportedLocales | undefined): PropertyField[] {

    const res: PropertyField[] = [
        {
            property: "systemUid",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems },
            multiFieldId: "systemUid"
        },
    ];

    if (isGas(entity.systemUid, catalog.fluids, systems)) {
        res.push({
            property: "minPressureKPA",
            title: "Pressure",
            hasDefault: false,
            isCalculated: false,
            requiresInput: true,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "minPressureKPA",
            units: Units.KiloPascals,
        });
    } else if (!isDrainage(entity.systemUid, systems)) {
        res.push(
            {
                property: "minPressureKPA",
                title: "Residual Pressure",
                hasDefault: false,
                isCalculated: false,
                requiresInput: true,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "minPressureKPA",
                units: Units.KiloPascals,
            },
            {
                property: "maxPressureKPA",
                title: "Static Pressure",
                hasDefault: false,
                isCalculated: false,
                requiresInput: true,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "maxPressureKPA",
                units: Units.KiloPascals,
            },
        );
    }

    if (!isDrainage(entity.systemUid, systems)) {
        res.push({
            property: "heightAboveGroundM",
            title: "Height",
            hasDefault: false,
            isCalculated: false,
            requiresInput: true,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveGroundM",
            units: Units.Meters
        });
    }

    if (!isGas(entity.systemUid, catalog.fluids, systems) && !isDrainage(entity.systemUid, systems) && locale === SupportedLocales.AU) {
        res.unshift({
            type: FieldType.Advert,
            title: "HTC Group",
            hasDefault: false,
            isCalculated: false,
            multiFieldId: "",
            property: "",
            params: {
                url: "https://docs.google.com/forms/d/11-yiFK2VZhiz7zIBNINtHNXqPTUw86GqfsJ76Cz8e7E",
                titleHtml: "<p style=\"font-size: small; margin:3px auto;\">Request a <b>Flow & Pressure Test</b></p>",
                subtitleHtml: "",
                imagePath: "/img/3rdparty/htctestinglogo.png"
            }
        });
    }

    res.push({
        property: "color",
        title: "Color",
        hasDefault: true,
        isCalculated: false,
        type: FieldType.Color,
        params: null,
        multiFieldId: "color"
    });

    return res;
}

export function fillFlowSourceDefaults(drawing: DrawingState, value: FlowSourceEntity) {
    const result = cloneSimple(value);

    // get system
    const system = drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }

    } else {
        throw new Error("Existing system not found for object " + JSON.stringify(value));
    }

    return result;
}
