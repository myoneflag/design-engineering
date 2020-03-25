import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../src/store/catalog";
import { Calculation } from "../../../../src/store/document/calculations/types";
import FixtureEntity from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DocumentState } from "../types";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";

export default interface FixtureCalculation extends Calculation {
    pressures: {
        [key: string]: number | null;
    };
    deadlegs: {
        [key: string]: {
            volumeL: number | null;
            lengthM: number | null;
        }
    };
}

export function makeFixtureCalculationFields(doc: DocumentState, entity: FixtureEntity, globalStore: GlobalStore): CalculationField[] {
    const fCalc = globalStore.getOrCreateCalculation(entity);
    return entity.roughInsInOrder.map((suid) => {
        const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === suid);
        if (!system) {
            throw new Error("System not found");
        }

        const ret: CalculationField[] = [
            {
                property: "pressures." + suid,
                title: system.name + " Pressure",
                short: system.name.split(" ")[0].toLowerCase(),
                systemUid: suid,
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
                defaultEnabled: true,
            }
        ];

        if (fCalc.deadlegs[suid] && fCalc.deadlegs[suid].volumeL !== null) {
            ret.push({
                property: "deadlegs." + suid + ".volumeL",
                title: system.name + " Deadleg Volume",
                short: "deadleg",
                systemUid: suid,
                units: Units.Liters,
                category: FieldCategory.Volume,
                hideIfNull: true,
            });
        }

        if (fCalc.deadlegs[suid] && fCalc.deadlegs[suid].lengthM !== null) {
            ret.push({
                property: "deadlegs." + suid + ".lengthM",
                title: system.name + " Deadleg Length",
                short: "deadleg",
                systemUid: suid,
                units: Units.Meters,
                category: FieldCategory.Length,
                hideIfNull: true,
            });
        }

        return ret;
    }).flat();
}

export function emptyFixtureCalculation(entity: FixtureEntity): FixtureCalculation {
    const pressures: {
        [key: string]: number | null;
    } = {};
    const deadlegs: {
        [key: string]: {
            volumeL: number | null;
            lengthM: number | null;
        }
    } = {};

    for (const suid of entity.roughInsInOrder) {
        pressures[suid] = null;
        deadlegs[suid] = {
            volumeL: null,
            lengthM: null,
        };
    }

    return {
        pressures,
        deadlegs,
        warning: null
    };
}
