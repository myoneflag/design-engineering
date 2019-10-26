import {LayerImplementation, SelectMode} from '@/htmlcanvas/layers/layer';
import {DrawingMode, MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Coord, DocumentState} from '@/store/document/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {EntityType} from '@/store/document/entities/types';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '../lib/drawable-object-factory';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

export default class  HydraulicsLayer extends LayerImplementation {
    uidsInOrder: string[] = [];

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
                    parent ? parent.entity : null,
                    entity,
                );
            } else {
                DrawableObjectFactory.build(
                    this,
                    entity,
                    parent ? parent.entity : null,
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


        // We draw valves on top, followed by pipes and finally risers, sinks and everything else.
        this.uidsInOrder.push(...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BaseBackedObject).entity;
            return o.type === EntityType.VALVE;
        }));


        this.uidsInOrder.splice(0, 0, ...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BaseBackedObject).entity;
            return this.uidsInOrder.indexOf(a) === -1 && o.type !== EntityType.PIPE;
        }));

        this.uidsInOrder.splice(0, 0, ...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BaseBackedObject).entity;
            return o.type === EntityType.PIPE;
        }));
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
