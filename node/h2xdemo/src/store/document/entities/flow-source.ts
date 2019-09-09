import {Color, Coord, DocumentState, DrawableEntity, FlowSystemParameters} from '@/store/document/types';
import {FieldType, PropertyField} from '@/store/document/entities/property-field';
import * as _ from 'lodash';

export default interface FlowSource extends DrawableEntity {
    center: Coord;
    systemUid: string;

    radiusMM: number;
    maximumVelocityMS: number | null; // null means default
    heightAboveFloorM: number;
    material: string | null;
    spareCapacity: number | null;
    color: Color | null;
    temperatureC: number | null;
    pressureKPA: number;
}

export function makeFlowSourceFields(materials: string[], systems: FlowSystemParameters[]): PropertyField[] {
    return [
        { property: 'systemUid', title: 'Flow System', hasDefault: false,
            type: FieldType.FlowSystemChoice, params: { systems } },

        { property: 'radiusMM', title: 'Radius (mm)', hasDefault: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'maximumVelocityMS', title: 'Maximum Velocity (m/s)', hasDefault: true,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'heightAboveFloorM', title: 'Height Above Floor (m)', hasDefault: false,
            type: FieldType.Number, params: { min: null, max: null } },

        { property: 'material', title: 'Material', hasDefault: true,
            type: FieldType.Choice, params: { choices: materials} },

        { property: 'spareCapacity', title: 'Spare Capacity (%)', hasDefault: true,
            type: FieldType.Number, params: { min: 0, max: 100 } },

        { property: 'color', title: 'Color:', hasDefault: true,
            type: FieldType.Color, params: null },

        { property: 'temperatureC', title: 'Temperature (C)', hasDefault: true,
            type: FieldType.Number, params: { min: 0, max: 100 } },

        { property: 'pressureKPA', title: 'Pressure (kPA)', hasDefault: true,
            type: FieldType.Number, params: { min: 0, max: null } },
    ];
}

export function fillDefaults(doc: DocumentState, value: FlowSource) {
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
        if (result.spareCapacity == null) {
            result.spareCapacity = system.spareCapacity;
        }
        if (result.color == null) {
            result.color = system.color;
        }
        if (result.temperatureC == null) {
            result.temperatureC = system.temperature;
        }
    } else {
        throw new Error('Existing system not found for object ' + JSON.stringify(value));
    }

    return result;
}
