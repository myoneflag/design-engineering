import {LayerImplementation, SelectMode} from '../../../src/htmlcanvas/layers/layer';
import {DrawingMode} from '../../../src/htmlcanvas/types';
import {CalculationFilters, Coord, DocumentState} from '../../../src/store/document/types';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import DrawableObject from '../../../src/htmlcanvas/lib/drawable-object';
import {EntityType} from '../../../src/store/document/entities/types';
import {DrawingContext} from '../../../src/htmlcanvas/lib/types';
import DrawableObjectFactory from '../lib/drawable-object-factory';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {levelIncludesRiser} from "../lib/utils";
import {cooperativeYield} from "../utils";

export default class  HydraulicsLayer extends LayerImplementation {

    draggedObjects: BaseBackedObject[] | null = null;

    async draw(
        context: DrawingContext,
        active: boolean,
        shouldContinue: () => boolean,
        mode: DrawingMode,
        calculationFilters: CalculationFilters | null,
    ) {
        for (let i = 0; i < this.uidsInOrder.length; i++) {
            const v = this.uidsInOrder[i];
            if (!active || !this.isSelected(v)) {
                this.objectStore.get(v)!.draw(context,
                    {active, selected: false, calculationFilters});
            }
            if (i % 100 === 99) {
                await cooperativeYield(shouldContinue);
            }
        }
    }

    resetDocument(doc: DocumentState) {
        let entities: Array<[DrawableEntityConcrete, string | null]> = [];

        if (doc.uiState.levelUid) {
            entities = Object.values(doc.drawing.levels[doc.uiState.levelUid].entities).map((e) =>
                [e, doc.uiState.levelUid]);

            const sortedLevels = Object.values(doc.drawing.levels).sort((a, b) =>
                a.floorHeightM - b.floorHeightM);

            const risers = Object.values(doc.drawing.shared);
            risers.forEach((r) => {
                if (levelIncludesRiser(doc.drawing.levels[doc.uiState.levelUid!], r, sortedLevels)) {
                    entities.push([r, null]);
                }
            });
        }

        const thisIds = entities
            .filter((e) => e[0].type !== EntityType.BACKGROUND_IMAGE)
            .map((e) => e[0].uid);

        const removed = this.uidsInOrder.filter((v: string) => {
            if (thisIds.indexOf(v) !== -1) {
                return false;
            }
            return true;
        });

        removed.forEach((v) => {
            this.objectStore.delete(v);
            if (this.isSelected(v)) {
                this.select([v], SelectMode.Exclude);
                this.onSelect();
            }
        });



        // We have to create child objects from root to child with a tree.
        // Build tree.
        const adj: Map<string|null, string[]> = new Map<string|null, string[]>();
        entities.forEach(([entity, levelUid]) => {
            if (entity.type === EntityType.BACKGROUND_IMAGE) {
                return;
            }

            let parent: BaseBackedObject | null = null;
            if (entity.parentUid) {
                parent = this.objectStore.get(entity.parentUid)!;
            }

            if (this.objectStore.has(entity.uid)) {
                if (entity.type === EntityType.PIPE) {
                    this.objectStore.updatePipeEndpoints(entity.uid);
                }
            } else {
                DrawableObjectFactory.buildVisible(
                    this,
                    () => levelUid ?
                        doc.drawing.levels[levelUid].entities[entity.uid] :
                        doc.drawing.shared[entity.uid],
                    this.objectStore,
                    {
                        onSelected: (e) => this.onSelected(e, entity.uid),
                        onChange: () => this.onChange(),
                        onCommit: (e) => this.onCommit(entity),
                    },
                );
            }
        });

        this.uidsInOrder = [];

        this.uidsInOrder = thisIds.sort((a, b) => {
            return this.entitySortOrder(this.objectStore.get(a)!.entity) -
                this.entitySortOrder(this.objectStore.get(b)!.entity);
        });
    }

    entitySortOrder(entity: DrawableEntityConcrete): number {
        switch (entity.type) {
            case EntityType.FITTING:
            case EntityType.DIRECTED_VALVE:
                return 100;
            case EntityType.RISER:
                return 70;
            case EntityType.SYSTEM_NODE:
                return 70;
            case EntityType.PIPE:
                return 50;
            case EntityType.TMV:
                return 0;
            case EntityType.FIXTURE:
                return 0;
            case EntityType.BACKGROUND_IMAGE:
                throw new Error('shouldn\'t find this entity here');
        }
    }

    getObjectAt(worldCoord: Coord, exclude: string[] = []): DrawableObject | null {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (exclude.indexOf(uid) !== -1) {
                continue;
            }
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                if (object.inBounds(object.toObjectCoord(worldCoord))) {
                    return object;
                }
            }
        }
        return null;
    }
}
