import { assertUnreachable } from "../../../../../common/src/api/config";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { DrawableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import LoadNodeEntity, { LoadNode, NodeType } from "../../../../../common/src/api/document/entities/load-node-entity";
import { fillPipeDefaultFields } from "../../../../../common/src/api/document/entities/pipe-entity";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { GlobalStore } from "../global-store";

export function entityTypeSupportsSimilar(type: string) {
    return type === EntityType.PIPE || type === EntityType.FIXTURE || type == EntityType.LOAD_NODE || type == EntityType.DIRECTED_VALVE || type == EntityType.BIG_VALVE;
}

export function getIdsOfSimilarEntities(selected: DrawableEntityConcrete, drawing: DrawingState, levelUid: string|null, globalStore: GlobalStore) {

    const similarEntitiesId = [];

    const entities = Array.from(
        (globalStore.entitiesInLevel.get(levelUid) || new Set()).values()).map((u) => globalStore.get(u)!.entity);

    for (const entity of entities) {
        switch (selected.type) {
            case EntityType.FIXTURE: {
                if (entity.type === selected.type 
                    && entity.uid !== selected.uid 
                    && entity.name === selected.name)
                {
                    similarEntitiesId.push(entity.uid);
                }
                break;
            }
            case EntityType.PIPE: {
                const filledPipe = fillPipeDefaultFields(drawing, 0, selected);
                
                if (entity.type === filledPipe.type) {
                    const filledPipeSimilar = fillPipeDefaultFields(drawing, 0, entity);
                    
                    if (filledPipeSimilar.uid !== filledPipe.uid 
                        && filledPipeSimilar.network === filledPipe.network 
                        && filledPipeSimilar.systemUid === filledPipe.systemUid
                        && filledPipeSimilar.material === filledPipe.material)
                    {
                        similarEntitiesId.push(entity.uid);
                    }
                }
                break;
            }
            case EntityType.LOAD_NODE:
                if (entity.type === selected.type && 
                    entity.uid !== selected.uid) {
                        const selectedLoadNode = selected as LoadNodeEntity;
                        const entityLoadNode = entity as LoadNodeEntity;
                        const customNodesOfSameType = selectedLoadNode.customNodeId && 
                                 selectedLoadNode.customNodeId === entityLoadNode.customNodeId;
                        const defaultLoadNodesOfSameVariant = !selectedLoadNode.customNodeId && 
                                  selectedLoadNode.node.type === NodeType.LOAD_NODE &&
                                  selectedLoadNode.node.type === entityLoadNode.node.type && 
                                  (selectedLoadNode.node as LoadNode).variant === (entityLoadNode.node as LoadNode).variant;
                        const defaultDwellingNodes = !selectedLoadNode.customNodeId && 
                                  selectedLoadNode.node.type === NodeType.DWELLING &&
                                  selectedLoadNode.node.type === entityLoadNode.node.type;
                        const onSameSystem = selectedLoadNode.systemUidOption === entityLoadNode.systemUidOption;
                        if ( onSameSystem && ( customNodesOfSameType || defaultLoadNodesOfSameVariant || defaultDwellingNodes )) {
                            similarEntitiesId.push(entity.uid);
                        }
                    }
                break;
            case EntityType.DIRECTED_VALVE:
            case EntityType.BIG_VALVE:
                if (entity.type === selected.type 
                    && entity.uid !== selected.uid 
                    && entity.valve.type === selected.valve.type)
                {
                    similarEntitiesId.push(entity.uid);
                }
                break;
            case EntityType.RISER:
            case EntityType.SYSTEM_NODE:
            case EntityType.FLOW_SOURCE:
            case EntityType.PLANT:
            case EntityType.GAS_APPLIANCE:
                break;
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FITTING:                        
                break;
            default:
                assertUnreachable(selected);
        }
    }

    return similarEntitiesId;
}
