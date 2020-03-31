import { EntityType } from "../types";
import { FieldType, PropertyField } from "../property-field";
import { isLUStandard, SupportedPsdStandards } from "../../../config";
import { Catalog } from "../../../catalog/types";
import { Coord, DrawableEntity, DrawingState } from "../../drawing";
import { cloneSimple, parseCatalogNumberExact, parseCatalogNumberOrMin } from "../../../../lib/utils";
import { Units } from "../../../../../../frontend/src/store/document/calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../../../frontend/src/store/catalog";

export interface RoughInRecord {
    uid: string;
    minPressureKPA: number | null;
    maxPressureKPA: number | null;
    loadingUnits: number | null;
    designFlowRateLS: number | null;
    continuousFlowLS: number | null;
    allowAllSystems: boolean;
}

export default interface FixtureEntity extends DrawableEntity {
    center: Coord;
    type: EntityType.FIXTURE;
    name: string;
    abbreviation: string;
    rotation: number;

    roughIns: {
        [key: string]: RoughInRecord;
    };
    roughInsInOrder: string[];

    pipeDistanceMM: number;
    outletAboveFloorM: number | null;
    warmTempC: number | null;
    fixtureUnits: number | null;
    probabilityOfUsagePCT: number | null;
}

export function makeFixtureFields(drawing: DrawingState, entity: FixtureEntity): PropertyField[] {
    const res: PropertyField[] = [
        {
            property: "rotation",
            title: "Rotation: (Degrees)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Rotation,
            params: null,
            multiFieldId: null
        },

        {
            property: "outletAboveFloorM",
            title: "Height Above Floor",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "outletAboveFloorM",
            units: Units.Meters,
        },

        /*
        {
            property: "warmTempC",
            title: "Warm Water Temperature",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: 100 },
            multiFieldId: "warmTempC",
            units: Units.Celsius,
        },*/

        {
            property: "fixtureUnits",
            title: "Fixture Units",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "fixtureUnits"
        },

        {
            property: "probabilityOfUsagePCT",
            title: "Prob. of Usage (%)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "probabilityOfUsagePCT"
        }
    ];

    for (const suid of Object.keys(entity.roughIns)) {
        const system = drawing.metadata.flowSystems.find((s) => s.uid === suid)!;
        res.push(
            {
                property: suid + ".title",
                title: system.name,
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Title,
                params: null,
                multiFieldId: suid + ".title"
            },

            {
                property: "roughIns." + suid + ".allowAllSystems",
                title: "Allow Other Systems to Connect?",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Boolean,
                params: null,
                multiFieldId: suid + "-allowAllSystems"
            },

            {
                property: "roughIns." + suid + ".designFlowRateLS",
                title: "Full Flow Rate",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: suid + "-designFlowRateLS",
                units: Units.LitersPerSecond,
            },

            {
                property: "roughIns." + suid + ".continuousFlowLS",
                title: "Continuous Flow",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: suid + "-continuousFlowLS",
                units: Units.LitersPerSecond,
            },
            {
                property: "roughIns." + suid + ".loadingUnits",
                title: "Loading Units",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: suid + "-loadingUnits"
            },
            {
                property: "roughIns." + suid + ".minPressureKPA",
                title: "Min. Inlet Pressure",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: suid + "-minPressureKPA",
                units: Units.KiloPascals,
            },
            {
                property: "roughIns." + suid + ".maxPressureKPA",
                title: "Max. Inlet Pressure",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: suid + "-maxPressureKPA",
                units: Units.KiloPascals,
            }
        );
    }

    return res;
}

export function fillFixtureFields(
    drawing: DrawingState | undefined,
    defaultCatalog: Catalog,
    value: FixtureEntity
): FixtureEntity {
    const result = cloneSimple(value);

    const arr: Array<"warmTempC" | "outletAboveFloorM" | "fixtureUnits" | "probabilityOfUsagePCT"> = [
        "warmTempC",
        "outletAboveFloorM",
        "fixtureUnits",
        "probabilityOfUsagePCT"
    ];

    arr.forEach((field) => {
        if (result[field] === null) {
            result[field] = parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name][field]);
        }
    });

    const psdStrategy = drawing
        ? drawing.metadata.calculationParams.psdMethod
        : SupportedPsdStandards.as35002018LoadingUnits;

    const continuousFlowLS = defaultCatalog.fixtures[result.name].continuousFlowLS;

    for (const systemUid of Object.keys(result.roughIns)) {
        const target = result.roughIns[systemUid];
        if (target.minPressureKPA === null) {
            target.minPressureKPA = parseCatalogNumberExact(defaultCatalog.fixtures[result.name].minInletPressureKPA);
        }
        if (target.maxPressureKPA === null) {
            target.maxPressureKPA = parseCatalogNumberExact(defaultCatalog.fixtures[result.name].maxInletPressureKPA);
        }

        if (isLUStandard(psdStrategy)) {
            if (target.loadingUnits === null) {
                target.loadingUnits = parseCatalogNumberOrMin(
                    defaultCatalog.fixtures[result.name].loadingUnits[psdStrategy][systemUid]
                );
            }
        }

        if (target.designFlowRateLS === null) {
            target.designFlowRateLS = parseCatalogNumberOrMin(defaultCatalog.fixtures[result.name].qLS[systemUid]);
        }

        if (continuousFlowLS) {
            if (target.continuousFlowLS == null) {
                target.continuousFlowLS = parseCatalogNumberExact(continuousFlowLS[systemUid]);
            }
        } else {
            if (target.continuousFlowLS == null) {
                target.continuousFlowLS = 0;
            }
        }
    }

    return result;
}
