import {Color, ConnectableEntity, Coord, DocumentState, FlowSystemParameters} from '../../../../../src/store/document/types';
import {CalculationTarget} from '../../../../../src/store/document/calculations/types';
import FittingCalculation from '../../../../../src/store/document/calculations/fitting-calculation';
import {EntityType} from '../../../../../src/store/document/entities/types';
import {FieldType, PropertyField} from '../../../../../src/store/document/entities/property-field';
import {cloneSimple} from '../../../../../src/lib/utils';
import {DirectedValveConcrete, ValveType} from '../../../../../src/store/document/entities/directed-valves/valve-types';
import {ObjectStore} from '../../../../../src/htmlcanvas/lib/types';
import Pipe from '../../../../../src/htmlcanvas/objects/pipe';
import {ConnectableEntityConcrete} from '../../../../../src/store/document/entities/concrete-entity';
import DirectedValveCalculation from '../../../../../src/store/document/calculations/directed-valve-calculation';
import {assertUnreachable} from "../../../../../src/config";

export default interface DirectedValveEntity extends ConnectableEntity, CalculationTarget<DirectedValveCalculation> {
    type: EntityType.DIRECTED_VALVE;
    center: Coord;
    systemUidOption: string | null;
    color: Color | null;

    sourceUid: string;

    valve: DirectedValveConcrete;
}

export function makeDirectedValveFields(
    systems: FlowSystemParameters[],
    valve: DirectedValveConcrete,
): PropertyField[] {
    const fields: PropertyField[] = [
        { property: 'systemUidOption', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems },  multiFieldId: 'systemUid' },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null,  multiFieldId: 'color' },
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
            fields.push(
                { property: 'valve.targetPressureKPA', title: 'Target Pressure (KPA):', hasDefault: false,
                    isCalculated: false, type: FieldType.Number, params: {min: 0, max: null},
                    multiFieldId: 'targetPressure', requiresInput: true },
            );
            break;
        case ValveType.RPZD:
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
    value: ConnectableEntityConcrete,
): string | undefined {

    switch (value.type) {
        case EntityType.FITTING:
        case EntityType.FLOW_SOURCE:
        case EntityType.SYSTEM_NODE:
            // system will depend on neighbours
            return value.systemUid;
        case EntityType.DIRECTED_VALVE:
            if (value.systemUidOption) {
                return value.systemUidOption;
            } else {
                // system will depend on neighbours
                if (value.connections.length === 0) {
                    return undefined;
                } else if (value.connections.length === 1) {
                    return (objectStore.get(value.connections[0]) as Pipe).entity.systemUid;
                } else {
                    return (objectStore.get(value.sourceUid) as Pipe).entity.systemUid;
                }
            }

    }
}

export function fillDirectedValveFields(
    doc: DocumentState,
    objectStore: ObjectStore,
    value: DirectedValveEntity,
) {
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
            result.color = {hex: '#000000'};
        }
    }

    return result;
}
