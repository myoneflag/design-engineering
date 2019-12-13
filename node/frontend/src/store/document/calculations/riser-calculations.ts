import {FieldCategory, CalculationField, Units} from '../../../../src/store/document/calculations/calculation-field';
import {Calculation, PsdCalculation} from '../../../../src/store/document/calculations/types';
import {isGermanStandard} from '../../../../src/config';
import {DrawingState} from '../../../../src/store/document/types';
import RiserEntity from '../entities/riser-entity';
import {getPsdUnitName} from "../../../calculations/utils";

export default interface RiserCalculations extends Calculation {
    pressureKPA: number | null;
    flowRateLS: number | null;
}

export function makeRiserCalculationFields(entity: RiserEntity, settings: DrawingState): CalculationField[] {
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

export function emptyRiserCalculations(): RiserCalculations {
    return {
        flowRateLS: null, pressureKPA: null, warning: null,
    };
}
