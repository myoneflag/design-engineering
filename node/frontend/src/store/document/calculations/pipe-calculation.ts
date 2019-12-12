import {FieldCategory, CalculationField, Units} from '../../../../src/store/document/calculations/calculation-field';
import {Calculation, PsdCalculation} from '../../../../src/store/document/calculations/types';
import {DrawingState} from '../../../../src/store/document/types';
import {isGermanStandard} from '../../../../src/config';
import PipeEntity, {fillPipeDefaultFields} from '../../../../src/store/document/entities/pipe-entity';
import {Catalog} from '../../../../src/store/catalog/types';

export default interface PipeCalculation extends PsdCalculation, Calculation {
    peakFlowRate: number | null;
    optimalInnerPipeDiameterMM: number | null;
    realNominalPipeDiameterMM: number | null;
    realInternalDiameterMM: number | null;
    pressureDropKpa: number | null;

    velocityRealMS: number | null;

    temperatureRange: string | null;
}


export function makePipeCalculationFields(
    entity: PipeEntity,
    settings: DrawingState,
    catalog?: Catalog
): CalculationField[] {
    const psdUnit = isGermanStandard(settings.metadata.calculationParams.psdMethod) ? 'Design Flow Rate' : 'Loading Units';
    const psdUnitShort = isGermanStandard(settings.metadata.calculationParams.psdMethod) ? 'D. Flow' : 'LU';

    let materialName = '';
    if (catalog) {
        const pipe = fillPipeDefaultFields(settings, 0, entity);
        materialName = ' (' + catalog.pipes[pipe.material!].abbreviation + ')';
    }

    return [
        {property: 'peakFlowRate',
            title: 'Peak Flow rate',
            short: 'Peak',
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
            systemUid: entity.systemUid,
            defaultEnabled: true,
        },
        {property: 'realNominalPipeDiameterMM',
            title: 'Pipe Diameter',
            short: '\u00f8' + materialName!,
            hideUnits: true,
            units: Units.Millimeters,
            category: FieldCategory.Size,
            significantDigits: 0,
            bold: true,
            systemUid: entity.systemUid,
            defaultEnabled: true,
        },
        {property: 'realInternalDiameterMM',
            title: 'Internal Diameter',
            short: 'Internal',
            units: Units.Millimeters,
            category: FieldCategory.Size,
            systemUid: entity.systemUid,
        },
        {property: 'pressureDropKpa',
            title: 'Peak pressure drop',
            short: 'Drop',
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
            systemUid: entity.systemUid,
        },
        {property: 'velocityRealMS',
            title: 'Peak Velocity',
            short: '',
            units: Units.MetersPerSecond,
            category: FieldCategory.Velocity,
            systemUid: entity.systemUid,
        },
        {property: 'temperatureRange',
            title: 'Temperature range',
            short: '',
            units: Units.Celsius,
            category: FieldCategory.Temperature,
            systemUid: entity.systemUid,
        },
        {property: 'psdUnits',
            title: psdUnit,
            short: psdUnitShort,
            units: Units.None,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid,
        },
    ];
}

export function emptyPipeCalculation(): PipeCalculation {
    return {
        peakFlowRate: null,
        psdUnits: null,
        optimalInnerPipeDiameterMM: null,
        realInternalDiameterMM: null,
        pressureDropKpa: null,
        realNominalPipeDiameterMM: null,
        temperatureRange: null,
        velocityRealMS: null,
        warning: null,
    };
}
