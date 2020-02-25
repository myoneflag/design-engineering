import { DrawableEntityConcrete } from "./concrete-entity";
import { assertUnreachable } from "../../config";
import { BigValveType } from "./big-valve/big-valve-entity";

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

    FLOW_SOURCE = "FLOW_SOURCE"
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

// for copy paste to replace
export function getReferences(entity: DrawableEntityConcrete): string[] {
    const refs: string[] = [];
    if (entity.parentUid) {
        refs.push(entity.parentUid);
    }

    switch (entity.type) {
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.RISER:
        case EntityType.FITTING:
        case EntityType.FLOW_SOURCE:
            break;
        case EntityType.LOAD_NODE:
            if (entity.linkedToUid) {
                refs.push(entity.linkedToUid);
            }
            break;
        case EntityType.SYSTEM_NODE:
            refs.push(entity.parentUid!);
            break;
        case EntityType.PIPE:
            refs.push(entity.endpointUid[0], entity.endpointUid[1]);
            break;
        case EntityType.BIG_VALVE:
            refs.push(entity.coldRoughInUid, entity.hotRoughInUid);
            switch (entity.valve.type) {
                case BigValveType.TMV:
                    refs.push(entity.valve.coldOutputUid);
                    refs.push(entity.valve.warmOutputUid);
                    break;
                case BigValveType.TEMPERING:
                    refs.push(entity.valve.warmOutputUid);
                    break;
                case BigValveType.RPZD_HOT_COLD:
                    refs.push(entity.valve.hotOutputUid);
                    refs.push(entity.valve.coldOutputUid);
                    break;
            }
            break;
        case EntityType.FIXTURE:
            refs.push(...entity.roughInsInOrder.map((r) => entity.roughIns[r].uid));
            break;
        case EntityType.DIRECTED_VALVE:
            refs.push(entity.sourceUid);
            break;
        case EntityType.PLANT:
            refs.push(entity.inletUid, entity.outletUid);
            break;
        default:
            assertUnreachable(entity);
    }

    return refs;
}
