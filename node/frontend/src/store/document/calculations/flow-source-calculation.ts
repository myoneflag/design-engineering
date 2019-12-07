import {FieldCategory, CalculationField, Units} from '../../../../src/store/document/calculations/calculation-field';
import {Calculation, PsdCalculation} from '../../../../src/store/document/calculations/types';
import {isGermanStandard} from '../../../../src/config';
import {DrawingState} from '../../../../src/store/document/types';
import FlowSourceEntity from '../../../../src/store/document/entities/flow-source-entity';

export default interface FlowSourceCalculation extends Calculation {
    pressureKPA: number | null;
    flowRateLS: number | null;
}

export function makeFlowSourceCalculationFields(entity: FlowSourceEntity, settings: DrawingState): CalculationField[] {
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
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate,
        },
    ];
}

export function emptyFlowSourceCalculation(): FlowSourceCalculation {
    return {
        flowRateLS: null, pressureKPA: null, warning: null,
    };
}