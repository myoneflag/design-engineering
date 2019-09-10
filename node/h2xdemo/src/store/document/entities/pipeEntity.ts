import {Color, DocumentState, DrawableEntity, FlowSystemParameters, WithID} from '@/store/document/types';
import {FieldType, PropertyField} from '@/store/document/entities/property-field';
import * as _ from 'lodash';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';

export default interface PipeEntity extends DrawableEntity {
    systemUid: string;
    material: string | null;
    lengthM: number | null;
    maximumVelocityMS: number | null;
    diameterMM: number | null;
    heightAboveFloorM: number;

    color: Color | null;
    endpointUid: [string, string];
}

export function makePipeFields(materials: string[], systems: FlowSystemParameters[]): PropertyField[] {
    return [
        { property: 'systemUid', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems } },

        { property: 'material', title: 'Material', hasDefault: true, isCalculated: false,
            type: FieldType.Choice, params: { choices: materials } },

        { property: 'lengthM', title: 'Length (m)', hasDefault: false, isCalculated: true,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null },

        { property: 'maximumVelocityMS', title: 'Maximum Velocity (m/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'diameterMM', title: 'Diameter', hasDefault: false, isCalculated: true,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'heightAboveFloorM', title: 'Height Above Floor (m)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null } },
    ];
}

export function fillPipeDefaultFields(
    doc: DocumentState,
    computedLengthM: number,
    value: PipeEntity,
) {
    const result = _.cloneDeep(value);

    // get system
    const system = doc.drawing.flowSystems.find((s) => s.uid === value.systemUid);

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
