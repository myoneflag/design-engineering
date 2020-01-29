import { DrawableEntityConcrete } from "./concrete-entity";
import { assertUnreachable } from "../../config";

export enum EntityType {
    BACKGROUND_IMAGE = "BACKGROUND_IMAGE",
    RISER = "RISER",
    RETURN = "FLOW_RETURN",
    PIPE = "PIPE",
    FITTING = "FITTING",

    BIG_VALVE = "BIG_VALVE",
    SYSTEM_NODE = "SYSTEM_NODE",

    FIXTURE = "FIXTURE",

    DIRECTED_VALVE = "DIRECTED_VALVE",
    LOAD_NODE = "LOAD_NODE",
    PLANT = "PLANT",

    FLOW_SOURCE = "FLOW_SOURCE",
}

export function getEntityName(type: EntityType): string {
    switch (type) {
        case EntityType.BACKGROUND_IMAGE:
            return "Background";
        case EntityType.RISER:
            return "Riser";
        case EntityType.RETURN:
            return "Return";
        case EntityType.PIPE:
            return "Pipe";
        case EntityType.FITTING:
            return "Fitting";
        case EntityType.BIG_VALVE:
            return "TMV, H/C RPZD && Tempering Valves";
        case EntityType.SYSTEM_NODE:
            return "Inlet/Outlet";
        case EntityType.PLANT:
            return "Plant";
        case EntityType.FIXTURE:
            return "Fixture";
        case EntityType.DIRECTED_VALVE:
            return "Valve";
        case EntityType.LOAD_NODE:
            return "Load Node";
        case EntityType.FLOW_SOURCE:
            return "Flow Source";
    }
    assertUnreachable(type);
}

export function getReferences(entity: DrawableEntityConcrete): string[] {
    switch (entity.type) {
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.LOAD_NODE:
        case EntityType.FITTING:
        case EntityType.FLOW_SOURCE:
            return [];
        case EntityType.PIPE:
            return [entity.endpointUid[0], entity.endpointUid[1]];
        case EntityType.BIG_VALVE:
            return [entity.coldRoughInUid, entity.hotRoughInUid];
        case EntityType.FIXTURE:
            return entity.roughInsInOrder.map((r) => entity.roughIns[r].uid);
        case EntityType.DIRECTED_VALVE:
            return [entity.sourceUid];
        case EntityType.PLANT:
            return [entity.inletUid, entity.outletUid];
    }
    assertUnreachable(entity);
}
