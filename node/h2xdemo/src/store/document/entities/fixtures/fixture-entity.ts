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
import {DISPLAY_PSD_METHODS} from '../../../../config';
import FixtureCalculation from '@/store/document/calculations/fixture-calculation';
import {CalculationTarget} from '@/store/document/calculations/types';
import {parseCatalogNumberOrMin} from '@/htmlcanvas/lib/utils';
import {cloneSimple} from '@/lib/utils';

export default interface FixtureEntity extends DrawableEntity, CalculationTarget<FixtureCalculation> {
    center: Coord;
    type: EntityType.FIXTURE;
    name: string;
    abbreviation: string;

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

    designFlowRateCold: number | null;
    designFlowRateHot: number | null;

    fixtureUnits: number | null;
    probabilityOfUsagePCT: number | null;

    calculation: FixtureCalculation | null;
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

        { property: 'designFlowRateCold', title: 'Design Flow Rate (Cold, L/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null } },

        { property: 'designFlowRateHot', title: 'Design Flow Rate (Hot, L/s)', hasDefault: true, isCalculated: false,
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
): FixtureEntity {
    const result = cloneSimple(value);


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
            result[field] = parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name][field]);
        }
    });

    const psdStrategy = doc.drawing.calculationParams.psdMethod;

    if (psdStrategy in defaultCatalog.fixtures[result.name].loadingUnits) {
        if (!result.loadingUnitsCold) {
            result.loadingUnitsCold =
                parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].loadingUnits[psdStrategy].cold);
        }

        if (!result.loadingUnitsHot) {
            result.loadingUnitsHot =
                parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].loadingUnits[psdStrategy].hot);
        }
    }
    if (!result.designFlowRateCold) {
        result.designFlowRateCold = parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].qLS.cold);
    }
    if (!result.designFlowRateHot) {
        result.designFlowRateHot = parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].qLS.hot);
    }

    return result;
}
