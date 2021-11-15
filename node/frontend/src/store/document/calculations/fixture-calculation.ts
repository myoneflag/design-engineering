import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation
} from "../../../../src/store/document/calculations/types";
import FixtureEntity from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DocumentState } from "../types";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
import { Units } from "../../../../../common/src/lib/measurements";
import {isDrainage, StandardFlowSystemUids} from "../../../../../common/src/api/config";

export default interface FixtureCalculation extends Calculation {
    inlets: {
        [key: string]: {
            deadlegVolumeL: number | null;
            deadlegLengthM: number | null;
        } & PressureCalculation;
    };
}

export function makeFixtureCalculationFields(doc: DocumentState, entity: FixtureEntity, globalStore: GlobalStore): CalculationField[] {
    const fCalc = globalStore.getOrCreateCalculation(entity);
    return entity.roughInsInOrder.map((suid) => {
        if (isDrainage(suid)) {
            return [];
        }

        const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === suid);
        if (!system) {
            throw new Error("System not found");
        }

        const ret: CalculationField[] = [];
        addPressureCalculationFields(ret, suid, "inlets." + suid + ".", {defaultEnabled: true}, {defaultEnabled: true});

        if (fCalc.inlets[suid] && fCalc.inlets[suid].deadlegVolumeL !== null) {
            ret.push({
                property: "inlets." + suid + ".deadlegVolumeL",
                title: system.name + " Deadleg Volume",
                short: "deadleg",
                systemUid: suid,
                units: Units.Liters,
                category: FieldCategory.Volume,
                defaultEnabled: true,
                hideIfNull: true,
            });
        }

        if (fCalc.inlets[suid] && fCalc.inlets[suid].deadlegLengthM !== null) {
            ret.push({
                property: "inlets." + suid + ".deadlegLengthM",
                title: system.name + " Deadleg Length",
                short: "deadleg",
                systemUid: suid,
                units: Units.Meters,
                category: FieldCategory.Length,
                defaultEnabled: true,
                hideIfNull: true,
            });
        }

        return ret;
    }).flat();
}

export function emptyFixtureCalculation(entity: FixtureEntity): FixtureCalculation {
    const result: FixtureCalculation = {
        costBreakdown: null,
        cost: null,
        expandedEntities: null,

        inlets: {},
        warnings: null,
    };
    for (const suid of entity.roughInsInOrder) {
        result.inlets[suid] = {
            deadlegLengthM: null, deadlegVolumeL: null, pressureKPA: null, staticPressureKPA: null
        };
    }

    return result;
}
