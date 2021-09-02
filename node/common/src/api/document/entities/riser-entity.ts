import {FieldType, PropertyField} from "./property-field";
import {EntityType} from "./types";
import {
    Color,
    COLORS,
    ConnectableEntity,
    Coord,
    DrawingState,
    Level,
    NetworkType,
    SelectedMaterialManufacturer
} from "../drawing";
import {Choice, cloneSimple, parseCatalogNumberExact, parseCatalogNumberOrMin} from "../../../lib/utils";
import {isDrainage, LEVEL_HEIGHT_DIFF_M} from "../../config";
import {Catalog} from "../../catalog/types";
import {getDrainageMaterials, getWaterDrainageMaterials} from "./pipe-entity";
import {convertPipeDiameterFromMetric, Units} from "../../../lib/measurements";

export default interface RiserEntity extends ConnectableEntity {
    type: EntityType.RISER;
    center: Coord;
    systemUid: string;

    isVent: boolean;

    diameterMM: number | null;
    maximumVelocityMS: number | null; // null means default
    material: string | null;
    color: Color | null;
    temperatureC: number | null;

    bottomHeightM: number | null;
    topHeightM: number | null;
}

export function makeRiserFields(entity: RiserEntity, catalog: Catalog, drawing: DrawingState, defaultEntity?: RiserEntity): PropertyField[] {
    const result = fillRiserDefaults(drawing, entity);
    const materials = Object.keys(catalog.pipes).map((mat) => {
        const c: Choice = {
            disabled: false,
            key: mat,
            name: catalog.pipes[mat].name
        };
        return c;
    });
    const manufacturer = drawing.metadata.catalog.pipes.find((pipe: SelectedMaterialManufacturer) => pipe.uid === result.material)?.manufacturer || 'generic';
    const diameters = Object.keys(catalog.pipes[result.material!].pipesBySize[manufacturer]).map((d) => {
        const val = convertPipeDiameterFromMetric(drawing.metadata.units, parseCatalogNumberExact(d));
        const c: Choice = {
            disabled: false,
            key: parseCatalogNumberOrMin(d),
            name: val[1] + val[0],
        };
        return c;
    });
    const iAmDrainage = isDrainage(entity.systemUid);

    if (entity.isVent) {

        return [
            {
                property: "systemUid",
                title: "Flow System",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.FlowSystemChoice,
                params: { systems: drawing.metadata.flowSystems },
                multiFieldId: "systemUid"
            },

            {
                property: "topHeightM",
                title: "Top Height",
                hasDefault: false,
                isCalculated: false,
                requiresInput: true,
                type: FieldType.Number,
                params: { min: null, max: null },
                multiFieldId: "topHeightM",
                units: Units.Meters,
            },

            {
                property: "diameterMM",
                title: "Diameter",
                highlightOnOverride: COLORS.YELLOW,
                hasDefault: false,
                isCalculated: true,
                type: FieldType.Choice,
                params: {
                    choices: diameters,
                    initialValue: diameters[0].key
                },
                multiFieldId: "diameterMM"
            },

            {
                property: "material",
                title: "Material",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Choice,
                params: { choices: iAmDrainage ? getDrainageMaterials(materials) : getWaterDrainageMaterials(materials) },
                multiFieldId: "material"
            },

            {
                property: "color",
                title: "Color:",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Color,
                params: null,
                multiFieldId: "color"
            },
        ];
    } else {

        return [
            {
                property: "systemUid",
                title: "Flow System",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.FlowSystemChoice,
                params: {systems: drawing.metadata.flowSystems},
                multiFieldId: "systemUid"
            },

            {
                property: "bottomHeightM",
                title: "Bottom Height Above Floor",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: {min: null, max: null},
                multiFieldId: "bottomHeightM",
                units: Units.Meters,
                slot: true,
                description: `Height = ${(entity.bottomHeightM || defaultEntity?.bottomHeightM)}m`,
            },

            {
                property: "topHeightM",
                title: "Top Height Above Floor",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: {min: null, max: null},
                multiFieldId: "topHeightM",
                units: Units.Meters,
                slot: true,
                description: `Height = ${entity.topHeightM || defaultEntity?.topHeightM}m`,
            },

            {
                property: "maximumVelocityMS",
                title: "Maximum Velocity",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Number,
                params: {min: 0, max: null},
                multiFieldId: "maximumVelocityMS",
                units: Units.MetersPerSecond,
            },

            {
                property: "diameterMM",
                title: "Diameter",
                highlightOnOverride: COLORS.YELLOW,
                hasDefault: false,
                isCalculated: true,
                type: FieldType.Choice,
                params: {
                    choices: diameters,
                    initialValue: diameters[0].key
                },
                multiFieldId: "diameterMM"
            },

            {
                property: "material",
                title: "Material",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Choice,
                params: {choices: iAmDrainage ? getDrainageMaterials(materials) : getWaterDrainageMaterials(materials)},
                multiFieldId: "material"
            },

            {
                property: "color",
                title: "Color:",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Color,
                params: null,
                multiFieldId: "color"
            },

            {
                property: "temperatureC",
                title: "Temperature (°C)",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Number,
                params: {min: 0, max: 100},
                multiFieldId: "temperatureC"
            }
        ];
    }
}

export function fillRiserDefaults(drawing: DrawingState, value: RiserEntity) {
    const result = cloneSimple(value);
    const sortedLevels = Object.values(drawing.levels)
        .slice()
        .sort((a, b) => -(a.floorHeightM - b.floorHeightM))
        .reverse();

    // get system
    const system = drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

    const network = value.isVent ? NetworkType.CONNECTIONS : NetworkType.RISERS;

    if (system) {
        if (result.maximumVelocityMS == null) {
            result.maximumVelocityMS = Number(system.networks[network].velocityMS);
        }
        if (result.material == null) {
            result.material = system.networks[network].material;
        }
        if (result.color == null) {
            result.color = system.color;
        }
        if (result.temperatureC == null) {
            result.temperatureC = system.temperature;
        }
        if (result.bottomHeightM == null) {
            result.bottomHeightM = sortedLevels[0].floorHeightM;
        }

        if (result.topHeightM == null) {
            result.topHeightM = 0;
            Object.values(drawing.levels).forEach((v) => {
                result.topHeightM = Math.max(result.topHeightM!, v.floorHeightM + LEVEL_HEIGHT_DIFF_M);
            });
        }
    } else {
        throw new Error("Existing system not found for object " + JSON.stringify(value));
    }

    return result;
}
