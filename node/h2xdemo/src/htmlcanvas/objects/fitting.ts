import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import FittingEntity, {fillValveDefaultFields} from '@/store/document/entities/fitting-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {Coord, DocumentState} from '@/store/document/types';
import {matrixScale} from '@/htmlcanvas/utils';
import Flatten from '@flatten-js/core';
import Connectable, {ConnectableObject} from '@/htmlcanvas/lib/object-traits/connectable';
import {angleDiffRad, isAcuteRad, isRightAngleRad, isStraightRad, lighten} from '@/lib/utils';
import CenterDraggableObject from '@/htmlcanvas/lib/object-traits/center-draggable-object';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {getDragPriority} from '@/store/document';
import {Catalog, ValveSize} from '@/store/catalog/types';
import {interpolateTable, lowerBoundTable, parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';
import Pipe from '@/htmlcanvas/objects/pipe';
import {SelectableObject} from '@/htmlcanvas/lib/object-traits/selectable';
import PipeEntity from '@/store/document/entities/pipe-entity';
import uuid from 'uuid';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {CenteredObject} from '@/htmlcanvas/lib/object-traits/centered-object';
import {CalculationContext} from '@/calculations/types';
import {FlowNode, SELF_CONNECTION} from '@/calculations/calculation-engine';

@SelectableObject
@CenterDraggableObject
@ConnectableObject
@CenteredObject
export default class Fitting extends BackedConnectable<FittingEntity> implements Connectable {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.FITTING, Fitting);
    }

    minimumConnections = 1;
    maximumConnections = null;
    dragPriority = getDragPriority(EntityType.FITTING);

    lastDrawnWidth!: number;
    pixelRadius: number = 5;
    lastDrawnLength!: number;

    TURN_RADIUS_MM = 100;
    FITTING_DIAMETER_PIXELS = 3;
    lastRadials!: Array<[Coord, BaseBackedObject]>;

    get position(): Matrix {
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.

    drawInternal({ctx, doc}: DrawingContext, layerActive: boolean, selected: boolean): void {

        // asdf
        const scale = matrixScale(ctx.getTransform());

        if (this.entity.connections.length === 2) {
            // TODO: draw an angled arc.
        } // else {

        ctx.lineCap = 'round';

        const minJointLength = this.FITTING_DIAMETER_PIXELS / scale;

        const defaultWidth = Math.max(this.FITTING_DIAMETER_PIXELS / scale, 25 / this.toWorldLength(1));
        this.lastDrawnWidth = defaultWidth;
        this.lastDrawnLength = Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM));

        this.lastRadials = this.getRadials();
        this.lastRadials.forEach(([wc, pipe]) => {
            let targetWidth = defaultWidth;
            if (pipe.entity.type === EntityType.PIPE) {

                if ((pipe as Pipe).lastDrawnWidth) {
                    targetWidth =
                        Math.max(defaultWidth, (pipe as Pipe).lastDrawnWidth + this.FITTING_DIAMETER_PIXELS / scale);
                }
            }
            const oc = this.toObjectCoord(wc);
            const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
            const small = vec.normalize().multiply(Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM)));
            if (layerActive && selected) {
                ctx.beginPath();
                ctx.lineWidth = targetWidth + this.FITTING_DIAMETER_PIXELS * 2 / scale;

                this.lastDrawnWidth = defaultWidth + this.FITTING_DIAMETER_PIXELS * 2 / scale;
                ctx.strokeStyle = lighten(this.displayEntity(doc).color!.hex, 50, 0.5);
                ctx.moveTo(0, 0);
                ctx.lineTo(small.x, small.y);
                ctx.stroke();
            }

            ctx.strokeStyle = this.displayEntity(doc).color!.hex;
            ctx.lineWidth = targetWidth;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(small.x, small.y);
            ctx.stroke();
        });
    }

    displayEntity(context: DocumentState) {
        return fillValveDefaultFields(context, this.entity);
    }

    inBounds(moc: Coord, radius: number = 0): boolean {
        if (this.lastRadials && this.lastDrawnLength !== undefined && this.lastDrawnWidth !== undefined) {
            let selected = false;
            this.lastRadials.forEach(([wc]) => {
                const oc = this.toObjectCoord(wc);
                const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
                const small = vec.normalize().multiply(this.lastDrawnLength);

                if (Flatten.segment(Flatten.point(0, 0), Flatten.point(small.x, small.y))
                    .distanceTo(Flatten.point(moc.x, moc.y))[0] <= this.lastDrawnWidth + radius) {
                    selected = true;
                }
            });
            return selected;
        } else {
            const l = this.toObjectLength(this.TURN_RADIUS_MM * 1.5);
            return moc.x * moc.x + moc.y * moc.y <= (l + radius) * (l + radius);
        }
    }

    get friendlyTypeName(): string {
        if (this.entity.connections.length === 4) {
            return 'Cross fitting';
        } else if (this.entity.connections.length === 3) {
            return 'Tee fitting';
        } else if (this.entity.connections.length === 2) {
            return 'Elbow/Coupling fitting';
        } else if (this.entity.connections.length === 1) {
            return 'Deadleg';
        } else {
            return this.entity.connections.length + '-way fitting';
        }
    }

    prepareDelete(): BaseBackedObject[] {
        return []; // this was handled by @Connectable
    }

    getValveK(catalogId: string, catalog: Catalog, pipeLenMM: number): number | null {
        const table = catalog.valves[catalogId].valvesBySize;
        return interpolateTable(table, pipeLenMM, false, (v) => parseCatalogNumberExact(v.kValue));
    }

    getFrictionHeadLoss(context: CalculationContext,
                        flowLS: number,
                        from: FlowNode,
                        to: FlowNode,
                        signed: boolean,
    ): number {
        if (from.connection === SELF_CONNECTION || to.connection === SELF_CONNECTION) {
            throw new Error('I don\'t like it');
        }

        const ga = context.drawing.calculationParams.gravitationalAcceleration;

        let sign = 1;
        if (flowLS < 0) {
            const oldFrom = from;
            from = to;
            to = oldFrom;
            flowLS = -flowLS;
            if (signed) {
                sign = -1;
            }
        }

        let smallestDiameterMM: number | undefined;
        let largestDiameterMM: number | undefined;
        this.entity.connections.forEach((p) => {
            const pipe = this.objectStore.get(p) as Pipe;
            const thisDiameter = parseCatalogNumberExact(pipe.entity.calculation!.realInternalDiameterMM)!;
            if (smallestDiameterMM === undefined || thisDiameter < smallestDiameterMM) {
                smallestDiameterMM = thisDiameter;
            }
            if (largestDiameterMM === undefined || thisDiameter > largestDiameterMM) {
                largestDiameterMM = thisDiameter;
            }
        });

        if (smallestDiameterMM === undefined || largestDiameterMM === undefined) {
            throw new Error('can\'t find pipe sizes');
        }

        let k: number | null = null;
        const angle =  angleDiffRad(this.getAngleOfRad(from.connection), this.getAngleOfRad(to.connection));

        if (this.entity.connections.length === 2) {
            // through valve
            if (isRightAngleRad(angle, Math.PI / 8)) {
                k = this.getValveK('90Elbow', context.catalog, smallestDiameterMM);
            } else if (isAcuteRad(angle)) {
                k = this.getValveK('90Elbow', context.catalog, smallestDiameterMM);
                if (k) {
                    k *= 2;
                }
            } else if (isStraightRad(angle, Math.PI / 8)) {
                k = 0;
            } else {
                k = this.getValveK('45Elbow', context.catalog, smallestDiameterMM);
            }
        } else if (this.entity.connections.length >= 3) {
            if (isStraightRad(angle, Math.PI / 4)) {
                k = this.getValveK('tThruFlow', context.catalog, smallestDiameterMM);
            } else {
                k = this.getValveK('tThruBranch', context.catalog, smallestDiameterMM);
            }
        } else {
            throw new Error('edge shouldn\'t exist');
        }

        if (k === null) {
            throw new Error('could not find k value of fitting');
        }

        const volLM = smallestDiameterMM ** 2 * Math.PI / 4 / 1000;
        const velocityMS = flowLS / volLM;
        return sign * (k * velocityMS ** 2) / (2 * ga);
    }

    rememberToRegister(): void {
        //
    }

    protected refreshObjectInternal(obj: FittingEntity): void {
        //
    }
}

DrawableObjectFactory.registerEntity(EntityType.FITTING, Fitting);
