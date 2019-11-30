import {FieldCategory, CalculationField, Units} from '@/store/document/calculations/calculation-field';
import DirectedValveEntity from '@/store/document/entities/directed-valves/directed-valve-entity';

export default interface DirectedValveCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    pressureKPA: number | null;
}

export function makeDirectedValveCalculationFields(entity: DirectedValveEntity): CalculationField[] {
    const fields: CalculationField[] = [
        {property: 'flowRateLS',
            title: 'Flow Rate',
            short: 'Flow',
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
        },
        {property: 'pressureDropKPA',
            title: 'Pressure Drop',
            short: 'Drop',
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
        {property: 'pressureKPA',
            title: 'Pressure',
            short: 'In',
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
    ];
    if (entity.systemUidOption) {
        return fields.map((f) => {
            f.systemUid = entity.systemUidOption!;
            return f;
        });
    } else {
        return fields;
    }
}

export function emptyDirectedValveCalculation(): DirectedValveCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
    };
}
