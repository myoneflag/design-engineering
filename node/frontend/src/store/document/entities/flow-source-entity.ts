import {
    ConnectableEntity,
    Color,
    Coord,
    DocumentState,
    FlowSystemParameters,
} from '../../../../src/store/document/types';
import {FieldType, PropertyField} from '../../../../src/store/document/entities/property-field';
import * as _ from 'lodash';
import {EntityType} from '../../../../src/store/document/entities/types';
import FlowSourceCalculation from '../../../../src/store/document/calculations/flow-source-calculation';
import {CalculationTarget} from '../../../../src/store/document/calculations/types';
import {Choice} from '../../../../src/lib/types';
import {cloneSimple} from '../../../../src/lib/utils';

export default interface FlowSourceEntity extends ConnectableEntity, CalculationTarget<FlowSourceCalculation> {
    type: EntityType.FLOW_SOURCE;
    center: Coord;
    systemUid: string;

    diameterMM: number;
    maximumVelocityMS: number | null; // null means default
    heightAboveFloor: number;
    material: string | null;
    spareCapacity: number | null;
    color: Color | null;
    temperatureC: number | null;
    pressureKPA: number | null;

    calculation: FlowSourceCalculation | null;
}

export function makeFlowSourceFields(materials: Choice[], systems: FlowSystemParameters[]): PropertyField[] {
    return [
        { property: 'systemUid', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems },  multiFieldId: 'systemUid' },

        { property: 'diameterMM', title: 'Diameter (mm)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'diameterMM' },

        { property: 'maximumVelocityMS', title: 'Maximum Velocity (m/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'maximumVelocityMS' },

        { property: 'heightAboveFloorM', title: 'Pressure Height (m)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null },  multiFieldId: 'heightAboveFloorM' },

        { property: 'material', title: 'Material', hasDefault: true, isCalculated: false,
            type: FieldType.Choice, params: { choices: materials},  multiFieldId: 'material' },

        { property: 'spareCapacity', title: 'Spare Capacity (%)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: 100 },  multiFieldId: 'spareCapacity' },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null,  multiFieldId: 'color' },

        { property: 'temperatureC', title: 'Temperature (C)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: 100 },  multiFieldId: 'temperatureC' },

        { property: 'pressureKPA', title: 'Pressure (kPA)', hasDefault: false, isCalculated: false, requiresInput: true,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'pressureKPA' },
    ];
}

export function fillFlowSourceDefaults(doc: DocumentState, value: FlowSourceEntity) {
    const result = cloneSimple(value);

    // get system
    const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

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
