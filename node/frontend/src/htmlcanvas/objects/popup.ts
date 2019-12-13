import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {DrawingContext, ObjectStore} from '../../../src/htmlcanvas/lib/types';
import {Coord, DocumentState, DrawableEntity, Rectangle} from '../../../src/store/document/types';
import {ViewPort} from '../../../src/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '../../../src/htmlcanvas/types';
import BackedDrawableObject from '../../../src/htmlcanvas/lib/backed-drawable-object';
import PopupEntity, {MessageType} from '../../../src/store/document/entities/calculations/popup-entity';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import {Interaction} from '../../../src/htmlcanvas/lib/interaction';
import {EntityType} from '../../../src/store/document/entities/types';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import Flatten from '@flatten-js/core';
import uuid from 'uuid';
import {CalculationField} from '../../../src/store/document/calculations/calculation-field';
import {makePipeCalculationFields} from '../../../src/store/document/calculations/pipe-calculation';
import {makeFittingCalculationFields} from '../../../src/store/document/calculations/fitting-calculation';
import {makeTmvCalculationFields} from '../../../src/store/document/calculations/tmv-calculation';
import {makeRiserCalculationFields} from '../../store/document/calculations/riser-calculations';
import {makeFixtureCalculationFields} from '../../../src/store/document/calculations/fixture-calculation';
import {decomposeMatrix, matrixScale} from '../../../src/htmlcanvas/utils';
import {resolveProperty} from '../../../src/htmlcanvas/lib/utils';
import CenterDraggableObject from '../../../src/htmlcanvas/lib/object-traits/center-draggable-object';
import {CalculationTarget} from '../../../src/store/document/calculations/types';
import * as _ from 'lodash';
import {CalculatableEntityConcrete, DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {DEFAULT_FONT_NAME} from '../../../src/config';
import Layer from '../../../src/htmlcanvas/layers/layer';
import DrawableObjectFactory from '../../../src/htmlcanvas/lib/drawable-object-factory';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {ConnectableObject} from '../../../src/htmlcanvas/lib/object-traits/connectable';
import {CenteredObject} from '../../../src/htmlcanvas/lib/object-traits/centered-object';
import {makeDirectedValveFields} from '../../../src/store/document/entities/directed-valves/directed-valve-entity';
import {makeDirectedValveCalculationFields} from '../../../src/store/document/calculations/directed-valve-calculation';
import {CalculationContext} from '../../../src/calculations/types';
import {FlowNode, SELF_CONNECTION} from '../../../src/calculations/calculation-engine';
import {DrawingArgs} from '../../../src/htmlcanvas/lib/drawable-object';
import {getFields} from '../../../src/calculations/utils';

@CenterDraggableObject
@CenteredObject
export default class Popup extends BackedDrawableObject<PopupEntity> {
    static MESSGAE_DISTANCE: number = 400;

    static findCenter(target: BaseBackedObject, middleWc: Coord): Coord {

        const mp = Flatten.point(middleWc.x, middleWc.y);

        let center;

        // find position for it.
        if (target instanceof Pipe) {
            const [a, b] = target.worldEndpoints();
            // put it in the outside.
            const x = (a.x + b.x) / 2;
            const y = (a.y + b.y) / 2;

            const middle = Flatten.point(x, y);
            const vector = Flatten.vector(Flatten.point(a.x, a.y), Flatten.point(b.x, b.y));
            const perp = vector.rotate90CCW();
            const candA = middle.translate(perp.normalize().multiply(Popup.MESSGAE_DISTANCE));
            const candB = middle.translate(perp.normalize().multiply(-Popup.MESSGAE_DISTANCE));

            if (mp.distanceTo(candA)[0] > mp.distanceTo(candB)[0]) {
                center = {x: candA.x, y: candA.y};
            } else {
                center = {x: candB.x, y: candB.y};
            }
        } else if (target) {
            const wc = target.toWorldCoord({x: 0, y: 0});
            const wcp = Flatten.point(wc.x, wc.y);
            const away = Flatten.vector(mp, wcp);
            center = wcp.translate(away.normalize().multiply(Popup.MESSGAE_DISTANCE));
        }

        if (!center) {
            throw new Error('created message with unknown center. target is: ' + JSON.stringify(target.entity));
        }
        return center;
    }

    target: CalculatableEntityConcrete;

    fields: CalculationField[] | undefined;
    outputs: string[] | undefined;

    lastDrawnBox: Rectangle | undefined;

    constructor(
        objectStore: ObjectStore,
        layer: Layer,
        target: CalculatableEntityConcrete,
        middleWc: Coord,
        onSelect: (event: MouseEvent | KeyboardEvent) => any,
        onChange: () => any,
        onCommit: (event: MouseEvent | KeyboardEvent) => any,
    ) {

        const object = objectStore.get(target.uid);
        if (!object) {
            throw new Error('target object doesn\'t exist');
        }

        const center = Popup.findCenter(object, middleWc);

        const obj: PopupEntity = {
            center,
            parentUid: null,
            targetUids: [target.type],
            type: EntityType.RESULTS_MESSAGE,
            uid: uuid(),
            params: { type: MessageType.CALCULATION },
        };
        super(objectStore, layer, obj, onSelect, onChange, onCommit);

        this.target = target;
    }

    get position(): Matrix {
        if (!this.entity.center) {
            throw new Error('no center defined in message ' + JSON.stringify(this.entity));
        }
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    debase(): void {
        throw new Error('Method not implemented.');
    }

    rebase(context: CanvasContext): void {
        throw new Error('Method not implemented.');
    }

    // add return type to invoke case complete check
    generateFields(context: DrawingContext) {
        if (this.target.calculation === null) {
            return;
        }
        this.fields = getFields(this.target, context.doc);
        this.outputs = [];
        this.fields.forEach((f) => {
            const property = resolveProperty(f.property, this.target.calculation);
            let repr = _.toString(property);
            if (_.isNumber(property)) {
                repr = property.toFixed(5);
            }
            const line = f.title + ': ' + repr;
            this.outputs!.push(line);
        });
    }

    drawInternal(context: DrawingContext, args: DrawingArgs): void {
        if (this.target.calculation === null) {
            // this case can happen legitimately, when a calculation is erased and
            // we render before we get a chance to process document.
            return;
        }

        if (this.fields === undefined) {
            this.generateFields(context);
        }

        const {ctx} = context;
        const scale = matrixScale(ctx.getTransform());
        ctx.lineWidth = Math.max(1 / scale, 10);

        const fontSize = 50;
        ctx.font = fontSize + 'px ' + DEFAULT_FONT_NAME;

        let width = 0;
        const height = this.outputs!.length * fontSize;
        this.outputs!.forEach((i) => {
            width = Math.max(width, ctx.measureText(i).width);
        });

        const boxWidth = width * 1.1;
        const boxHeight = height + boxWidth - width;

        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#DDFFEE';
        ctx.beginPath();
        ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
        ctx.stroke();

        ctx.fillStyle = '#003300';
        for (let i = 0; i < this.outputs!.length; i++) {
            ctx.fillText(this.outputs![i], - width / 2, i * fontSize - height / 2 + fontSize * 0.8);
        }

        ctx.beginPath();
        ctx.rect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
        ctx.stroke();

        this.lastDrawnBox = {x: -boxWidth / 2, y: -boxHeight / 2, w: boxWidth, h: boxHeight};

        this.withWorld(context, this.toObjectCoord({x: 0, y: 0}), () => {
            const innerScale = matrixScale(ctx.getTransform());
            ctx.lineWidth = Math.max(1 / innerScale, 10);
            ctx.beginPath();

            const other = this.objectStore.get(this.target.uid);
            if (other) {

                let ts =  other.shape();
                if (other.type === EntityType.PIPE) {
                    ts = (other as Pipe).snipEnds(Popup.MESSGAE_DISTANCE / 2);
                }
                if (ts) {
                    const shortest = this.shape().distanceTo(ts)[1];

                    ctx.moveTo(shortest.ps.x, shortest.ps.y);
                    ctx.lineTo(shortest.pe.x, shortest.pe.y);
                    ctx.stroke();
                }
            }
        });
    }

    inBounds(objectCoord: Coord, objectRadius?: number): boolean {
        if (this.lastDrawnBox) {
            return objectCoord.x >= this.lastDrawnBox.x &&
                objectCoord.x <= this.lastDrawnBox.x + this.lastDrawnBox.w &&
                objectCoord.y >= this.lastDrawnBox.y &&
                objectCoord.y <= this.lastDrawnBox.y + this.lastDrawnBox.h;
        }
        return false;
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        return null;
    }

    prepareDelete(): BaseBackedObject[] {
        return [];
    }

    shape(): Flatten.Polygon {
        const wc = this.entity.center;
        const l = wc.x - (this.lastDrawnBox ? this.lastDrawnBox.w / 2 : 30);
        const r = wc.x + (this.lastDrawnBox ? this.lastDrawnBox.w / 2 : 30);
        const t = wc.y - (this.lastDrawnBox ? this.lastDrawnBox.h / 2 : 30);
        const b = wc.y + (this.lastDrawnBox ? this.lastDrawnBox.h / 2 : 30);
        const p = new Flatten.Polygon();
        p.addFace([
            Flatten.point(l, t),
            Flatten.point(r, t),
            Flatten.point(r, b),
            Flatten.point(l, b),
        ]);
        return p;
    }

    rememberToRegister(): void {
        // There is never a need to load these objects into the document, so we won't
        // be registering.
    }

    updateTarget(entity: CalculatableEntityConcrete) {
        this.target = entity;
        this.fields = undefined;
        this.outputs = undefined;
    }

    getFrictionHeadLoss(context: CalculationContext,
                        flowLS: number,
                        from: FlowNode,
                        to: FlowNode,
                        signed: boolean,
    ): number {
        throw new Error('don\'t do it');
    }


    protected refreshObjectInternal(obj: DrawableEntity, old?: DrawableEntity): void {
        //
    }
}
