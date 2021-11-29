import { DrawingState, NetworkType, SelectedMaterialManufacturer } from "../drawing";
import PipeEntity from "./pipe-entity";
import RiserEntity from "./riser-entity";

export function getEntitySystem(drawing: DrawingState, entity: PipeEntity | RiserEntity) {
    return drawing.metadata.flowSystems.find((s) => s.uid === entity.systemUid);
}

export function getEntityNetwork(drawing: DrawingState, entity: PipeEntity) {
    const system = getEntitySystem(drawing, entity);
    if (system) {
        return system.networks[entity.network];
    } else {
        return null;
    }
}

export function getPipeManufacturer(drawing: DrawingState, entity: PipeEntity | RiserEntity): string {
    const selectedMaterial = drawing.metadata.catalog.pipes.find((pipe: SelectedMaterialManufacturer) => pipe.uid === entity.material);
    return selectedMaterial ? selectedMaterial.manufacturer : 'generic';
}

export function getPipeManufacturerByMaterial(drawing: DrawingState, material: string): string {
    const selectedMaterial = drawing.metadata.catalog.pipes.find((pipe: SelectedMaterialManufacturer) => pipe.uid === material);
    return selectedMaterial ? selectedMaterial.manufacturer : 'generic';
}