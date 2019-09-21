import {ConnectableEntity, Coord, DocumentState, DrawableEntity, FlowSystemParameters} from '@/store/document/types';
import {EntityType} from '@/store/document/entities/types';
import {FieldType, PropertyField} from '@/store/document/entities/property-field';
import * as _ from 'lodash';
import ValveEntity from '@/store/document/entities/valve-entity';
import CatalogState, {Catalog} from '@/store/catalog/types';
import InvisibleNodeEntity from '@/store/document/entities/Invisible-node-entity';
import {PSD_METHODS} from '../../../../config';

export default interface FixtureEntity extends DrawableEntity {
    center: Coord;
    type: EntityType.FIXTURE;
    name: string;
    rotation: number;
    coldRoughInUid: string;
    warmRoughInUid: string | null;

    pipeDistanceMM: number;
    outletAboveFloorM: number | null;

    warmTempC: number | null;

    minInletPressureKPA: number | null;
    maxInletPressureKPA: number | null;

    loadingUnitsCold: number | null;
    loadingUnitsHot: number | null;
    fixtureUnits: number | null;
    probabilityOfUsagePCT: number | null;
}

export function makeFixtureFields(): PropertyField[] {
    return [
        { property: 'rotation', title: 'Rotation: (Degrees)', hasDefault: false, isCalculated: false,
            type: FieldType.Rotation, params: null },

        { property: 'outletAboveFloorM', title: 'Height Above Floor (m)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null } },

        { property: 'warmTempC', title: 'Warm Water Temperature (C)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: 100 } },


        { property: 'minInletPressureKPA', title: 'Min. Inlet Pressure (KPA)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'maxInletPressureKPA', title: 'Max. Inlet Pressure (KPA)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'loadingUnitsCold', title: 'Loading Units (Cold)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'loadingUnitsHot', title: 'Loading Units (Hot)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'fixtureUnits', title: 'Fixture Units', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'probabilityOfUsagePCT', title: 'Prob. of Usage (%)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },
    ];
}

export function fillFixtureFields(
    doc: DocumentState,
    defaultCatalog: Catalog,
    value: FixtureEntity,
) {
    const result = _.cloneDeep(value);


    const arr: Array<
        'minInletPressureKPA' |
        'maxInletPressureKPA' |
        'warmTempC' |
        'outletAboveFloorM' |
        'fixtureUnits' |
        'probabilityOfUsagePCT'
        > = [
        'minInletPressureKPA',
        'maxInletPressureKPA',
        'warmTempC',
        'outletAboveFloorM',
        'fixtureUnits',
        'probabilityOfUsagePCT',
    ];

    arr.forEach((field) => {
        if (result[field] === null) {
            result[field] = defaultCatalog.fixtures[result.name][field];
        }
    });

    if (!result.loadingUnitsCold) {
        result.loadingUnitsCold = defaultCatalog.fixtures[result.name].loadingUnits.as3500.cold;
    }

    if (!result.loadingUnitsHot) {
        result.loadingUnitsHot = defaultCatalog.fixtures[result.name].loadingUnits.as3500.hot;
    }
    return result;
}
