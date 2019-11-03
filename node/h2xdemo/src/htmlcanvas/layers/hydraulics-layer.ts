import {LayerImplementation, SelectMode} from '@/htmlcanvas/layers/layer';
import {DrawingMode} from '@/htmlcanvas/types';
import {Coord, DocumentState} from '@/store/document/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {EntityType} from '@/store/document/entities/types';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '../lib/drawable-object-factory';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';

export default class  HydraulicsLayer extends LayerImplementation {

    draggedObjects: BaseBackedObject[] | null = null;

    draw(context: DrawingContext, active: boolean, mode: DrawingMode) {
        this.uidsInOrder.forEach((v) => {
            this.objectStore.get(v)!.draw(context, active, false, mode);
        });
    }

    update(doc: DocumentState) {
        const thisIds = doc.drawing.entities.map((v) => v.uid);
        const removed = this.uidsInOrder.filter((v: string) => {
            if (thisIds.indexOf(v) !== -1) {
                return false;
            }
            if (this.draggedObjects) {
                if (this.draggedObjects.find((d) => d.uid === v)) {
                    return false;
                }
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
        doc.drawing.entities.forEach((entity) => {

            let parent: BaseBackedObject | null = null;
            if (entity.parentUid) {
                parent = this.objectStore.get(entity.parentUid)!;
            }

            if (this.objectStore.get(entity.uid) !== undefined) {
                // update existing object
                const object = this.objectStore.get(entity.uid)!;
                object.refreshObject(
                    entity,
                );
            } else {
                DrawableObjectFactory.build(
                    this,
                    entity,
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
            case EntityType.VALVE:
                return 100;
            case EntityType.PIPE:
                return 50;
            case EntityType.FLOW_SOURCE:
                return 70;
            case EntityType.SYSTEM_NODE:
                return 70;
            case EntityType.TMV:
                return 0;
            case EntityType.FIXTURE:
                return 0;

            case EntityType.RESULTS_MESSAGE:
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
