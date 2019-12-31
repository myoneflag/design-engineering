import {CalculationField, FieldCategory, Units} from '../../../../src/store/document/calculations/calculation-field';
import BigValveEntity, {BigValveType} from '../entities/big-valve/big-valve-entity';
import {StandardFlowSystemUids} from '../../../../src/store/catalog';
import {Calculation} from '../../../../src/store/document/calculations/types';
import {PsdCountEntry} from "../../../calculations/utils";
import {DocumentState} from "../types";
import {assertUnreachable} from "../../../config";

export default interface BigValveCalculation extends Calculation {
    coldTemperatureC: number | null;
    coldPressureKPA: number | null;
    coldRawPeakFlowRate: number | null;
    coldPeakFlowRate: number | null;
    coldPsdUs: PsdCountEntry | null;

    hotTemperatureC: number | null;
    hotPressureKPA: number | null;
    hotRawPeakFlowRate: number | null;
    hotPeakFlowRate: number | null;
    hotPsdUs: PsdCountEntry | null;

    outputs: {
        [key: string]: {
            temperatureC: number | null;
            pressureDropKPA: number | null;
        }
    }

    rpzdSizeMM: {
        [key: string]: number | null;
    } | null;
}


export function makeBigValveCalculationFields(doc: DocumentState, entity: BigValveEntity): CalculationField[] {
    const result: CalculationField[] = [];

    const suids: string[] = [];
    const attachments: string[] = [];
    switch (entity.valve.type) {
        case BigValveType.TMV:
            suids.push(StandardFlowSystemUids.WarmWater, StandardFlowSystemUids.ColdWater);
            attachments.push(entity.valve.warmOutputUid, entity.valve.coldOutputUid);
            break;
        case BigValveType.TEMPERING:
            suids.push(StandardFlowSystemUids.WarmWater);
            attachments.push(entity.valve.warmOutputUid);
            break;
        case BigValveType.RPZD_HOT_COLD:
            suids.push(StandardFlowSystemUids.HotWater, StandardFlowSystemUids.ColdWater);
            attachments.push(entity.valve.hotOutputUid, entity.valve.coldOutputUid);


            for (let i = 0; i < 2; i++) {
                const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === suids[i])!;
                result.push(
                    {property: 'rpzdSizeMM.' + suids[i],
                        title:  system.name + ' RPZD Size',
                        short: '',
                        attachUid: attachments[i] as string,
                        systemUid: suids[i],
                        units: Units.Millimeters,
                        category: FieldCategory.Size,
                    },
                );
            }

            break;
        default:
            assertUnreachable(entity.valve);
    }

    for (let i = 0; i < suids.length; i++) {
        const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === suids[i])!;
        result.push(
            {property: 'outputs.' + suids[i] + '.pressureDropKPA',
                title:  system.name + ' Pressure Drop',
                short: 'drop',
                attachUid: attachments[i] as string,
                systemUid: suids[i],
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
            },
        );
    }

    return result;
}

export function EmptyBigValveCalculations(entity: BigValveEntity): BigValveCalculation {
    const result: BigValveCalculation = {
        coldPressureKPA: null,
        coldTemperatureC: null,
        coldRawPeakFlowRate: null,
        coldPeakFlowRate: null,
        coldPsdUs: null,

        hotPressureKPA: null,
        hotTemperatureC: null,
        hotRawPeakFlowRate: null,
        hotPeakFlowRate: null,
        hotPsdUs: null,

        outputs: {},
        rpzdSizeMM: {},

        warning: null,
    };

    const suids: string[] = [];
    switch (entity.valve.type) {
        case BigValveType.TMV:
            suids.push(StandardFlowSystemUids.WarmWater, StandardFlowSystemUids.ColdWater);
            break;
        case BigValveType.TEMPERING:
            suids.push(StandardFlowSystemUids.WarmWater);
            break;
        case BigValveType.RPZD_HOT_COLD:
            suids.push(StandardFlowSystemUids.HotWater, StandardFlowSystemUids.ColdWater);

            result.rpzdSizeMM  = {};
            for (const suid of suids) {
                result.rpzdSizeMM[suid] = null;
            }
            break;
        default:
            assertUnreachable(entity.valve);
    }

    for (const suid of suids) {
        result.outputs[suid] = {
            temperatureC: null,
            pressureDropKPA: null,
        };
    }

    return result;
}
