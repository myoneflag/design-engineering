import Layer from '@/htmlcanvas/layers/layer';
import {DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {DrawingContext, MessageStore, ObjectStore} from '@/htmlcanvas/lib/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {BaseInteraction, Interaction, PipeInteraction} from '@/htmlcanvas/lib/interaction';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import CalculationEngine from '@/calculations/calculation-engine';
import {BackgroundEntity} from '@/store/document/entities/background-entity';
import {DemandType} from '@/calculations/types';
import PipeProperties from '@/components/editor/property-window/PipeProperties.vue';
import {EntityType} from '@/store/document/entities/types';
import PipeEntity from '@/store/document/entities/pipe-entity';
import Popup from '@/htmlcanvas/objects/popup';
import {isCalculated} from '@/store/document/calculations';
import {getBoundingBox, getDocumentCenter} from '@/htmlcanvas/lib/utils';
import assert from 'assert';
import {CalculationTarget} from '@/store/document/calculations/types';
import CatalogState, {Catalog} from '@/store/catalog/types';
import {CalculatableEntityConcrete, DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

export default class CalculationLayer implements Layer {

    calculator: CalculationEngine;

    onChange: () => any;
    onSelect: (selectId: BaseBackedObject | null) => any;
    onCommit: (selectId: BaseBackedObject) => any;
    objectStore: ObjectStore;

    messageStore: MessageStore;

    idsInOrder: string[] = [];

    constructor(
        objectStore: ObjectStore,
        onChange: () => any,
        onSelect: (selectId: BaseBackedObject | null) => any,
        onCommit: (selectId: BaseBackedObject) => any,
    ) {
        this.onChange = onChange;
        this.onSelect = onSelect;
        this.onCommit = onCommit;
        this.objectStore = objectStore;

        this.calculator = new CalculationEngine();
        this.messageStore = new MessageStore();
    }

    get selectedEntity(): WithID | null {
        return null;
    }
    get selectedObject(): BaseBackedObject | null {
        return null;
    }

    select(object: BaseBackedObject): void {
        throw new Error('Not implemented');
    }

    draw(context: DrawingContext, active: boolean, ...args: any[]): any {
        if (active) {
            for (let i = this.idsInOrder.length - 1; i >= 0; i--) {
                const message = this.messageStore.get(this.idsInOrder[i]);
                if (message) {
                    message.draw(
                        context,
                        active,
                        this.selectedEntity ? this.selectedEntity.uid === message.uid : false,
                    );
                } else {
                    throw new Error('Message not found');
                }
            }
        }
    }

    drawSelectionLayer(context: DrawingContext, interactive: DrawableEntity[] | null): any {
        //
    }

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortBy?: (objects: DrawableEntityConcrete[]) => any,
    ): DrawableEntityConcrete[] | null {
        return null;
    }

    onMouseDown(event: MouseEvent, context: CanvasContext) {
        for (let i = this.idsInOrder.length - 1; i >= 0; i--) {
            const uid = this.idsInOrder[i];
            if (this.messageStore.has(uid)) {
                const object = this.messageStore.get(uid)!;
                if (object.onMouseDown(event, context)) {
                    return true;
                }
            }
        }

        return false;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        for (let i = this.idsInOrder.length - 1; i >= 0; i--) {
            const uid = this.idsInOrder[i];
            if (this.messageStore.has(uid)) {
                const object = this.messageStore.get(uid)!;
                const res = object.onMouseMove(event, context);
                if (res.handled) {
                    return res;
                }
            }
        }

        return UNHANDLED;
    }


    onMouseUp(event: MouseEvent, context: CanvasContext) {
        for (let i = this.idsInOrder.length - 1; i >= 0; i--) {
            const uid = this.idsInOrder[i];
            if (this.messageStore.has(uid)) {
                const object = this.messageStore.get(uid)!;
                if (object.onMouseUp(event, context)) {
                    return true;
                }
            }
        }

        // this.selectedObject = null;
        this.onSelect(null);
        this.onChange();

        return false;
    }

    update(doc: DocumentState): any {
        const thisIds: string[] = [];

        let l: number;
        let r: number;
        let t: number;
        let b: number;


        doc.drawing.entities.forEach((e) => {
            const o = this.messageStore.get(e.uid);
            if (o) {
                assert(isCalculated(e));
                const te = e as CalculatableEntityConcrete;
                if (te.calculation !== null) {
                    o.updateTarget(te);
                    thisIds.push(e.uid);
                }
            } else {
                // create new message
                if (isCalculated(e)) {
                    const te = e as CalculatableEntityConcrete;
                    if (te.calculation !== null) {
                        if (l === undefined) {
                            const bx = getBoundingBox(this.objectStore, doc);
                            l = bx.l;
                            r = bx.r;
                            t = bx.t;
                            b = bx.b;
                        }

                        const msg: Popup = new Popup(
                            this.objectStore,
                            this,
                            te,
                            {x: (l + r) / 2, y: (t + b) / 2},
                            () => this.onSelect(msg),
                            () => this.onChange(),
                            () => {/**/},
                        );
                        this.messageStore.set(e.uid, msg);
                        thisIds.push(e.uid);
                    }
                }
            }
        });

        this.idsInOrder.forEach((uid) => {
            if (thisIds.indexOf(uid) === -1) {
                this.messageStore.delete(uid);
            }
        });

        this.idsInOrder.splice(0);
        this.idsInOrder.push(...thisIds);
    }

    calculate(doc: DocumentState, catalog: Catalog, demandType: DemandType, done: () => void) {

        const middleWc = getDocumentCenter(this.objectStore, doc);
        doc.uiState.isCalculating = true;
        this.calculator.calculate(this.objectStore, doc, middleWc, catalog, demandType, (warnings) => {

            doc.uiState.lastCalculationId = doc.nextId;
            doc.uiState.lastCalculationUiSettings = {
                demandType,
            };
            doc.uiState.isCalculating = false;

            this.update(doc);

            // Create new messages

            done();
        });
    }

    dragObjects(objects: BaseBackedObject[]): void {
        //
    }

    releaseDrag(): void {
        //
    }
}
