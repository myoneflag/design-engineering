import DrawableObject from '../../../src/htmlcanvas/lib/drawable-object';
import {CalculationFilter, CalculationFilters, Coord, DocumentState, DrawableEntity} from '../../../src/store/document/types';
import {DrawingContext, ObjectStore} from '../../../src/htmlcanvas/lib/types';
import * as _ from 'lodash';
import {Interaction} from '../../../src/htmlcanvas/lib/interaction';
import {EntityType} from '../../../src/store/document/entities/types';
import BackedDrawableObject from '../../../src/htmlcanvas/lib/backed-drawable-object';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import Layer from '../../../src/htmlcanvas/layers/layer';
import {cloneSimple} from '../../../src/lib/utils';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {CalculationContext} from '../../../src/calculations/types';
import {FlowNode} from '../../../src/calculations/calculation-engine';
import Flatten from '@flatten-js/core';
import {CalculationData, CalculationField} from '../../../src/store/document/calculations/calculation-field';
import * as TM from "transformation-matrix";

export default abstract class BaseBackedObject extends DrawableObject {
    entity: DrawableEntityConcrete;
    objectStore: ObjectStore;

    protected onSelect: (event: MouseEvent | KeyboardEvent) => void;
    protected onChange: () => void;
    protected onCommit: (event: MouseEvent | KeyboardEvent) => void;

    protected constructor(
        objectStore: ObjectStore,
        layer: Layer,
        obj: DrawableEntityConcrete,
        onSelect: (event: MouseEvent | KeyboardEvent) => void,
        onChange: () => void,
        onCommit: (event: MouseEvent | KeyboardEvent) => void,
    ) {
        super(null, layer);
        this.entity = obj;
        this.onSelect = onSelect;
        this.onChange = onChange;
        this.onCommit = onCommit;
        this.objectStore = objectStore;
        this.refreshObjectInternal(obj);
    }

    get parent() {
        if (this.entity.parentUid === null) {
            return null;
        } else {
            const result = this.objectStore.get(this.entity.parentUid);
            if (result) {
                return result;
            }
            throw new Error('Parent object not created. parent uid: '
                + this.entity.parentUid + ' this uid ' + this.entity.uid);
        }
    }

    refreshObject(obj: DrawableEntityConcrete) {
        const old = this.entity;
        this.entity = obj;
        this.refreshObjectInternal(obj, old);
    }



    drawCalculationBox(
        context: DrawingContext,
        data: CalculationData[],
        dryRun?: boolean,
        warnSingOnly?: boolean,
    ): Flatten.Box {
        throw new Error('Not implemented. Please use @CalculatedObject to implement.');
    }

    measureCalculationBox(context: DrawingContext, data: CalculationData[]): Array<[TM.Matrix, Flatten.Polygon]> {
        throw new Error('Not implemented. Please use @CalculatedObject to implement.');
    }

    getCalculationFields(context: DrawingContext, filters: CalculationFilters): CalculationData[] {
        throw new Error('Not implemented. Please use @CalculatedObject to implement.');
    }

    hasWarning(): boolean {
        throw new Error('Not implemented. Please use @CalculatedObject to implement.');
    }

    debase(): void {
        throw new Error('Method not implemented. Please use @Connectable to implement.');
    }

    rebase(context: CanvasContext): void {
        throw new Error('Method not implemented. Please use @Connectable to implement.');
    }

    getSortedAngles(): number[] {
        throw new Error('Method not implemented. Please use @Connectable to implement.');
    }

    abstract offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null;

    // Return list of objects to remove.
    abstract prepareDelete(context: CanvasContext): BaseBackedObject[];

    abstract inBounds(objectCoord: Coord, objectRadius?: number): boolean;

    abstract getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean,
    ): number;

    get uid() {
        return this.entity.uid;
    }

    get type(): EntityType {
        return this.entity.type;
    }

    protected abstract refreshObjectInternal(obj: DrawableEntity, old?: DrawableEntity): void;
}