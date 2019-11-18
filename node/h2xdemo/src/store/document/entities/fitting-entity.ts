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
import FittingCalculation from '@/store/document/calculations/fitting-calculation';
import {CalculationTarget} from '@/store/document/calculations/types';
import {Choice} from '@/lib/types';
import {cloneSimple} from '@/lib/utils';

export default interface FittingEntity extends ConnectableEntity, CalculationTarget<FittingCalculation> {
    type: EntityType.FITTING;
    center: Coord;
    systemUid: string;
    color: Color | null;

    calculation: FittingCalculation | null;
}

export function makeValveFields(
    valveTypes: Choice[],
    systems: FlowSystemParameters[],
): PropertyField[] {
    return [
        { property: 'systemUid', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems },  multiFieldId: 'systemUid' },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null,  multiFieldId: 'color' },

    ];
}

export function fillValveDefaultFields(
    doc: DocumentState,
    value: FittingEntity,
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
