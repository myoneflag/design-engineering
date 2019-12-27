import {Coord, DrawableEntity, DrawingState,} from '../../../../../src/store/document/types';
import {EntityType} from '../../../../../src/store/document/entities/types';
import {FieldType, PropertyField} from '../../../../../src/store/document/entities/property-field';
import {Catalog} from '../../../../../src/store/catalog/types';
import {SupportedPsdStandards} from '../../../../config';
import {parseCatalogNumberExact, parseCatalogNumberOrMin} from '../../../../../src/htmlcanvas/lib/utils';
import {cloneSimple} from '../../../../../src/lib/utils';

export default interface FixtureEntity extends DrawableEntity {
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

    continuousFlowColdLS: number | null;
    continuousFlowHotLS: number | null;

    fixtureUnits: number | null;
    probabilityOfUsagePCT: number | null;
}

export function makeFixtureFields(): PropertyField[] {
    return [
        { property: 'rotation', title: 'Rotation: (Degrees)', hasDefault: false, isCalculated: false,
            type: FieldType.Rotation, params: null, multiFieldId: null },

        { property: 'outletAboveFloorM', title: 'Height Above Floor (m)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: null, max: null }, multiFieldId: 'outletAboveFloorM' },

        { property: 'warmTempC', title: 'Warm Water Temperature (C)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: 100 },  multiFieldId: 'warmTempC' },

        { property: 'minInletPressureKPA', title: 'Min. Inlet Pressure (KPA)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'minInletPressureKPA' },

        { property: 'maxInletPressureKPA', title: 'Max. Inlet Pressure (KPA)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'maxInletPressureKPA' },

        { property: 'loadingUnitsCold', title: 'Loading Units (Cold)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'loadingUnitsCold' },

        { property: 'loadingUnitsHot', title: 'Loading Units (Hot)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'loadingUnitsHot' },

        { property: 'designFlowRateCold', title: 'Design Flow Rate (Cold, L/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'designFlowRateCold' },

        { property: 'designFlowRateHot', title: 'Design Flow Rate (Hot, L/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'designFlowRateHot' },

        { property: 'continuousFlowColdLS', title: 'Continuous Flow (Cold, L/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'continuousFlowColdLS' },

        { property: 'continuousFlowHotLS', title: 'Continuous Flow (Hot, L/s)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'continuousFlowHotLS' },

        { property: 'fixtureUnits', title: 'Fixture Units', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'fixtureUnits' },

        { property: 'probabilityOfUsagePCT', title: 'Prob. of Usage (%)', hasDefault: true, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'probabilityOfUsagePCT' },
    ];
}

export function fillFixtureFields(
    drawing: DrawingState | undefined,
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

    const psdStrategy = drawing ? drawing.metadata.calculationParams.psdMethod :
        SupportedPsdStandards.as35002018LoadingUnits;

    if (psdStrategy in defaultCatalog.fixtures[result.name].loadingUnits) {
        if (result.loadingUnitsCold === null) {
            result.loadingUnitsCold =
                parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].loadingUnits[psdStrategy].cold);
        }

        if (result.loadingUnitsHot === null) {
            result.loadingUnitsHot =
                parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].loadingUnits[psdStrategy].hot);
        }
    }
    if (result.designFlowRateCold === null) {
        result.designFlowRateCold = parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].qLS.cold);
    }
    if (result.designFlowRateHot === null) {
        result.designFlowRateHot = parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].qLS.hot);
    }

    let kek = defaultCatalog.fixtures[result.name].continuousFlowLS;
    if (kek) {
        if (result.continuousFlowColdLS == null) {
            result.continuousFlowColdLS = parseCatalogNumberExact(kek.cold);
        }
        if (result.continuousFlowHotLS == null) {
            result.continuousFlowHotLS = parseCatalogNumberExact(kek.hot);
        }
    } else {
        if (result.continuousFlowColdLS == null) {
            result.continuousFlowColdLS = 0;
        }
        if (result.continuousFlowHotLS == null) {
            result.continuousFlowHotLS = 0;
        }
    }

    return result;
}
