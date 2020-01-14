import { CalculatableEntityConcrete, DrawableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { assertUnreachable } from "../../../../../common/src/api/config";
import { DrawableEntity } from "../../../../../common/src/api/document/drawing";

export function isCalculated(e: DrawableEntityConcrete): e is CalculatableEntityConcrete {
    switch (e.type) {
        case EntityType.RISER:
        case EntityType.DIRECTED_VALVE:
        case EntityType.PIPE:
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.BIG_VALVE:
        case EntityType.FLOW_SOURCE:
        case EntityType.FIXTURE:
        case EntityType.LOAD_NODE:
        case EntityType.PLANT:
            return true;
        case EntityType.BACKGROUND_IMAGE:
            return false;
    }
    assertUnreachable(e);
}
