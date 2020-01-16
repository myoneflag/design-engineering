import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { Color, ConnectableEntity, Coord, DrawingState, FlowSystemParameters, NetworkType } from "../drawing";
import { Choice, cloneSimple, parseCatalogNumberOrMin } from "../../../lib/utils";
import { LEVEL_HEIGHT_DIFF_M } from "../../config";
import { Catalog } from "../../catalog/types";
import { fillPipeDefaultFields } from "./pipe-entity";

export default interface RiserEntity extends ConnectableEntity {
    type: EntityType.RISER;
    center: Coord;
    systemUid: string;

    diameterMM: number | null;
    maximumVelocityMS: number | null; // null means default
    material: string | null;
    color: Color | null;
    temperatureC: number | null;

    bottomHeightM: number | null;
    topHeightM: number | null;
}

export function makeRiserFields(entity: RiserEntity, catalog: Catalog, drawing: DrawingState): PropertyField[] {
    const result = fillRiserDefaults(drawing, entity);
    const materials = Object.keys(catalog.pipes).map((mat) => {
        const c: Choice = {
            disabled: false, key: mat, name: catalog.pipes[mat].name,
        };
        return c;
    });
    const diameters = Object.keys(catalog.pipes[result.material!].pipesBySize).map((d) => {
        const c: Choice = {
            disabled: false, key: parseCatalogNumberOrMin(d), name: d + 'mm',
        };
        return c;
    });
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
            property: "bottomHeightM",
            title: "Bottom Height (M)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "bottomHeightM"
        },

        {
            property: "topHeightM",
            title: "Top Height (M)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "topHeightM"
        },

        {
            property: "maximumVelocityMS",
            title: "Maximum Velocity (m/s)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "maximumVelocityMS"
        },

        {
            property: "diameterMM",
            title: "Diameter",
            hasDefault: false,
            isCalculated: true,
            type: FieldType.Choice,
            params: {
                choices: diameters,
                initialValue: diameters[0].key,
            },
            multiFieldId: "diameterMM"
        },

        {
            property: "material",
            title: "Material",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Choice,
            params: { choices: materials },
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
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: 100 },
            multiFieldId: "temperatureC"
        }
    ];
}

export function fillRiserDefaults(drawing: DrawingState, value: RiserEntity) {
    const result = cloneSimple(value);

    // get system
    const system = drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.maximumVelocityMS == null) {
            result.maximumVelocityMS = system.networks[NetworkType.RISERS].velocityMS;
        }
        if (result.material == null) {
            result.material = system.networks[NetworkType.RISERS].material;
        }
        if (result.color == null) {
            result.color = system.color;
        }
        if (result.temperatureC == null) {
            result.temperatureC = system.temperature;
        }
        if (result.bottomHeightM == null) {
            result.bottomHeightM = 0;
            Object.values(drawing.levels).forEach((v) => {
                result.bottomHeightM = Math.min(result.bottomHeightM!, v.floorHeightM);
            });
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
