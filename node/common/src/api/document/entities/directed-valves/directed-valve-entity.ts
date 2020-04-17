import { EntityType } from "../types";
import { FieldType, PropertyField } from "../property-field";
import { DirectedValveConcrete, ValveType } from "./valve-types";
import { assertUnreachable } from "../../../config";
import { Color, ConnectableEntity, Coord, DrawingState } from "../../drawing";
import { Catalog } from "../../../catalog/types";
import { Choice, parseCatalogNumberExact, parseCatalogNumberOrMin } from "../../../../lib/utils";
import { convertPipeDiameterFromMetric, Units } from "../../../../lib/measurements";

export default interface DirectedValveEntity extends ConnectableEntity {
    type: EntityType.DIRECTED_VALVE;
    center: Coord;
    systemUidOption: string | null;
    color: Color | null;

    sourceUid: string;

    valve: DirectedValveConcrete;
}

export function makeDirectedValveFields(
    entity: DirectedValveEntity,
    catalog: Catalog,
    drawing: DrawingState
): PropertyField[] {
    const fields: PropertyField[] = [];

    fields.push(
        {
            property: "systemUidOption",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems: drawing.metadata.flowSystems },
            multiFieldId: "systemUid"
        },
    );
    fields.push(
        {
            property: "color",
            title: "Color",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Color,
            params: null,
            multiFieldId: "color"
        }
    );

    switch (entity.valve.type) {
        case ValveType.CHECK_VALVE:
            break;
        case ValveType.ISOLATION_VALVE:
            /* This will be a custom part of the property box
            fields.push(
                { property: 'valve.isClosed', title: 'Is Closed:', hasDefault: false, isCalculated: false,
                    type: FieldType.Boolean, params: null,  multiFieldId: 'isClosed' },
            );*/
            fields.push({
                property: "valve.makeIsolationCaseOnRingMains",
                title: "Make Isolation Case on Ring Mains:",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Boolean,
                params: null,
                multiFieldId: "makeIsolationCaseOnRingMains",
            });
            break;
        case ValveType.RPZD_DOUBLE_ISOLATED:
        case ValveType.RPZD_DOUBLE_SHARED:
        case ValveType.RPZD_SINGLE: {

            const sizes = Object.keys(catalog.backflowValves[entity.valve.catalogId].valvesBySize).map((s) => {
                const val = convertPipeDiameterFromMetric(drawing.metadata.units, parseCatalogNumberExact(s));
                const c: Choice = {
                    disabled: false, key: parseCatalogNumberOrMin(s), name: val[1] + val[0],
                };
                return c;
            });
            fields.push({
                property: "valve.sizeMM",
                title: "Size",
                hasDefault: false,
                isCalculated: true,
                type: FieldType.Choice,
                params: { choices: sizes, initialValue: sizes[0].key },
                multiFieldId: "diameterMM",
                requiresInput: false,
                units: Units.Millimeters
            });
            if (entity.valve.type === ValveType.RPZD_DOUBLE_ISOLATED) {
                fields.push({
                    property: "valve.isolateOneWhenCalculatingHeadLoss",
                    title: "Isolate When Calculation Head Loss?",
                    hasDefault: false,
                    isCalculated: false,
                    params: null,
                    type: FieldType.Boolean,
                    multiFieldId: "isolateOneWhenCalculatingHeadLoss"
                });
            }
            break;
        }
        case ValveType.BALANCING:
            break;
        case ValveType.WATER_METER:
            break;
        case ValveType.STRAINER:
            break;
        case ValveType.PRV_SINGLE:
        case ValveType.PRV_DOUBLE:
        case ValveType.PRV_TRIPLE: {
            const sizes = Object.keys(catalog.prv).map((s) => {
                const val = convertPipeDiameterFromMetric(drawing.metadata.units, parseCatalogNumberExact(s));
                const c: Choice = {
                    disabled: false, key: parseCatalogNumberOrMin(s), name: val[1] + val[0],
                };
                return c;
            });
            fields.push({
                property: "valve.sizeMM",
                title: "Size",
                hasDefault: false,
                isCalculated: true,
                type: FieldType.Choice,
                params: { choices: sizes, initialValue: sizes[0].key },
                multiFieldId: "diameterMM",
                requiresInput: false,
                units: Units.Millimeters
            });
            fields.push({
                property: "valve.targetPressureKPA",
                title: "Target Pressure",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "targetPressure",
                requiresInput: true,
                units: Units.KiloPascals,
            });
            if (entity.valve.type === ValveType.PRV_DOUBLE ||
                entity.valve.type === ValveType.PRV_TRIPLE
            ) {
                fields.push({
                    property: "valve.isolateOneWhenCalculatingHeadLoss",
                    title: "Isolate When Calculation Head Loss?",
                    hasDefault: false,
                    isCalculated: false,
                    params: null,
                    type: FieldType.Boolean,
                    multiFieldId: "isolateOneWhenCalculatingHeadLoss"
                });
            }
            break;
        }
        default:
            assertUnreachable(entity.valve);
    }

    return fields;
}

