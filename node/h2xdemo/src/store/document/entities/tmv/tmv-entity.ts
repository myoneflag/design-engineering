import {
    ConnectableEntity,
    Coord,
    DocumentState,
    DrawableEntity,
    FlowSystemParameters,
} from '@/store/document/types';
import {EntityType} from '@/store/document/entities/types';
import {FieldType, PropertyField} from '@/store/document/entities/property-field';
import * as _ from 'lodash';
import ValveEntity from '@/store/document/entities/valve-entity';
import CatalogState, {Catalog} from '@/store/catalog/types';
import InvisibleNodeEntity from '@/store/document/entities/Invisible-node-entity';
import TmvCalculation from '@/store/document/calculations/tmv-calculation';
import {CalculationTarget} from '@/store/document/calculations/types';
import {parseCatalogNumberOrMin} from '@/htmlcanvas/lib/utils';
import {cloneSimple} from '@/lib/utils';

export default interface TmvEntity extends DrawableEntity, CalculationTarget<TmvCalculation> {
    center: Coord;
    type: EntityType.TMV;
    rotation: number;
    coldRoughInUid: string;
    hotRoughInUid: string;
    warmOutputUid: string;
    coldOutputUid: string | null;


    pipeDistanceMM: number;
    valveLengthMM: number;
    heightAboveFloorM: number;

    outputTemperatureC: number;

    minInletPressureKPA: number | null;
    maxInletPressureKPA: number | null;
    maxHotColdPressureDifferentialPCT: number | null;
    minFlowRateLS: number | null;
    maxFlowRateLS: number | null;

    calculation: TmvCalculation | null;
}

export interface SystemNodeEntity extends InvisibleNodeEntity {
    type: EntityType.SYSTEM_NODE;
    systemUid: string;
    configuration: FlowConfiguration;
}

export function makeTMVFields(): PropertyField[] {
    return [
        { property: 'rotation', title: 'Rotation: (Degrees)', hasDefault: false, isCalculated: false,
            type: FieldType.Rotation, params: null,  multiFieldId: 'rotation' },

        { property: 'heightAboveFloorM', title: 'Height Above Floor (m)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null },  multiFieldId: 'heightAboveFloorM' },

        { property: 'outputTemperatureC', title: 'Output Temperature (c)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: 100 },  multiFieldId: 'outputTemperatureC' },

        { property: 'minInletPressureKPA', title: 'Min. Inlet Pressure (KPA)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'minInletPressureKPA' },

        { property: 'maxInletPressureKPA', title: 'Max. Inlet Pressure (KPA)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'maxInletPressureKPA' },

        { property: 'maxHotColdPressureDifferentialPCT', title: 'Max. Hot/Cold Pressure Differential (%):',
            hasDefault: true, isCalculated: false, type: FieldType.Number, params: { min: 0, max: 100 },
            multiFieldId: 'maxHotColdPressureDifferentialPCT' },

        { property: 'minFlowRateLS', title: 'Min. Flow Rate (L/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'minFlowRateLS' },

        { property: 'maxFlowRateLS', title: 'Max. Flow Rate (L/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'maxFlowRateLS' },
    ];
}

export function fillTMVFields(
    doc: DocumentState,
    defaultCatalog: Catalog,
    value: TmvEntity,
) {
    const result = cloneSimple(value);

    const arr: Array<
        'minInletPressureKPA' |
        'maxInletPressureKPA' |
        'maxHotColdPressureDifferentialPCT' |
        'minFlowRateLS' |
        'maxFlowRateLS'> = [
        'minInletPressureKPA',
        'maxInletPressureKPA',
        'maxHotColdPressureDifferentialPCT',
        'minFlowRateLS',
        'maxFlowRateLS',
    ];

    arr.forEach((field) => {
        if (result[field] === null) {
            result[field] = parseCatalogNumberOrMin(defaultCatalog.mixingValves.tmv[field]);
        }
    });
    return result;
}

export enum FlowConfiguration {
    INPUT,
    OUTPUT,
    BOTH,
}
