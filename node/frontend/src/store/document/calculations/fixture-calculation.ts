import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../src/store/catalog";
import { Calculation } from "../../../../src/store/document/calculations/types";
import FixtureEntity from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DocumentState } from "../types";

export default interface FixtureCalculation extends Calculation {
    pressures: {
        [key: string]: number | null;
    };
}

export function makeFixtureCalculationFields(doc: DocumentState, entity: FixtureEntity): CalculationField[] {
    return entity.roughInsInOrder.map((suid) => {
        const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === suid);
        if (!system) {
            throw new Error("System not found");
        }

        return {
            property: "pressures." + suid,
            title: system.name + " Pressure",
            short: system.name.split(" ")[0].toLowerCase(),
            systemUid: suid,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
            defaultEnabled: true
        };
    });
}

export function emptyFixtureCalculation(entity: FixtureEntity): FixtureCalculation {
    const pressures: {
        [key: string]: number | null;
    } = {};

    for (const suid of entity.roughInsInOrder) {
        pressures[suid] = null;
    }

    return {
        pressures,
        warning: null
    };
}
