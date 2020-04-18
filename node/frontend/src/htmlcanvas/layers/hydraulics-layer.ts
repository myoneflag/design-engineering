import { LayerImplementation, SelectMode } from "../../../src/htmlcanvas/layers/layer";
import { DrawingMode } from "../../../src/htmlcanvas/types";
import { CalculationFilters, DocumentState, EntityParam } from "../../../src/store/document/types";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import DrawableObject from "../../../src/htmlcanvas/lib/drawable-object";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import DrawableObjectFactory from "../lib/drawable-object-factory";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { levelIncludesRiser } from "../lib/utils";
import { cooperativeYield } from "../utils";
import { Coord } from "../../../../common/src/api/document/drawing";
import { assertUnreachable } from "../../../../common/src/api/config";

export default class HydraulicsLayer extends LayerImplementation {
    draggedObjects: BaseBackedObject[] | null = null;

    async draw(
        context: DrawingContext,
        active: boolean,
        shouldContinue: () => boolean,
        exclude: Set<string>,
        mode: DrawingMode,
        withCalculation: boolean,
    ) {
        for (let i = 0; i < this.uidsInOrder.length; i++) {
            const v = this.uidsInOrder[i];
            if (!exclude.has(v)) {
                if (!active || !this.isSelected(v)) {
                    try {
                        this.context.globalStore
                            .get(v)!
                            .draw(context, { active, withCalculation, forExport: false });
                    } catch (e) {
                        // tslint:disable-next-line:no-console
                    }
                }
            }
            if (i % 100 === 99) {
                await cooperativeYield(shouldContinue);
            }
        }
    }

    entitySortOrder(entity: DrawableEntityConcrete): number {
        switch (entity.type) {
            case EntityType.FLOW_SOURCE:
                return 120;
            case EntityType.FITTING:
            case EntityType.DIRECTED_VALVE:
            case EntityType.LOAD_NODE:
                return 100;
            case EntityType.RISER:
                return 70;
            case EntityType.SYSTEM_NODE:
                return 70;
            case EntityType.PIPE:
                return 50;
            case EntityType.BIG_VALVE:
            case EntityType.PLANT:
            case EntityType.FIXTURE:
                return 0;
            case EntityType.BACKGROUND_IMAGE:
                return 0;
            default:
                throw new Error("shouldn't find this entity here");
        }
    }

    shouldAccept(entity: DrawableEntityConcrete): boolean {
        switch (entity.type) {
            case EntityType.RISER:
                return levelIncludesRiser(
                    this.context.document.drawing.levels[this.context.document.uiState.levelUid!],
                    entity,
                    this.context.$store.getters["document/sortedLevels"]
                );
            case EntityType.FITTING:
            case EntityType.PIPE:
            case EntityType.SYSTEM_NODE:
            case EntityType.BIG_VALVE:
            case EntityType.FIXTURE:
            case EntityType.DIRECTED_VALVE:
            case EntityType.LOAD_NODE:
            case EntityType.PLANT:
            case EntityType.FLOW_SOURCE:
                return (
                    this.context.globalStore.levelOfEntity.get(entity.uid) === this.context.document.uiState.levelUid
                );
            case EntityType.BACKGROUND_IMAGE:
                return false;
            default:
                assertUnreachable(entity);
        }
        return false;
    }

    addEntity({ entity, levelUid }: EntityParam) {
        super.addEntity({ entity, levelUid });
    }
}
