import {
    Color,
    DocumentState,
    DrawableEntity, DrawingState,
    FlowSystemParameters,
    WithID,
} from '../../../../src/store/document/types';
import {FieldType, PropertyField} from '../../../../src/store/document/entities/property-field';
import * as _ from 'lodash';
import BackedDrawableObject from '../../../../src/htmlcanvas/lib/backed-drawable-object';
import {EntityType} from '../../../../src/store/document/entities/types';
import PipeCalculation from '../../../../src/store/document/calculations/pipe-calculation';
import {CalculationTarget} from '../../../../src/store/document/calculations/types';
import {Choice} from '../../../../src/lib/types';
import {cloneSimple} from '../../../../src/lib/utils';

export default interface PipeEntity extends DrawableEntity, CalculationTarget<PipeCalculation> {
    type: EntityType.PIPE;

    parentUid: null;

    systemUid: string;
    material: string | null;
    lengthM: number | null;
    maximumVelocityMS: number | null;
    diameterMM: number | null;
    heightAboveFloorM: number;

    color: Color | null;
    endpointUid: [string, string];

    calculation: PipeCalculation | null;
}

export function makePipeFields(materials: Choice[], systems: FlowSystemParameters[]): PropertyField[] {
    return [
        { property: 'systemUid', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems },  multiFieldId: 'systemUid' },

        { property: 'material', title: 'Material', hasDefault: true, isCalculated: false,
            type: FieldType.Choice, params: { choices: materials },  multiFieldId: 'material' },

        { property: 'lengthM', title: 'Length (m)', hasDefault: false, isCalculated: true,
            type: FieldType.Number, params: { min: 0, max: null, initialValue: 0 },  multiFieldId: null },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null,  multiFieldId: 'color' },

        { property: 'maximumVelocityMS', title: 'Maximum Velocity (m/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'maximumVelocityMS' },

        { property: 'diameterMM', title: 'Diameter', hasDefault: false, isCalculated: true,
            type: FieldType.Number, params: { min: 0, max: null, initialValue: 50 },  multiFieldId: 'diameterMM' },

        { property: 'heightAboveFloorM', title: 'Height Above Floor (m)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null },  multiFieldId: 'heightAboveFloorM' },
    ];
}

export function fillPipeDefaultFields(
    drawing: DrawingState,
    computedLengthM: number,
    value: PipeEntity,
) {
    const result = cloneSimple(value);

    // get system
    const system = drawing.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.maximumVelocityMS == null) {
            result.maximumVelocityMS = system.velocity;
        }
        if (result.material == null) {
            result.material = system.material;
        }
        if (result.lengthM == null) {
            // We don't want entities to depend on objects. So their distance is to be provided instead, because
            // computing them here will require a harmful dependency.
            result.lengthM = computedLengthM;
        }
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        throw new Error('Existing system not found for object ' + JSON.stringify(value));
    }

    return result;
}

export function replacePipeEndpointLocal(entity: PipeEntity, from: string, to: string) {
    const index = entity.endpointUid.indexOf(from);
    if (index === -1) {
        throw new Error('Endpoint to replace doesn\'t exist');
    }
    entity.endpointUid.splice(index, 1, to);
}