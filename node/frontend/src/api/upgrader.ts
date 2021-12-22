import { assertUnreachable } from "../../../common/src/api/config";
import { EntityType } from '../../../common/src/api/document/entities/types';
import { DrawableEntityConcrete } from "../../../common/src/api/document/entities/concrete-entity";
import { doPlantEntityUpgrade, PLANT_ENTITY_VERSION } from '../../../common/src/api/document/entities/plants/plant-entity';

export function checkEntityUpdates(entity: DrawableEntityConcrete): boolean {
    let upToDate = true;

    switch (entity.type) {
        case EntityType.PLANT:
            if (entity.version !== PLANT_ENTITY_VERSION) {
                upToDate = false;
                doPlantEntityUpgrade(entity);
            }

            break;
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.BIG_VALVE:
        case EntityType.DIRECTED_VALVE:
        case EntityType.FITTING:
        case EntityType.FIXTURE:
        case EntityType.FLOW_SOURCE:
        case EntityType.GAS_APPLIANCE:
        case EntityType.LOAD_NODE:
        case EntityType.PIPE:
        case EntityType.RISER:
        case EntityType.SYSTEM_NODE:
            break;
        default:
            assertUnreachable(entity);
    }

    return !upToDate;
}
