import {Color, ConnectableEntity, Coord, DocumentState, FlowSystemParameters} from '@/store/document/types';
import {CalculationTarget} from '@/store/document/calculations/types';
import FittingCalculation from '@/store/document/calculations/fitting-calculation';
import {EntityType} from '@/store/document/entities/types';
import {Choice} from '@/lib/types';
import {FieldType, PropertyField} from '@/store/document/entities/property-field';
import {assertUnreachable, cloneSimple} from '@/lib/utils';
import {DirectedValveConcrete, ValveType} from '@/store/document/entities/directed-valves/valve-types';
import {Prop} from 'vue/types/options';

export default interface DirectedValveEntity extends ConnectableEntity, CalculationTarget<FittingCalculation> {
    type: EntityType.DIRECTED_VALVE;
    center: Coord;
    systemUid: string;
    color: Color | null;

    sourceUid: string;

    valve: DirectedValveConcrete;
}

export function makeDirectedValveFields(
    systems: FlowSystemParameters[],
    valve: DirectedValveConcrete,
): PropertyField[] {
    const fields: PropertyField[] = [
        { property: 'systemUid', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems },  multiFieldId: 'systemUid' },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null,  multiFieldId: 'color' },
    ];

    switch (valve.type) {
        case ValveType.CHECK_VALVE:
            break;
        case ValveType.ISOLATION_VALVE:
            fields.push(
                { property: 'valve.isClosed', title: 'Is Closed:', hasDefault: false, isCalculated: false,
                    type: FieldType.Boolean, params: null,  multiFieldId: 'isClosed' },
            );
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

export function fillDirectedValveFields(
    doc: DocumentState,
    value: DirectedValveEntity,
) {
    const result = cloneSimple(value);

    // get system
    const system = doc.drawing.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        throw new Error('Existing system not found for object ' + JSON.stringify(value));
    }

    return result;
}
