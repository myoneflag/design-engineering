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
import RiserCalculations from '../calculations/riser-calculations';
import {Choice, LEVEL_HEIGHT_DIFF_M} from '../../../../src/lib/types';
import {cloneSimple} from '../../../../src/lib/utils';

export default interface RiserEntity extends ConnectableEntity {
    type: EntityType.RISER;
    center: Coord;
    systemUid: string;

    diameterMM: number | null;
    maximumVelocityMS: number | null; // null means default
    pressureSourceHeightM: number | null;
    material: string | null;
    color: Color | null;
    temperatureC: number | null;
    pressureKPA: number | null;

    bottomHeightM: number | null;
    topHeightM: number | null;
}

export function makeRiserFields(materials: Choice[], systems: FlowSystemParameters[]): PropertyField[] {
    return [
        { property: 'systemUid', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems },  multiFieldId: 'systemUid' },


        { property: 'pressureKPA', title: 'Pressure (kPA)', hasDefault: false, isCalculated: false, requiresInput: true,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'pressureKPA' },

        { property: 'pressureSourceHeightM', title: 'Source Height (m)', hasDefault: false, isCalculated: false, requiresInput: true,
            type: FieldType.Number, params: { min: null, max: null },  multiFieldId: 'pressureSourceHeightM' },


        { property: 'bottomHeightM', title: 'Bottom Height (M)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null },  multiFieldId: 'bottomHeightM' },

        { property: 'topHeightM', title: 'Top Height (M)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null },  multiFieldId: 'topHeightM' },

        { property: 'maximumVelocityMS', title: 'Maximum Velocity (m/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'maximumVelocityMS' },


        { property: 'diameterMM', title: 'Diameter (mm)', hasDefault: false, isCalculated: true,
            type: FieldType.Number, params: { min: 0, max: null, initialValue: 100 },  multiFieldId: 'diameterMM' },


        { property: 'material', title: 'Material', hasDefault: true, isCalculated: false,
            type: FieldType.Choice, params: { choices: materials},  multiFieldId: 'material' },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null,  multiFieldId: 'color' },

        { property: 'temperatureC', title: 'Temperature (C)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: 100 },  multiFieldId: 'temperatureC' },

    ];
}

export function fillRiserDefaults(doc: DocumentState, value: RiserEntity) {
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
        if (result.color == null) {
            result.color = system.color;
        }
        if (result.temperatureC == null) {
            result.temperatureC = system.temperature;
        }
        if (result.bottomHeightM == null) {
            result.bottomHeightM = result.pressureSourceHeightM || 0;
            Object.values(doc.drawing.levels).forEach((v) => {
                result.bottomHeightM = Math.min(result.bottomHeightM!, v.floorHeightM);
            });
        }
        if (result.topHeightM == null) {
            result.topHeightM = result.pressureSourceHeightM || 0;
            Object.values(doc.drawing.levels).forEach((v) => {
                result.topHeightM = Math.max(result.topHeightM!, v.floorHeightM + LEVEL_HEIGHT_DIFF_M);
            });
        }
    } else {
        throw new Error('Existing system not found for object ' + JSON.stringify(value));
    }

    return result;
}
