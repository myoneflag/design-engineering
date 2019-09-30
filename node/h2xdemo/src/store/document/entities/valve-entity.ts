import {
    Color,
    ConnectableEntity,
    Coord,
    DocumentState,
    FlowSystemParameters,
} from '@/store/document/types';
import {FieldType, PropertyField} from '@/store/document/entities/property-field';
import * as _ from 'lodash';
import PipeEntity from '@/store/document/entities/pipe-entity';
import {EntityType} from '@/store/document/entities/types';
import ValveCalculation from '@/store/document/calculations/valve-calculation';
import {CalculationTarget} from '@/store/document/calculations/types';
import {Choice} from '@/lib/types';

export default interface ValveEntity extends ConnectableEntity, CalculationTarget<ValveCalculation> {
    type: EntityType.VALVE;
    center: Coord;
    systemUid: string;
    valveType: string;
    color: Color | null;

    calculation: ValveCalculation | null;
}

export function makeValveFields(
    valveTypes: Choice[],
    systems: FlowSystemParameters[],
): PropertyField[] {
    return [
        { property: 'systemUid', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems } },

        { property: 'valveType', title: 'Valve Type', hasDefault: false, isCalculated: false,
            type: FieldType.Choice, params: { choices: valveTypes } },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null },

    ];
}

export function fillValveDefaultFields(
    doc: DocumentState,
    value: ValveEntity,
) {
    const result = _.cloneDeep(value);

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
