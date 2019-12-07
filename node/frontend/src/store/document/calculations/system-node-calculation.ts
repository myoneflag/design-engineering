import {FieldCategory, CalculationField, Units} from '../../../../src/store/document/calculations/calculation-field';
import {Calculation, PsdCalculation} from '../../../../src/store/document/calculations/types';
import {isGermanStandard} from '../../../../src/config';
import {DrawingState} from '../../../../src/store/document/types';
import {SystemNodeEntity} from '../../../../src/store/document/entities/tmv/tmv-entity';

export default interface SystemNodeCalculation extends PsdCalculation, Calculation {
    pressureKPA: number | null;
    flowRateLS: number | null;
}

export function makeSystemNodeCalculationFields(entity: SystemNodeEntity, settings: DrawingState): CalculationField[] {
    const psdUnit = isGermanStandard(settings.calculationParams.psdMethod) ? 'Design Flow Rate' : 'Loading Units';
    const psdUnitShort = isGermanStandard(settings.calculationParams.psdMethod) ? 'D. Flow' : 'LU';
    return [
        {property: 'pressureKPA',
            title: 'Pressure',
            short: '',
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.Pressure,
        },
        {property: 'flowRateLS',
            title: 'Peak Flow rate',
            short: 'Peak',
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate,
        },
        {property: 'psdUnits',
            title: psdUnit,
            short: psdUnitShort,
            units: Units.None,
            systemUid: entity.systemUid,
            category: FieldCategory.LoadingUnits,
        },
    ];
}

export function emptySystemNodeCalculation(): SystemNodeCalculation {
    return {
        flowRateLS: null, psdUnits: null, pressureKPA: null, warning: null,
    };
}
