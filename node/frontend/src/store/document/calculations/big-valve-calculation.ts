import { CalculationField, FieldCategory} from "../../../../src/store/document/calculations/calculation-field";
import BigValveEntity, {
    BigValveType
} from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { Calculation } from "../../../../src/store/document/calculations/types";
import { PsdCountEntry } from "../../../calculations/utils";
import { DocumentState } from "../types";
import { assertUnreachable, StandardFlowSystemUids } from "../../../../../common/src/api/config";
import { Units } from "../../../../../common/src/lib/measurements";
import { SelectedMaterialManufacturer } from '../../../../../common/src/api/document/drawing';
import {Manufacturer, Catalog, MixingValveManufacturer} from '../../../../../common/src/api/catalog/types';

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
    hotReturnFlowRateLS: number | null;
    hotTotalFlowRateLS: number | null;

    outputs: {
        [key: string]: {
            temperatureC: number | null;
            pressureDropKPA: number | null;
        };
    };

    rpzdSizeMM: {
        [key: string]: number | null;
    } | null;

    mixingValveSizeMM: number | null; 
}

export function makeBigValveCalculationFields(doc: DocumentState, entity: BigValveEntity, catalog: Catalog | undefined): CalculationField[] {
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
                result.push({
                    property: "rpzdSizeMM." + suids[i],
                    title: system.name + " RPZD Size",
                    short: "",
                    systemUid: suids[i],
                    units: Units.Millimeters,
                    category: FieldCategory.Size
                });
            }

            break;
        default:
            assertUnreachable(entity.valve);
    }

    for (let i = 0; i < suids.length; i++) {
        const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === suids[i])!;
        result.push({
            property: "outputs." + suids[i] + ".pressureDropKPA",
            title: system.name + " Pressure Drop",
            short: "drop",
            attachUid: attachments[i] as string,
            systemUid: suids[i],
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        });
    }

    if (entity.valve.type !== BigValveType.RPZD_HOT_COLD) {
        const manufacturer = doc.drawing.metadata.catalog.mixingValves.find((material: SelectedMaterialManufacturer) => material.uid === entity.valve.catalogId)?.manufacturer || 'generic';  
        const abbreviation = manufacturer !== 'generic' 
            && catalog?.mixingValves[entity.valve.catalogId].manufacturer.find((manufacturerObj: MixingValveManufacturer) => manufacturerObj.uid === manufacturer)?.abbreviation
            || '';

        result.push({
            property: "mixingValveSizeMM",
            title: "Size",
            attachUid: entity.uid,
            short: abbreviation,
            units: Units.Millimeters,
            category: FieldCategory.Size
        });
    }

    return result;
}

export function EmptyBigValveCalculations(entity: BigValveEntity): BigValveCalculation {
    const result: BigValveCalculation = {
        cost: null,
        costBreakdown: null,
        expandedEntities: null,

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
        hotTotalFlowRateLS: null,
        hotReturnFlowRateLS: null,

        outputs: {},
        rpzdSizeMM: {},
        mixingValveSizeMM: null,

        warning: null
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

            result.rpzdSizeMM = {};
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
