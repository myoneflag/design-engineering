import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { Color, COLORS, DrawableEntity, DrawingState, NamedEntity, NetworkType } from "../drawing";
import { Choice, cloneSimple, parseCatalogNumberExact, parseCatalogNumberOrMin } from "../../../lib/utils";
import { Catalog } from "../../catalog/types";
import { convertMeasurementSystem, convertPipeDiameterFromMetric, Units } from "../../../lib/measurements";
import { isDrainage, isGas, StandardFlowSystemUids } from "../../config";
import { getPipeManufacturer, getEntityNetwork, getEntitySystem } from "./utils";

export default interface PipeEntity extends DrawableEntity, NamedEntity {
    type: EntityType.PIPE;

    parentUid: null;

    systemUid: string;
    network: NetworkType;

    material: string | null;
    lengthM: number | null;
    maximumVelocityMS: number | null;
    diameterMM: number | null;

    heightAboveFloorM: number;
    gradePCT: number | null;

    color: Color | null;
    readonly endpointUid: [string, string];
}

export interface MutablePipe {
    type: EntityType.PIPE;

    endpointUid: readonly [string, string];
}

export function makePipeFields(
    entity: PipeEntity,
    catalog: Catalog,
    drawing: DrawingState,
    floorHeight: number = 0,
): PropertyField[] {
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
    const manufacturer = getPipeManufacturer(drawing, result);
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
    const iAmDrainage = isDrainage(entity.systemUid, drawing.metadata.flowSystems);

    fields.push(
        {
            property: "entityName",
            title: "Name",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Text,
            params: null,
            multiFieldId: "entityName"
        },
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
                    { name: "Connection", key: NetworkType.CONNECTIONS, disabled: isGas(result.systemUid, catalog.fluids, drawing.metadata.flowSystems) }
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
            params: { choices: isDrainage(flowSystemSettings.uid, drawing.metadata.flowSystems) ? getDrainageMaterials(materials) : getWaterDrainageMaterials(materials) },
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
                params: { min: 0, max: null },
                multiFieldId: "maximumVelocityMS",
                units: Units.MetersPerSecond
            },
        );
    } else {
        if (entity.network === NetworkType.RETICULATIONS) {
            fields.push(
                {
                    property: "gradePCT",
                    title: "Grade (%)",
                    hasDefault: false,
                    isCalculated: true,
                    highlightOnOverride: COLORS.YELLOW,
                    type: FieldType.Number,
                    params: { min: 0, max: null, initialValue: 0 },
                    multiFieldId: "gradePCT",
                    units: Units.None
                },
            );
        }
    }

    const height = convertMeasurementSystem(drawing.metadata.units, Units.Meters, floorHeight + entity.heightAboveFloorM);

    fields.push(
        {
            property: "diameterMM",
            title: "Diameter",
            hasDefault: false,
            isCalculated: true,
            type: FieldType.Choice,
            params: {
                choices: diameters,
                initialValue: diameters && diameters.length ? diameters[0].key : null
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
            units: Units.Meters,
            description: `Height = ${height[1]}${height[0]}`
        },
    );
    return fields;
}

export function fillPipeDefaultFields(drawing: DrawingState, computedLengthM: number, value: PipeEntity) {
    const result = cloneSimple(value);

    const system = getEntitySystem(drawing, result);

    if (system) {
        const network = getEntityNetwork(drawing, result);
        if (network) {
            if (result.maximumVelocityMS == null) {
                result.maximumVelocityMS = Number(network.velocityMS);
            }
            if (result.material == null) {
                result.material = network.material;
            }
        }
        if (result.lengthM == null) {
            // We don't want entities to depend on objects. So their distance is to be provided instead, because
            // computing them here will require a harmful dependency.
            result.lengthM = computedLengthM;
        }
        if (result.color == null) {
            result.color = system.color;
            if (isDrainage(system.uid, drawing.metadata.flowSystems)) {
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

export function getDrainageMaterials(allChoices: Choice[]): Choice[] {
    return allChoices.filter((c) => {
        // TODO: replace pexSdr74
        // QUESTION: why does typescript require the parameter inside includes to be the same type???
        return [
            'stainlessSteelSewer',
            'uPVCSewer',
            'hdpeSdr11Sewer',
            'castIronSewer',
        ].includes(c.key as string);
    });
}

export function getWaterDrainageMaterials(allChoices: Choice[]): Choice[] {
    return allChoices.filter((c) => {
        // QUESTION: why does typescript require the parameter inside includes to be the same type???
        return [
            'castIronCoated',
            'copperTypeB',
            'gmsMedium',
            'hdpeSdr11',
            'pexSdr74',
            'stainlessSteel',
        ].includes(c.key as string);
    });
}