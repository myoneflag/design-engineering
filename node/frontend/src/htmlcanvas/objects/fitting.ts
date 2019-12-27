import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import FittingEntity, {fillValveDefaultFields} from '../../../src/store/document/entities/fitting-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {Coord, DocumentState} from '../../../src/store/document/types';
import {matrixScale} from '../../../src/htmlcanvas/utils';
import Flatten from '@flatten-js/core';
import Connectable, {ConnectableObject} from '../../../src/htmlcanvas/lib/object-traits/connectable';
import {canonizeAngleRad, getValveK, isAcuteRad, isRightAngleRad, isStraightRad, lighten} from '../../../src/lib/utils';
import CenterDraggableObject from '../../../src/htmlcanvas/lib/object-traits/center-draggable-object';
import {DrawingContext} from '../../../src/htmlcanvas/lib/types';
import DrawableObjectFactory from '../../../src/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '../../../src/store/document/entities/types';
import BackedConnectable from '../../../src/htmlcanvas/lib/BackedConnectable';
import {getDragPriority} from '../../../src/store/document';
import {parseCatalogNumberExact} from '../../../src/htmlcanvas/lib/utils';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import {SelectableObject} from '../../../src/htmlcanvas/lib/object-traits/selectable';
import {CenteredObject} from '../../../src/htmlcanvas/lib/object-traits/centered-object';
import {CalculationContext} from '../../../src/calculations/types';
import {FlowNode, SELF_CONNECTION} from '../../../src/calculations/calculation-engine';
import {DrawingArgs} from '../../../src/htmlcanvas/lib/drawable-object';
import {CalculationData} from '../../../src/store/document/calculations/calculation-field';
import {Calculated, CalculatedObject} from '../../../src/htmlcanvas/lib/object-traits/calculated-object';
import {EPS} from "../../calculations/pressure-drops";
import FittingCalculation, {emptyFittingCalculation} from "../../store/document/calculations/fitting-calculation";
import math3d from 'math3d';
import PipeEntity from "../../store/document/entities/pipe-entity";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject
@CenteredObject
export default class Fitting extends BackedConnectable<FittingEntity> implements Connectable, Calculated {
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

    drawInternal({ctx, doc}: DrawingContext, {active, selected}: DrawingArgs): void {

        // asdf
        const scale = matrixScale(ctx.getTransform());

        if (this.objectStore.getConnections(this.entity.uid).length === 2) {
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
            if (active && selected) {
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

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
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
        const connections = this.objectStore.getConnections(this.entity.uid);
        if (connections.length === 4) {
            return 'Cross fitting';
        } else if (connections.length === 3) {
            return 'Tee fitting';
        } else if (connections.length === 2) {
            return 'Elbow/Coupling fitting';
        } else if (connections.length === 1) {
            return 'Deadleg';
        } else {
            return connections.length + '-way fitting';
        }
    }

    prepareDelete(): BaseBackedObject[] {
        return []; // this was handled by @Connectable
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

        if (Math.abs(flowLS) < EPS) {
            return 0;
        }

        const ga = context.drawing.metadata.calculationParams.gravitationalAcceleration;

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

        let smallestDiameterMM: number | undefined = undefined;
        let largestDiameterMM: number | undefined = undefined;
        const connections = this.objectStore.getConnections(this.entity.uid);
        const internals: string[] = [];
        connections.forEach((p) => {
            const pipe = this.objectStore.get(p) as Pipe;
            const thisDiameter =
                parseCatalogNumberExact(context.globalStore.getCalculation(pipe.entity)!.realInternalDiameterMM)!;
            internals.push('' + thisDiameter);
            if (smallestDiameterMM == null || (thisDiameter != null && thisDiameter < smallestDiameterMM)) {
                smallestDiameterMM = thisDiameter;
            }
            if (largestDiameterMM == null || (thisDiameter != null && thisDiameter > largestDiameterMM)) {
                largestDiameterMM = thisDiameter;
            }
        });

        if (smallestDiameterMM == null || largestDiameterMM == null) {
            throw new Error('can\'t find pipe sizes ' + JSON.stringify(internals) + ' ' + flowLS);
        }

        let k: number | null = null;
        const fromc = this.get3DOffset(from.connection);
        const toc = this.get3DOffset(to.connection);
        const fromv = new math3d.Vector3(fromc.x, fromc.y, fromc.z);
        const tov = new math3d.Vector3(toc.x, toc.y, toc.z);

        const angle = Math.abs(canonizeAngleRad(Math.acos(fromv.normalize().dot(tov.normalize()))));

        if (connections.length === 2) {
            // through valve
            if (isRightAngleRad(angle, Math.PI / 8)) {
                k = getValveK('90Elbow', context.catalog, smallestDiameterMM);
            } else if (isAcuteRad(angle)) {
                k = getValveK('90Elbow', context.catalog, smallestDiameterMM);
                if (k) {
                    k *= 2;
                }
            } else if (isStraightRad(angle, Math.PI / 8)) {
                k = 0;
            } else {
                k = getValveK('45Elbow', context.catalog, smallestDiameterMM);
            }
        } else if (connections.length >= 3) {
            if (isStraightRad(angle, Math.PI / 4)) {
                k = getValveK('tThruFlow', context.catalog, smallestDiameterMM);
            } else {
                k = getValveK('tThruBranch', context.catalog, smallestDiameterMM);
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

    getCalculationEntities(context: CalculationContext): Array<FittingEntity | PipeEntity> {
        return this.getCalculationTower(context).flat();
    }

    collectCalculations(context: CalculationContext): FittingCalculation {
        if (this.getCalculationTower(context).length === 0) {
            return emptyFittingCalculation();
        }

        const calc = context.globalStore.getOrCreateCalculation(this.getCalculationTower(context)[0][0]);

        // explicitly create this to help with refactors
        const res: FittingCalculation = {
            flowRateLS: calc.flowRateLS,
            pressureDropKPA: calc.pressureDropKPA,
            pressureKPA: calc.pressureKPA,
            warning: calc.warning,
        };

        const tower = this.getCalculationTower(context);

        if (this.getCalculationConnectionGroups(context).flat().length === 2) {
            // that's fine
            if (this.getCalculationTower(context).length === 2) {
                res.pressureDropKPA =
                    context.globalStore.getOrCreateCalculation(this.getCalculationTower(context)[0][0]).pressureDropKPA! +
                    context.globalStore.getOrCreateCalculation(this.getCalculationTower(context)[1][0]).pressureDropKPA!;
            }
        } else {
            res.flowRateLS = null;
            res.pressureDropKPA = null;
        }


        tower.forEach(([v, p]) => {
            res.warning = res.warning || context.globalStore.getOrCreateCalculation(v).warning;
        });

        return res;
    }

    protected refreshObjectInternal(obj: FittingEntity): void {
        //
    }
}
