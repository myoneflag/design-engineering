import {Coord} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import Pipe from '@/htmlcanvas/objects/pipe';
import assert from 'assert';
import {EntityType} from '@/store/document/entities/types';
import * as _ from 'lodash';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import Flatten from '@flatten-js/core';
import {PIPE_HEIGHT_GRAPHIC_EPS_MM} from '@/config';
import {CenteredObject} from '@/htmlcanvas/lib/object-traits/centered-object';
import {CalculationContext} from '@/calculations/types';
import {FlowNode} from '@/calculations/calculation-engine';
import {angleDiffRad} from '@/lib/utils';
import SystemNode from '@/htmlcanvas/objects/tmv/system-node';

export default interface Connectable {
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]>;
    getAngles(): number[];
    prepareDelete(context: CanvasContext): BaseBackedObject[];
    isStraight(tolerance: number): boolean;
    getAngleOfRad(connection: string): number;

    connect(uid: string): void;
    disconnect(uid: string): void;

    drawInternal(context: DrawingContext, layerActive: boolean, selected: boolean): void;
}

const EPS = 1e-5;

export function ConnectableObject<T extends new (...args: any[])
    => Connectable & BackedConnectable<ConnectableEntityConcrete>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return (class extends constructor implements Connectable {

        drawInternal(context: DrawingContext, layerActive: boolean, selected: boolean): void {
            super.drawInternal(context, layerActive, selected);

            const {ctx} = context;

            // draw rings.
            const radials = this.getRadials();
            const radialAngles: Array<[number, BaseBackedObject]> = radials.map(([wc, o]) => {
                const oo = this.toObjectCoord(wc);
                return [Math.atan2(oo.y, oo.x), o];
            });

            radialAngles.sort((a, b) => a[0] - b[0]);

            let highest = -Infinity;
            radials.forEach(([a, r]) => {
                if (r.entity.type === EntityType.PIPE) {
                    highest = Math.max(highest, r.entity.heightAboveFloorM);
                } else {
                    throw new Error('don\'t know how to handle non-pipe objects');
                }
            });

            const highPipes = new Set<string>();

            radials.forEach(([a, r]) => {
                if (r.entity.type === EntityType.PIPE) {
                    if (r.entity.heightAboveFloorM + PIPE_HEIGHT_GRAPHIC_EPS_MM / 1000 >= highest) {
                        highPipes.add(r.entity.uid);
                    }
                } else {
                    throw new Error('don\'t know how to handle non-pipe objects');
                }
            });

            // Draw an arc for every pieslice between pipes that have a lower pipe in it.

            highPipes.forEach((huid) => {
                const ix = radialAngles.findIndex(([a, r]) => r.uid === huid);
                let hasLowerInBetween = false;
                for (let i = 1; i <= radialAngles.length; i++) {
                    const [a, r] = radialAngles[(ix + i) % radialAngles.length];
                    if (!highPipes.has(r.uid)) {
                        hasLowerInBetween = true;
                    } else {
                        if (hasLowerInBetween) {
                            // draw
                            const maxWidth = Math.max(
                                (this.objectStore.get(r.uid) as Pipe).lastDrawnWidth,
                                (this.objectStore.get(huid) as Pipe).lastDrawnWidth,
                            ) * 2;
                            const mya = radialAngles[ix][0];

                            const adiff = (a - mya + 4 * Math.PI - EPS) % (2 * Math.PI) + EPS;
                            const v1 = Flatten.vector([1, 0])
                                .rotate(mya)
                                .normalize()
                                .multiply(maxWidth * (3 - adiff / (Math.PI * 0.95)));
                            const v1perp = v1.rotate90CCW().normalize().multiply(maxWidth);
                            const v2 = Flatten.vector([1, 0])
                                .rotate(a)
                                .normalize()
                                .multiply(maxWidth * (3 - adiff / (Math.PI * 0.95)));
                            const v2perp = v2.rotate90CW().normalize().multiply(maxWidth);

                            const l1s = Flatten.point().translate(v1).translate(v1perp);
                            const l1e = Flatten.point().translate(v1perp);
                            const l2s = Flatten.point().translate(v2).translate(v2perp);
                            const l2e = Flatten.point().translate(v2perp);

                            ctx.lineWidth = maxWidth / 2;
                            ctx.strokeStyle = '#000';
                            if (adiff > Math.PI - EPS) {
                                // round
                                ctx.beginPath();
                                ctx.moveTo(l1s.x, l1s.y);
                                ctx.lineTo(l1e.x, l1e.y);
                                ctx.stroke();
                                ctx.beginPath();
                                ctx.arc(0, 0, maxWidth, a - Math.PI / 2, mya + Math.PI / 2,  true);
                                ctx.moveTo(l2e.x, l2e.y);
                                ctx.lineTo(l2s.x, l2s.y);
                                ctx.stroke();
                            } else {
                                ctx.beginPath();
                                const mp = Flatten.line(l1s, l1e).intersect(Flatten.line(l2s, l2e));
                                ctx.moveTo(l1s.x, l1s.y);
                                ctx.lineTo(mp[0].x, mp[0].y);
                                ctx.lineTo(l2s.x, l2s.y);
                                ctx.stroke();
                            }
                        }
                        break;
                    }
                }
            });
        }

        getRadials(exclude: string | null = null)
            : Array<[Coord, BaseBackedObject]> {
            const result: Array<[Coord, BaseBackedObject]> = [];
            this.entity.connections.forEach((uid) => {
                if (uid === exclude) {
                    return;
                }

                const connected = this.objectStore.get(uid) as BaseBackedObject;

                if (connected === undefined) {
                    throw new Error('connectable not found: ' + uid + ' of ' + JSON.stringify(this.entity));
                }

                if (connected.entity.type === EntityType.PIPE) {
                    const pipeObject = connected as Pipe;
                    const [other] = pipeObject.worldEndpoints(this.uid);
                    assert(pipeObject.worldEndpoints(this.uid).length <= 1);

                    if (other) {
                        result.push([other, pipeObject]);
                    }
                }
            });
            return result;
        }

        getAngles(): number[] {
            const ret = [];
            const radials = this.getRadials();
            const angles = radials
                .map((r) => this.toObjectCoord(r[0]))
                .map((r) => (Math.atan2(r.y, r.x) + 2 * Math.PI) % (2 * Math.PI));
            angles.sort();
            for (let i = 0; i < angles.length; i++) {
                const diff = angles[(i + 1) % angles.length] - angles[i];
                ret.push((diff * 180 / Math.PI + 360) % 360);
            }
            let sum = 0;
            ret.forEach((n) => sum += n);
            assert(Math.abs(sum - 360) <= EPS || Math.abs(sum) <= EPS);
            return ret;
        }

        isStraight(tolerance: number = EPS): boolean {
            const angles = this.getAngles();
            if (angles.length !== 2) {
                return false;
            }
            return Math.abs(angles[0] - 180) <= tolerance;
        }

        prepareDelete(context: CanvasContext): BaseBackedObject[] {
            // Delete all connected pipes.
            // don't think about adding 'this' since deleting our connecting pipes will automagically
            // make that work.
            const result: BaseBackedObject[] = [];
            _.clone(this.entity.connections).forEach((c) => {
                const o = this.objectStore.get(c);
                if (o instanceof BackedDrawableObject) {
                    result.push(...o.prepareDelete(context));
                } else {
                    throw new Error('Non existent connection on valve ' + JSON.stringify(this.entity));
                }
            });

            const superResult = super.prepareDelete(context);
            result.push(...superResult);

            result.push(this);

            return result;
        }

        getAngleOfRad(connection: string): number {
            const c = this.toObjectCoord(this.getRadials().find((a) => a[1].uid === connection)![0]);
            return Math.atan2(c.y, c.x);
        }

        getFrictionHeadLoss(
            context: CalculationContext,
            flowLS: number,
            from: FlowNode,
            to: FlowNode,
            signed: boolean,
        ): number {
            if (this.entity.type === EntityType.SYSTEM_NODE) {
                // @ts-ignore
                return super.getFrictionHeadLoss(context, flowLS, from, to, signed);
            }

            // We going to do pipe size changes here for any connectable.
            const ga = context.drawing.calculationParams.gravitationalAcceleration;

            const oFrom = from;
            const oTo = to;
            const oFlowLS = flowLS;

            // automatically figure out pipe size change cost and add it to any other custom
            // object specific friction loss calculations.
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

            const fromo = this.objectStore.get(from.connection);
            const too = this.objectStore.get(to.connection);
            if (!fromo || fromo.type !== EntityType.PIPE || !too || too.type !== EntityType.PIPE) {
                return 0;
            }

            const sizes = [from, to].map((n) => {
                const o = context.objectStore.get(n.connection);
                if (o && o.type === EntityType.PIPE) {
                    const p = o as Pipe;
                    if (p.entity.calculation) {
                        return p.entity.calculation.realInternalDiameterMM;
                    }
                }
            });

            if (sizes[0] === undefined || sizes[1] === undefined) {
                throw new Error('pipe size undefined ' +
                    this.entity.uid + ' ' + JSON.stringify(from) + ' ' + JSON.stringify(to));
            }

            const largeSize = Math.max(sizes[0]!, sizes[1]!);
            const smallSize = Math.min(sizes[0]!, sizes[1]!);

            const volLM = smallSize ** 2 * Math.PI / 4 / 1000;
            const velocityMS = flowLS / volLM;

            const angle = Math.abs(angleDiffRad(this.getAngleOfRad(from.connection), this.getAngleOfRad(to.connection)));

            const k = 0.8 * (Math.sin(angle / 2)) * (1 - (smallSize ** 2 / largeSize ** 2));

            return sign * (k * velocityMS ** 2 / (2 * ga)) +
                // @ts-ignore
                super.getFrictionHeadLoss(context, oFlowLS, oFrom, oTo, signed);
        }

        connect(uid: string) {
            super.connect(uid);
            this.entity.connections.push(uid);
        }

        disconnect(uid: string) {
            super.disconnect(uid);
            const ix = this.entity.connections.indexOf(uid);
            if (ix === -1) {
                throw new Error('disconnecting non existent connection');
            }
            this.entity.connections.splice(ix, 1);
        }
    });
}
