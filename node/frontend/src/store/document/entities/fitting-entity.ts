import {
    Color,
    ConnectableEntity,
    Coord,
    DocumentState,
    FlowSystemParameters,
} from '../../../../src/store/document/types';
import {FieldType, PropertyField} from '../../../../src/store/document/entities/property-field';
import * as _ from 'lodash';
import PipeEntity from '../../../../src/store/document/entities/pipe-entity';
import {EntityType} from '../../../../src/store/document/entities/types';
import FittingCalculation from '../../../../src/store/document/calculations/fitting-calculation';
import {CalculationTarget} from '../../../../src/store/document/calculations/types';
import {Choice} from '../../../../src/lib/types';
import {cloneSimple} from '../../../../src/lib/utils';

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
