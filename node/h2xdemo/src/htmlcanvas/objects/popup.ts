import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {DrawingContext, ObjectStore} from '@/htmlcanvas/lib/types';
import {Coord, DrawableEntity, Rectangle} from '@/store/document/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import PopupEntity, {MessageType} from '@/store/document/entities/calculations/popup-entity';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {EntityType} from '@/store/document/entities/types';
import Pipe from '@/htmlcanvas/objects/pipe';
import Flatten from '@flatten-js/core';
import uuid from 'uuid';
import {MessageField} from '@/store/document/calculations/message-field';
import {makePipeCalculationFields} from '@/store/document/calculations/pipe-calculation';
import {makeValveCalculationFields} from '@/store/document/calculations/valve-calculation';
import {makeTmvCalculationFields} from '@/store/document/calculations/tmv-calculation';
import {makeFlowSourceCalculationFields} from '@/store/document/calculations/flow-source-calculation';
import {makeFixtureCalculationFields} from '@/store/document/calculations/fixture-calculation';
import {decomposeMatrix, matrixScale} from '@/htmlcanvas/utils';
import {resolveProperty} from '@/htmlcanvas/lib/utils';
import CenterDraggableObject from '@/htmlcanvas/lib/object-traits/center-draggable-object';
import {CalculationTarget} from '@/store/document/calculations/types';

@CenterDraggableObject
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

    target: CalculationTarget<any>;

    fields: MessageField[];
    outputs: string[];

    lastDrawnBox: Rectangle | undefined;

    constructor(
        objectStore: ObjectStore,
        target: CalculationTarget<any>,
        middleWc: Coord,
        onSelect: () => any,
        onChange: () => any,
        onCommit: () => any,
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
        super(objectStore, null, obj, onSelect, onChange, onCommit);

        this.target = target;
        this.fields = [];
        this.outputs = [];
        this.generateFields();
    }

    get position(): Matrix {
        if (!this.entity.center) {
            throw new Error('no center defined in message ' + JSON.stringify(this.entity));
        }
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }


    getFields(): MessageField[] {
        switch (this.target.type) {
            case EntityType.FLOW_SOURCE:
                return makeFlowSourceCalculationFields();
            case EntityType.FLOW_RETURN:
                throw new Error('unsupported');
            case EntityType.PIPE:
                return makePipeCalculationFields();
            case EntityType.VALVE:
                return makeValveCalculationFields();
            case EntityType.TMV:
                return makeTmvCalculationFields();
            case EntityType.FIXTURE:
                return makeFixtureCalculationFields();
            case EntityType.INVISIBLE_NODE:
            case EntityType.SYSTEM_NODE:
            case EntityType.RESULTS_MESSAGE:
            case EntityType.BACKGROUND_IMAGE:
                throw new Error('cannot be calculated');
        }
    }

    // add return type to invoke case complete check
    generateFields() {
        if (this.target.calculation === null) {
            return;
        }
        this.fields = this.getFields();
        this.outputs = [];
        this.fields.forEach((f) => {
            const line = f.title + ': ' + resolveProperty(f.property, this.target.calculation);
            this.outputs.push(line);
        });
    }

    drawInternal(context: DrawingContext, ...args: any[]): void {
        if (this.target.calculation === null) {
            // this case can happen legitimately, when a calculation is erased and
            // we render before we get a chance to process document.
            return;
        }

        const {ctx} = context;
        const scale = matrixScale(ctx.getTransform());
        ctx.lineWidth = Math.max(1 / scale, 10);

        const fontSize = 50;
        ctx.font = fontSize + 'px Helvetica';

        let width = 0;
        const height = this.outputs.length * fontSize;
        this.outputs.forEach((i) => {
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
        for (let i = 0; i < this.outputs.length; i++) {
            ctx.fillText(this.outputs[i], - width / 2, i * fontSize - height / 2 + fontSize * 0.8);
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
                    const l = ts as Flatten.Segment;

                    const chop = Popup.MESSGAE_DISTANCE / 2;

                    const ep = (other as Pipe).worldEndpoints();
                    const middle  = Flatten.point((ep[0].x + ep[1].x) / 2, (ep[0].y + ep[1].y) / 2);
                    if (l.length < chop * 2) {
                        ts = middle;
                    } else {
                        const pe2m = Flatten.vector(l.pe, middle);
                        const ps2m = Flatten.vector(l.ps, middle);
                        ts = Flatten.segment(
                            l.pe.translate(pe2m.normalize().multiply(chop)),
                            l.ps.translate(ps2m.normalize().multiply(chop)),
                        );
                    }
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

    offerInteraction(interaction: Interaction): DrawableEntity[] | null {
        return null;
    }

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        return UNHANDLED;
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        return false;
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

    updateTarget(entity: CalculationTarget<any>) {
        this.target = entity;
        this.generateFields();
    }

    protected refreshObjectInternal(obj: DrawableEntity, old?: DrawableEntity): void {
        //
    }
}
