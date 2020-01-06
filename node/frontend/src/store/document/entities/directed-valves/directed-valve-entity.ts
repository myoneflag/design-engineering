import {
    Color,
    ConnectableEntity,
    Coord,
    DocumentState,
    FlowSystemParameters,
    NetworkType
} from "../../../../../src/store/document/types";
import { EntityType } from "../../../../../src/store/document/entities/types";
import { FieldType, PropertyField } from "../../../../../src/store/document/entities/property-field";
import { cloneSimple } from "../../../../../src/lib/utils";
import {
    DirectedValveConcrete,
    ValveType
} from "../../../../../src/store/document/entities/directed-valves/valve-types";
import Pipe from "../../../../../src/htmlcanvas/objects/pipe";
import { ConnectableEntityConcrete } from "../../../../../src/store/document/entities/concrete-entity";
import { assertUnreachable } from "../../../../../src/config";
import { ObjectStore } from "../../../../htmlcanvas/lib/object-store";

export default interface DirectedValveEntity extends ConnectableEntity {
    type: EntityType.DIRECTED_VALVE;
    center: Coord;
    systemUidOption: string | null;
    color: Color | null;

    sourceUid: string;

    valve: DirectedValveConcrete;
}

export function makeDirectedValveFields(
    systems: FlowSystemParameters[],
    valve: DirectedValveConcrete
): PropertyField[] {
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
            title: "Color:",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Color,
            params: null,
            multiFieldId: "color"
        }
    ];

    switch (valve.type) {
        case ValveType.CHECK_VALVE:
            break;
        case ValveType.ISOLATION_VALVE:
            /* This will be a custom part of the property box
            fields.push(
                { property: 'valve.isClosed', title: 'Is Closed:', hasDefault: false, isCalculated: false,
                    type: FieldType.Boolean, params: null,  multiFieldId: 'isClosed' },
            );*/
            break;
        case ValveType.PRESSURE_RELIEF_VALVE:
            fields.push({
                property: "valve.targetPressureKPA",
                title: "Target Pressure (KPA):",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "targetPressure",
                requiresInput: true
            });
            break;
        case ValveType.RPZD_DOUBLE_ISOLATED:
        case ValveType.RPZD_DOUBLE_SHARED:
        case ValveType.RPZD_SINGLE:
            fields.push({
                property: "valve.sizeMM",
                title: "Size (mm):",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "diameterMM",
                requiresInput: false
            });
            if (valve.type === ValveType.RPZD_DOUBLE_ISOLATED) {
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
        case ValveType.WATER_METER:
            break;
        case ValveType.STRAINER:
            break;
        default:
            assertUnreachable(valve);
    }

    return fields;
}

export function determineConnectableSystemUid(
    objectStore: ObjectStore,
    value: ConnectableEntityConcrete
): string | undefined {
    switch (value.type) {
        case EntityType.FITTING:
        case EntityType.RISER:
        case EntityType.FLOW_SOURCE:
        case EntityType.SYSTEM_NODE:
            return value.systemUid;
        case EntityType.DIRECTED_VALVE:
        case EntityType.LOAD_NODE:
            // system will depend on neighbours
            if (value.systemUidOption) {
                return value.systemUidOption;
            } else {
                // system will depend on neighbours
                if (objectStore.getConnections(value.uid).length === 0) {
                    return undefined;
                } else {
                    return (objectStore.get(objectStore.getConnections(value.uid)[0]) as Pipe).entity.systemUid;
                }
            }
    }
    assertUnreachable(value);
}

export function determineConnectableNetwork(
    objectStore: ObjectStore,
    value: ConnectableEntityConcrete
): NetworkType | undefined {
    let retVal = NetworkType.RETICULATIONS;
    if (value.type === EntityType.RISER) {
        retVal = NetworkType.RISERS;
    } else {
        for (const conn of objectStore.getConnections(value.uid)) {
            const o = objectStore.get(conn) as Pipe;
            if (o.entity.network === NetworkType.CONNECTIONS) {
                retVal = NetworkType.CONNECTIONS;
            }
        }
    }
    return retVal;
}

export function fillDirectedValveFields(doc: DocumentState, objectStore: ObjectStore, value: DirectedValveEntity) {
    const result = cloneSimple(value);

    const systemUid = determineConnectableSystemUid(objectStore, value);
    const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === systemUid);

    result.systemUidOption = system ? system.uid : null;

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        if (result.color == null) {
            result.color = { hex: "#888888" };
        }
    }

    return result;
}
