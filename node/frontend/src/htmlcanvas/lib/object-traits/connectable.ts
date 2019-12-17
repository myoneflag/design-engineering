import {Coord} from '../../../../src/store/document/types';
import BackedDrawableObject from '../../../../src/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '../../../../src/htmlcanvas/lib/base-backed-object';
import Pipe from '../../../../src/htmlcanvas/objects/pipe';
import assert from 'assert';
import {EntityType} from '../../../../src/store/document/entities/types';
import * as _ from 'lodash';
import BackedConnectable from '../../../../src/htmlcanvas/lib/BackedConnectable';
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete, EdgeLikeEntity
} from '../../../../src/store/document/entities/concrete-entity';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {DrawingContext} from '../../../../src/htmlcanvas/lib/types';
import Flatten from '@flatten-js/core';
import {PIPE_HEIGHT_GRAPHIC_EPS_MM} from '../../../../src/config';
import {CalculationContext} from '../../../../src/calculations/types';
import {FlowNode} from '../../../../src/calculations/calculation-engine';
import {angleDiffRad} from '../../../../src/lib/utils';
import {DrawingArgs} from '../../../../src/htmlcanvas/lib/drawable-object';
import {CalculationData} from '../../../../src/store/document/calculations/calculation-field';
import * as TM from "transformation-matrix";
import PipeEntity from "../../../store/document/entities/pipe-entity";
import {determineConnectableSystemUid} from "../../../store/document/entities/directed-valves/directed-valve-entity";
import FittingEntity from "../../../store/document/entities/fitting-entity";
import {getEdgeLikeHeightM, getSystemNodeHeightM} from "../utils";

export default interface Connectable {
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]>;
    getAngleDiffs(): number[];
    getSortedAngles(): number[];
    prepareDelete(context: CanvasContext): BaseBackedObject[];
    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[];
    isStraight(tolerance: number): boolean;
    getAngleOfRad(connection: string): number;

    connect(uid: string): void;
    disconnect(uid: string): void;

    drawInternal(context: DrawingContext, args: DrawingArgs): void;

    getCalculationTower(context: CalculationContext): Array<[FittingEntity, PipeEntity] | [FittingEntity]>;
    getCalculationNode(context: CalculationContext, connectionUid: string): ConnectableEntityConcrete;
    getCalculationConnectionGroups(connections?: string[]): EdgeLikeEntity[][];
}

const EPS = 1e-5;

const MAX_PIPE_GROUP_SEPARATION_MM = 5;

export function ConnectableObject<T extends new (...args: any[])
    => Connectable & BackedConnectable<ConnectableEntityConcrete>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return (class extends constructor implements Connectable {

        drawInternal(context: DrawingContext, args: DrawingArgs): void {
            const {active, selected} = args;
            super.drawInternal(context, args);

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
                            const maxWidthWorld = Math.max(
                                (this.objectStore.get(r.uid) as Pipe).lastDrawnWidth,
                                (this.objectStore.get(huid) as Pipe).lastDrawnWidth,
                            );
                            const maxWidth = this.toObjectLength(maxWidthWorld) + 2;

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
            this.objectStore.getConnections(this.entity.uid).forEach((uid) => {
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
                    if (pipeObject.worldEndpoints(this.uid).length > 1) {
                        throw new Error('pipe object we are connected to doesn\'t connect to us: \n' +
                            JSON.stringify(pipeObject.entity.endpointUid) + ' ' + pipeObject.uid + '\n' +
                            JSON.stringify(this.objectStore.getConnections(this.entity.uid)) + ' \n' +
                            JSON.stringify(this.objectStore.get(this.uid)!.entity),
                        );
                    }

                    if (other) {
                        result.push([other, pipeObject]);
                    }
                }
            });
            return result;
        }

        getAngleDiffs(): number[] {
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

        getSortedAngles(): number[] {
            const ret = [];
            const radials = this.getRadials();
            const angles = radials
                .map((r) => this.toObjectCoord(r[0]))
                .map((r) => (Math.atan2(r.y, r.x) + 2 * Math.PI) % (2 * Math.PI));
            angles.sort();
            return angles;
        }


        locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
            const ans = super.locateCalculationBoxWorld(context, data, scale);
            if (ans && ans.length > 0) {
                return ans;
            }

            // Put a candidate position in each gap, starting from largest to smallest.
            const angles = this.getSortedAngles();
            let candidates: Array<[number, number]> = [];

            if (this.objectStore.getConnections(this.entity.uid).length >= 2) {
                for (let i = 0; i < angles.length; i++) {
                    const a = angles[i];
                    const b = angles[(i + 1) % angles.length];
                    const diff = (b - a + Math.PI * 2) % (Math.PI * 2);
                    candidates.push([a + diff / 2, diff]);
                }
                candidates.sort((a, b) => - (a[1] - b[1]));
                candidates.push(
                    [candidates[0][0] + Math.PI / 4, -1],
                    [candidates[0][0] - Math.PI / 4, -1],
                    [candidates[0][0] + Math.PI / 2, -1],
                    [candidates[0][0] - Math.PI / 2, -1],
                    [candidates[0][0] + Math.PI * 3 / 4, -1],
                    [candidates[0][0] - Math.PI * 3 / 4, -1],
                );
            } else if (this.objectStore.getConnections(this.entity.uid).length === 1) {
                candidates = [
                    [angles[0] + Math.PI, -1],
                    [angles[0] + Math.PI + Math.PI / 4, -1],
                    [angles[0] + Math.PI - Math.PI / 4, -1],
                    [angles[0] + Math.PI + Math.PI / 2, -1],
                    [angles[0] + Math.PI - Math.PI / 2, -1],
                    [angles[0] + Math.PI + Math.PI * 3 / 4, -1],
                    [angles[0] + Math.PI - Math.PI * 3 / 4, -1],
                ];
            } else {
                for (let i = 0; i < 8; i++) {
                    candidates.push([Math.PI * i / 4, -1]);
                }
            }

            const wc = this.toWorldCoord();

            return candidates.map(([dir, gapAngle]) => {
                return TM.transform(
                    TM.identity(),
                    TM.translate(wc.x, wc.y),
                    TM.rotate(dir + Math.PI / 2),
                    TM.scale(scale),
                    TM.translate(0, - 80),
                    TM.rotate(- dir - Math.PI / 2),
                );
            });
        }


        isStraight(tolerance: number = EPS): boolean {
            const angles = this.getAngleDiffs();
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
            _.clone(this.objectStore.getConnections(this.entity.uid)).forEach((c) => {
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
            pipeSizes?: [number, number],
        ): number {
            if (this.entity.type === EntityType.SYSTEM_NODE) {
                // @ts-ignore
                return super.getFrictionHeadLoss(context, flowLS, from, to, signed);
            }

            // We going to do pipe size changes here for any connectable.
            const ga = context.drawing.metadata.calculationParams.gravitationalAcceleration;

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

            const sizes = pipeSizes || [from, to].map((n) => {
                const o = context.globalStore.get(n.connection);
                if (o && o.type === EntityType.PIPE) {
                    const p = o as Pipe;
                    const calculation = context.globalStore.getCalculation(p.entity);
                    if (calculation) {
                        return calculation.realInternalDiameterMM;
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

            const angle = Math.abs(angleDiffRad(
                this.getAngleOfRad(from.connection),
                this.getAngleOfRad(to.connection),
            ));

            const k = 0.8 * (Math.sin(angle / 2)) * (1 - (smallSize ** 2 / largeSize ** 2));

            if (Math.abs(flowLS) < EPS) {
                // @ts-ignore
                return super.getFrictionHeadLoss(context, oFlowLS, oFrom, oTo, signed);
            }
            return sign * (k * velocityMS ** 2 / (2 * ga)) +
                // @ts-ignore
                super.getFrictionHeadLoss(context, oFlowLS, oFrom, oTo, signed);
        }

        connect(uid: string) {
            super.connect(uid);
        }

        disconnect(uid: string) {
            super.disconnect(uid);
        }

        getCalculationConnectionGroups(connections?: string[]): EdgeLikeEntity[][] {
            if (!connections) {
                connections = this.objectStore.getConnections(this.uid);
            }
            const pipes = connections
                .map((puid) => this.objectStore.get(puid) as Pipe)
                .sort((a, b) => a.entity.heightAboveFloorM - b.entity.heightAboveFloorM);


            const res: PipeEntity[][] = [];
            let group: PipeEntity[] = [];
            pipes.forEach((p) => {
                if (group.length == 0 ||
                    p.entity.heightAboveFloorM <= group[0].heightAboveFloorM + MAX_PIPE_GROUP_SEPARATION_MM) {
                    group.push(p.entity);
                } else {
                    res.push(group);
                    group = [p.entity];
                }
            });

            if (group.length) {
                res.push(group);
            }

            return res;
        }

        getCalculationNode(context: CalculationContext, connectionUid: string): ConnectableEntityConcrete {
            const groups = this.getCalculationConnectionGroups();
            const index = groups.findIndex((l) => l.find((pe) => pe.uid === connectionUid));
            if (index === -1) {
                throw new Error('Requesting calculation node from a non neighbour');
            }

            return this.getCalculationTower(context)[index][0];
        }

        /**
         *         etc...
         *           |
         * ---------uid.2-------puid-uid-- (btw pipes are done in pipe entities, not here)
         *           |
         *         uid.1.p
         *           |
         * ---------uid.1-------puid-uid--
         *           |
         *         uid.0.p
         *           |
         *         uid.0--------puid-uid--
         */
        getCalculationTower(context: CalculationContext): Array<[FittingEntity, PipeEntity] | [FittingEntity]> {
            const groups = this.getCalculationConnectionGroups();

            if (groups.length === 0) {
                return [];
            }

            const result: Array<[FittingEntity, PipeEntity] | [FittingEntity]> = [];
            let systemUid = determineConnectableSystemUid(this.objectStore, this.entity)!;

            let lastGroup: EdgeLikeEntity[] | undefined;

            let i = 0;
            groups.forEach((g) => {
                const minHeight = getEdgeLikeHeightM(g[0], context);
                const maxHeight = getEdgeLikeHeightM(g[g.length - 1], context);

                const ce: FittingEntity = {
                    center: this.entity.center,
                    color: null,
                    parentUid: this.entity.parentUid,
                    calculationHeightM: (minHeight + maxHeight) / 2,
                    systemUid,
                    type: EntityType.FITTING,
                    uid: this.uid + '.' + i,
                };

                if (lastGroup) {
                    const pe: PipeEntity = {
                        color: null,
                        diameterMM: null,
                        endpointUid: [this.uid + '.' + i, this.uid + '.' + (i - 1)],
                        heightAboveFloorM: 0,
                        lengthM: null,
                        material: null,
                        maximumVelocityMS: null,
                        parentUid: null,
                        systemUid,
                        type: EntityType.PIPE,
                        uid: "",
                    };
                    result.push([ce, pe]);
                } else {
                    result.push([ce]);
                }
                lastGroup = g;

                i++;
            });

            return result;
        }
    });
}
