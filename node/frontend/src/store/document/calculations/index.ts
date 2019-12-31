import {DrawableEntity} from '../../../../src/store/document/types';
import {CalculatableEntityConcrete, DrawableEntityConcrete} from "../entities/concrete-entity";
import {EntityType} from "../entities/types";
import {assertUnreachable} from "../../../config";

export function isCalculated(e: DrawableEntityConcrete): e is CalculatableEntityConcrete {
    switch (e.type) {
        case EntityType.RISER:
        case EntityType.DIRECTED_VALVE:
        case EntityType.PIPE:
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.BIG_VALVE:
        case EntityType.FIXTURE:
        case EntityType.LOAD_NODE:
            return true;
        case EntityType.BACKGROUND_IMAGE:
            return false;
    }
    assertUnreachable(e);
}
