import {FieldType, PropertyField} from "./property-field";
import {EntityType} from "./types";
import {Color, COLORS, DrawableEntity, DrawingState, NetworkType, SelectedMaterialManufacturer} from "../drawing";
import {Choice, cloneSimple, parseCatalogNumberExact, parseCatalogNumberOrMin} from "../../../lib/utils";
import {Catalog} from "../../catalog/types";
import {convertPipeDiameterFromMetric, Units} from "../../../lib/measurements";
import {isDrainage, StandardFlowSystemUids} from "../../config";

export default interface PipeEntity extends DrawableEntity {
    type: EntityType.PIPE;

    parentUid: null;

    systemUid: string;
    network: NetworkType;

    material: string | null;
    lengthM: number | null;
    maximumVelocityMS: number | null;
    diameterMM: number | null;

    heightAboveFloorM: number;

    color: Color | null;
    readonly endpointUid: [string, string];
}

export interface MutablePipe {
    type: EntityType.PIPE;

    endpointUid: readonly [string, string];
}

export function makePipeFields(entity: PipeEntity, catalog: Catalog, drawing: DrawingState): PropertyField[] {
    const result = fillPipeDefaultFields(drawing, 0, entity);
    const materials = Object.keys(catalog.pipes).map((mat) => {
        const c: Choice = {
            disabled: false,
            key: mat,
            name: catalog.pipes[mat].name
        };
        return c;
    });
    const flowSystemSettings = drawing.metadata.flowSystems.find((prop) => prop.uid === result.systemUid)!;
    const manufacturer = drawing.metadata.catalog.pipes.find((pipe: SelectedMaterialManufacturer) => pipe.uid === result.material)?.manufacturer || 'generic';
    const diameters = Object.keys(catalog.pipes[result.material!].pipesBySize[manufacturer])
        .map((d) => {
            const val = convertPipeDiameterFromMetric(drawing.metadata.units, parseCatalogNumberExact(d));
            const c: Choice = {
                disabled: false,
                key: parseCatalogNumberOrMin(d),
                name: val[1] + val[0],
            };
            return c;
        })
        .filter((d) => Number(d.key) >= flowSystemSettings.networks[result.network].minimumPipeSize);
        
    const fields: PropertyField[] = [];
    const iAmDrainage = isDrainage(entity.systemUid);

    fields.push(
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
            property: "network",
            title: "Network Type",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Choice,
            multiFieldId: "network",
            params: {
                choices: [
                    { name: "Riser", key: NetworkType.RISERS, disabled: true },
                    { name: "Reticulation", key: NetworkType.RETICULATIONS, disabled: false },
                    { name: "Connection", key: NetworkType.CONNECTIONS, disabled: result.systemUid !== StandardFlowSystemUids.Gas }
                ]
            }
        },

        {
            property: "material",
            title: "Material",
            hasDefault: true,
            highlightOnOverride: COLORS.YELLOW,
            isCalculated: false,
            type: FieldType.Choice,
            params: { choices: isDrainage(flowSystemSettings.uid) ? getDrainageMaterials(materials) : materials },
            multiFieldId: "material"
        },

        {
            property: "lengthM",
            title: "Length",
            hasDefault: false,
            highlightOnOverride: COLORS.YELLOW,
            isCalculated: true,
            type: FieldType.Number,
            params: { min: 0, max: null, initialValue: 0 },
            multiFieldId: null,
            units: Units.Meters
        },

        {
            property: "color",
            title: "Color",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Color,
            params: null,
            multiFieldId: "color"
        },
    );

    if (!iAmDrainage) {
        fields.push(
            {
                property: "maximumVelocityMS",
                title: "Maximum Velocity",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Number,
                params: {min: 0, max: null},
                multiFieldId: "maximumVelocityMS",
                units: Units.MetersPerSecond
            },
        );
    }

    fields.push(
        {
            property: "diameterMM",
            title: "Diameter",
            hasDefault: false,
            isCalculated: true,
            type: FieldType.Choice,
            params: {
                choices: diameters,
                initialValue: diameters[0].key
            },
            multiFieldId: "diameterMM",
        },

        {
            property: "heightAboveFloorM",
            title: "Height Above Floor",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveFloorM",
            units: Units.Meters
        },
    );
    return fields;
}

export function fillPipeDefaultFields(drawing: DrawingState, computedLengthM: number, value: PipeEntity) {
    const result = cloneSimple(value);

    // get system
    const system = drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.maximumVelocityMS == null) {
            result.maximumVelocityMS = Number(system.networks[result.network].velocityMS);
        }
        if (result.material == null) {
            result.material = system.networks[result.network].material;
        }
        if (result.lengthM == null) {
            // We don't want entities to depend on objects. So their distance is to be provided instead, because
            // computing them here will require a harmful dependency.
            result.lengthM = computedLengthM;
        }
        if (result.color == null) {
            result.color = system.color;
            if (isDrainage(system.uid)) {
                if (value.network === NetworkType.CONNECTIONS) {
                    result.color = system.drainageProperties.ventColor;
                }
            }
        }
    } else {
        throw new Error("Existing system not found for object " + JSON.stringify(value));
    }

    return result;
}

export function getDrainageMaterials(onlyChoices: Choice[]): Choice[] {
    return onlyChoices.filter((c) => {
        // TODO: replace pexSdr74
        // QUESTION: why does typescript require the parameter inside includes to be the same type???
        return ['hdpeSdr11', 'stainlessSteel', 'castIronCoated', 'pexSdr74'].includes(c.key as string);
    });
}