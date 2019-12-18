import BaseBackedObject from '../../../../src/htmlcanvas/lib/base-backed-object';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {EntityType} from '../../../../src/store/document/entities/types';
import {getConnectedFlowComponent} from '../../../../src/htmlcanvas/lib/black-magic/utils';
import UnionFind from '../../../../src/calculations/union-find';
import {ConnectableEntityConcrete, DrawableEntityConcrete} from '../../../../src/store/document/entities/concrete-entity';
import {fillFixtureFields} from '../../../../src/store/document/entities/fixtures/fixture-entity';
import {maxHeightOfConnection, minHeightOfConnection} from '../../../../src/htmlcanvas/lib/utils';
import Flatten from '@flatten-js/core';
import {InteractionType} from '../../../../src/htmlcanvas/lib/interaction';
import {addValveAndSplitPipe} from '../../../../src/htmlcanvas/lib/black-magic/split-pipe';
import Pipe from '../../../../src/htmlcanvas/objects/pipe';
import PipeEntity from '../../../../src/store/document/entities/pipe-entity';
import uuid from 'uuid';
import FittingEntity from '../../../../src/store/document/entities/fitting-entity';
import {FlowConfiguration} from '../../../../src/store/document/entities/tmv/tmv-entity';
import {isConnectable} from '../../../../src/store/document';
import assert from 'assert';
import {StandardFlowSystemUids, StandardMaterialUids} from '../../../../src/store/catalog';
import {MainEventBus} from '../../../../src/store/main-event-bus';
import {Coord, EntityParam} from '../../../../src/store/document/types';
import {rebaseAll} from '../../../../src/htmlcanvas/lib/black-magic/rebase-all';
import {fillDirectedValveFields} from '../../../../src/store/document/entities/directed-valves/directed-valve-entity';
import connectTmvToSource from '../../../../src/htmlcanvas/lib/black-magic/connect-tmv-to-source';
import Tmv from '../../../../src/htmlcanvas/objects/tmv/tmv';
import {assertUnreachable} from "../../../../src/config";
import * as _ from 'lodash';

const CEILING_HEIGHT_THRESHOLD_BELOW_PIPE_HEIGHT_MM = 500;
const FIXTURE_WALL_DIST_MM = 200;
const FIXTURE_WALL_DIST_COLD_MM = 100;
const TMV_WALL_DIST_MM = 50;
const WALL_INSERT_JOIN_THRESHOLD_MM = 150;

const WALL_SAME_ANGLE_THRESHOLD_DEG = 5;
const WALL_SAME_DIST_THRESHOLD_MM = 900;
const WALL_SNAP_DIST_THRESHOLD_MM = 900;

const VALVE_CONNECT_HANDICAP_MM = 30;
export const PIPE_STUB_MAX_LENGTH_MM = 300;
const MIN_PIPE_LEN_MM = 100;

// Note: there are some aggressive caches that help improve performance. The caches will only be
// correct if the following invariants are maintained:
// 1. For height caching, the height of objects only change when adding pipes (because the connectable
//      endpoints will have the new pipe's height to consider).
// 2. For entity-entity distance caching, the distance is either the same, or goes from a number to
//      null as entities becomes disqualified as auto-connect progresses and suffocates available
//      connections. Ie, the only change in distance over time should be from a valid distance to
//      null.
// 3. Group distance cache: When joining two groups, distances between other groups are not affected.
export class AutoConnector {
    selected: BaseBackedObject[];
    allowedUids: Set<string> = new Set<string>();
    context: CanvasContext;
    unionFind: UnionFind<string> = new UnionFind<string>();
    gridLines: GridLine[] = [];
    walls: Wall[] = [];

    shapeCache = new Map<string, Flatten.Shape>();

    constructor(selected: BaseBackedObject[], context: CanvasContext) {
        if (selected === undefined || selected === null) {
            throw new Error('invalid argument for selected');
        }
        this.selected = selected;
        this.context = context;
        this.processWalls();
    }

    getOrSetShape(obj: BaseBackedObject) {
        if (!this.shapeCache.has(obj.uid)) {
            this.shapeCache.set(obj.uid, obj.shape()!);
        }
        return this.shapeCache.get(obj.uid)!;
    }

    processInitialConnections() {
        this.unionFind = new UnionFind<string>();
        this.selected.forEach((o) => {
            this.allowedUids.add(o.uid);
            switch (o.entity.type) {
                case EntityType.PIPE:
                    this.allowedUids.add(o.entity.endpointUid[0]);
                    this.allowedUids.add(o.entity.endpointUid[1]);
                    this.unionFind.join(o.entity.endpointUid[0], o.uid);
                    this.unionFind.join(o.entity.endpointUid[1], o.uid);
                    break;
                case EntityType.FIXTURE:
                case EntityType.TMV: {
                    const subs: string[] = [];
                    switch (o.entity.type) {
                        case EntityType.TMV:
                            subs.push(o.entity.warmOutputUid);
                            if (o.entity.coldOutputUid) {
                                subs.push(o.entity.coldOutputUid);
                            }
                            break;
                        case EntityType.FIXTURE:
                            subs.push(o.entity.coldRoughInUid);
                            if (o.entity.warmRoughInUid) {
                                subs.push(o.entity.warmRoughInUid);
                            }
                            break;
                    }

                    subs.forEach((suid) => {
                        this.unionFind.join(suid, suid);
                        getConnectedFlowComponent(suid, this.context.objectStore).forEach((c) => {
                            this.allowedUids.add(c.uid);
                            this.unionFind.join(suid, c.uid);
                        });
                    });
                    break;
                }
                case EntityType.RISER:
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                    this.unionFind.join(o.uid, o.uid);
                    break;
                case EntityType.BACKGROUND_IMAGE:
                    break;
                case EntityType.SYSTEM_NODE:
                    throw new Error('invalid object selected');
                default:
                    assertUnreachable(o.entity);
            }
        });
    }

    processWalls() {
        this.selected.forEach((o) => {
            if (o.entity.type === EntityType.FIXTURE || o.entity.type === EntityType.TMV) {
                const c = o.toWorldCoord({x: 0, y: 0});
                const p = Flatten.point(c.x, c.y);

                const norm = Flatten
                    .vector([0, 1])
                    .rotate(o.toWorldAngleDeg(0) / 180 * Math.PI);
                this.walls.push({
                    line: Flatten.line(
                        p.translate(norm.normalize().multiply(FIXTURE_WALL_DIST_MM)),
                        norm,
                    ),
                    source: p,
                });

                this.gridLines.push({
                    source: Flatten.point(c.x, c.y).translate(norm.normalize().multiply(TMV_WALL_DIST_MM)),
                    lines: [norm, norm.rotate90CW()],
                });
            }
        });
    }

    entityHeightCache = new Map<string, [number, number]>();
    getEntityHeight(entity: DrawableEntityConcrete): [number, number] {
        if (this.entityHeightCache.has(entity.uid)) {
            return this.entityHeightCache.get(entity.uid)!;
        }

        const fun = (): [number, number] => {
            switch (entity.type) {
                case EntityType.PIPE:
                    return [entity.heightAboveFloorM, entity.heightAboveFloorM];
                case EntityType.RISER:
                    return [-Infinity, Infinity];
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.SYSTEM_NODE:
                    let maxh = maxHeightOfConnection(entity, this.context);
                    let minh = minHeightOfConnection(entity, this.context);
                    maxh = maxh === null ? -Infinity : maxh;
                    minh = minh === null ? Infinity : minh;

                    return [minh, maxh];
                case EntityType.TMV:
                    return [entity.heightAboveFloorM, entity.heightAboveFloorM];
                case EntityType.FIXTURE:
                    const fixture = fillFixtureFields(this.context.document.drawing, this.context.effectiveCatalog, entity);
                    return [fixture.outletAboveFloorM!, fixture.outletAboveFloorM!];
                case EntityType.BACKGROUND_IMAGE:
                    throw new Error('entity has no height');
            }
            assertUnreachable(entity);
        };

        this.entityHeightCache.set(entity.uid, fun.bind(this)());
        return this.entityHeightCache.get(entity.uid)!;
    }

    isRoofHeight(entity: DrawableEntityConcrete): boolean {
        return this.getEntityHeight(entity)[1] > this.context.document.drawing.metadata.calculationParams.ceilingPipeHeightM -
            CEILING_HEIGHT_THRESHOLD_BELOW_PIPE_HEIGHT_MM / 1000;
    }

    isWallHeight(entity: DrawableEntityConcrete): boolean {
        const [min, max] = this.getEntityHeight(entity);
        return min <= this.context.document.drawing.metadata.calculationParams.ceilingPipeHeightM +
            CEILING_HEIGHT_THRESHOLD_BELOW_PIPE_HEIGHT_MM / 1000; // && max >= 0; // leave that out 4 now
    }

    joinEntitiesCache = new Map<string, number | null>();

    calls = 0;
    joinEntities(a: string, b: string, doit: boolean = true, cutoff?: number): number | null {
        const key = a < b ? a + b : b + a;
        this.calls ++;
        if (!doit && this.joinEntitiesCache.has(key)) {
            return this.joinEntitiesCache.get(key)!;
        }

        if (cutoff !== undefined) {
            // we avoid unnecessary calculations by ignoring all entities that can't possibly be closer
            // than cutoff - euclidean distance.
            const as = this.getOrSetShape(this.context.objectStore.get(a)!);
            const bs = this.getOrSetShape(this.context.objectStore.get(b)!);
            if (as.distanceTo(bs)[0] > cutoff) {
                return Infinity;
            }
        }

        const run = () => {

            // types of things to join:
            // system nodes from fixtures
            // system nodes from TMVs
            // pipes and stuff

            // rules:
            // Anything at roof height must travel through the roof
            // Pipes at wall height can travel via wall and through roof after a bring up
            // nodes at wall height can lead straight into pipes.
            // Otherwise, nodes at wall height must lead into wall, then it behaves like a pipe.
            //  => lead smaller for TMVs which are already in the wall
            //  => lead larger for fixtures which are protruding from the wall
            let ao = this.context.objectStore.get(a)!;
            let bo = this.context.objectStore.get(b)!;
            if (!ao) {
                throw new Error('Object is missing: ' + a);
            }
            if (!bo) {
                throw new Error('Object is missing: ' + b);
            }
            let ae = ao.entity;
            let be = bo.entity;

            // Must be same system
            const sa = this.getEntitySystem(ao.entity);
            const sb = this.getEntitySystem(bo.entity);
            if (sa !== null && sb !== null && sa !== sb) {
                return null;
            }
            if (sa === null && sb === null) {
                throw new Error('connecting objects with unspecified system uid');
            }
            const systemUid = (sa || sb) as string;
            if ([ao, bo].filter((o) => o.offerInteraction({
                type: InteractionType.EXTEND_NETWORK,
                systemUid,
                worldRadius: 0,
                worldCoord: {x: 0, y: 0},
                configuration: FlowConfiguration.BOTH,
            })).length !== 2) {
                return null; // one of them can't handle it.
            }


            let totLen = 0;
            let solved = false;

            // Preparation. System nodes need to extend into the wall.
            [[ao, bo], [bo, ao]].forEach(([me, them]) => {
                if (solved) {
                    return;
                }
                if (me.entity.type === EntityType.SYSTEM_NODE) {
                    let vec: Flatten.Vector;
                    if (me.entity.parentUid === null) {
                        throw new Error('System node has no parent');
                    }
                    const po = this.context.objectStore.get(me.entity.parentUid)!;
                    let heightM: number;
                    switch (po.entity.type) {
                        case EntityType.TMV:
                        case EntityType.FIXTURE:
                            vec = Flatten.vector([0, -1]).rotate(po.toWorldAngleDeg(0) / 180 * Math.PI);
                            if (po.entity.type === EntityType.FIXTURE) {
                                const fe =
                                    fillFixtureFields(
                                        this.context.document.drawing,
                                        this.context.effectiveCatalog,
                                        po.entity,
                                    );
                                if (me.entity.systemUid === StandardFlowSystemUids.ColdWater) {
                                    vec = vec.multiply(FIXTURE_WALL_DIST_COLD_MM);
                                } else {
                                    vec = vec.multiply(FIXTURE_WALL_DIST_MM);
                                }
                                heightM = fe.outletAboveFloorM!;
                            } else {
                                vec = vec.multiply(TMV_WALL_DIST_MM);
                                heightM = po.entity.heightAboveFloorM;
                            }
                            break;
                        case EntityType.BACKGROUND_IMAGE:
                        case EntityType.FITTING:
                        case EntityType.DIRECTED_VALVE:
                        case EntityType.PIPE:
                        case EntityType.RISER:
                        case EntityType.SYSTEM_NODE:
                            throw new Error('Can\'t do it');
                        default:
                            assertUnreachable(po.entity);
                            throw new Error('Can\'t do it');
                    }
                    const center = me.toWorldCoord({x: 0, y: 0});
                    const mntPt = Flatten.point(center.x, center.y).translate(vec);

                    // if the mount point is very close to the other bloke, then just connect it straight away.
                    if (them.entity.type !== EntityType.SYSTEM_NODE) {
                        const d = this.getOrSetShape(them).distanceTo(mntPt);
                        if (d[0] < WALL_INSERT_JOIN_THRESHOLD_MM) {
                            totLen += d[1].distanceTo(this.getOrSetShape(me))[0];
                            if (doit) {

                                let v = them.entity as ConnectableEntityConcrete;
                                if (them.entity.type === EntityType.PIPE) {
                                    const {created, deleted, focus} = addValveAndSplitPipe(
                                        this.context,
                                        them as Pipe,
                                        center,
                                        systemUid,
                                        10,
                                    );
                                    v = focus as ConnectableEntityConcrete;
                                    this.selected = this.selected.filter((s) => !deleted.includes(s.uid));
                                    // this.selected.push(...created);
                                }

                                this.connectConnectablesWithPipe(
                                    v as ConnectableEntityConcrete,
                                    me.entity,
                                    heightM,
                                    systemUid,
                                );
                            }
                            solved = true;
                        }
                    }

                    if (!solved) {
                        // extend
                        const v: FittingEntity = {
                            center: {x: mntPt.x, y: mntPt.y},
                            color: null,
                            parentUid: null,
                            systemUid,
                            calculationHeightM: null,
                            type: EntityType.FITTING,
                            uid: uuid(),
                        };

                        if (doit) {
                            this.context.$store.dispatch('document/addEntity', v);
                            this.connectConnectablesWithPipe(v, me.entity, heightM, systemUid);
                        }

                        if (ae.uid === me.uid) {
                            ae = v;
                            if (doit) {
                                ao = this.context.objectStore.get(v.uid)!;
                            }
                        } else {
                            be = v;
                            if (doit) {
                                bo = this.context.objectStore.get(v.uid)!;
                            }
                        }

                        totLen += mntPt.distanceTo(Flatten.point(center.x, center.y))[0];
                    }
                }
            });


            let bias = 0;
            if (isConnectable(ao.type)) {
                bias -= VALVE_CONNECT_HANDICAP_MM;
            }
            if (isConnectable(bo.type)) {
                bias -= VALVE_CONNECT_HANDICAP_MM;
            }
            totLen += bias;

            if (solved) {
                return totLen;
            }

            // Now, connect the remaining.
            let wallDist: number | null = null;
            if (this.isWallHeight(bo.entity) && this.isWallHeight(ao.entity)) {
                // we have the option to go through the wall.
                const dist = this.connectThroughWalls(ao, bo, systemUid, false);
                if (dist !== null) {
                    wallDist = dist;
                }
            }

            const roofDist = this.connectThroughRoof(ao, bo, systemUid, false);

            if (roofDist === null && wallDist === null) {
                return null;
            } else if (wallDist === null || roofDist! < wallDist) {
                return totLen + this.connectThroughRoof(ao, bo, systemUid, doit)!;
            } else {

                return totLen + this.connectThroughWalls(ao, bo, systemUid, doit)!;
            }
        };

        const res = run.bind(this)();
        this.joinEntitiesCache.set(key, res);
        return res;
    }



    connectThroughRoof(ao: BaseBackedObject, bo: BaseBackedObject, systemUid: string, doit: boolean): number | null {
        // OK now try the option of connecting it through the roof
        let maxHeight = Math.max(this.getEntityHeight(ao.entity)[1], this.getEntityHeight(bo.entity)[1]);
        maxHeight = Math.max(maxHeight, this.context.document.drawing.metadata.calculationParams.ceilingPipeHeightM);

        const straight = this.getOrSetShape(ao).distanceTo(this.getOrSetShape(bo));

        if (doit) {
            if (ao.type === EntityType.PIPE) {
                ao = this.context.objectStore.get(addValveAndSplitPipe(
                    this.context,
                    ao as Pipe,
                    straight[1].end,
                    (ao as Pipe).entity.systemUid,
                    10,
                ).focus!.uid)!;
            }

            if (bo.type === EntityType.PIPE) {
                bo = this.context.objectStore.get(addValveAndSplitPipe(
                    this.context,
                    bo as Pipe,
                    straight[1].start,
                    (bo as Pipe).entity.systemUid,
                    10,
                ).focus!.uid)!;
            }
        }

        const auxLength =
            (maxHeight - this.getEntityHeight(ao.entity)[1] +
            maxHeight - this.getEntityHeight(bo.entity)[1]) * 1000;
        // Find grid
        const ga = this.findClosestGrid(straight[1].start);
        const gb = this.findClosestGrid(straight[1].end);
        const ac = straight[1].start;
        const ap = Flatten.point(ac.x, ac.y);
        const bc = straight[1].end;
        const bp = Flatten.point(bc.x, bc.y);

        let bestDist = Infinity;
        let bestCorner!: Flatten.Point;

        ga.lines.forEach((al) => {
            gb.lines.forEach((bl) => {
                const ix = Flatten.line(ap, al).intersect(Flatten.line(bp, bl));
                if (ix.length === 0) {
                    return;
                }

                const dist = ix[0].distanceTo(ap)[0] + ix[0].distanceTo(bp)[0];
                if (dist < bestDist) {
                    bestDist = dist;
                    bestCorner = ix[0];
                }
            });
        });

        if (bestCorner) {
            if (doit) {
                if (Math.min(bestCorner.distanceTo(ap)[0], bestCorner.distanceTo(bp)[0]) < MIN_PIPE_LEN_MM) {

                    // connect directly
                    this.connectConnectablesWithPipe(
                        ao.entity as ConnectableEntityConcrete,
                        bo.entity as ConnectableEntityConcrete,
                        maxHeight,
                        systemUid,
                    );
                } else {
                    const v: FittingEntity = {
                        center: {x: bestCorner.x, y: bestCorner.y},
                        color: null,
                        parentUid: null,
                        systemUid,
                        calculationHeightM: null,
                        type: EntityType.FITTING,
                        uid: uuid(),
                    };

                    this.context.$store.dispatch('document/addEntity', v);
                    this.connectConnectablesWithPipe(v, ao.entity as ConnectableEntityConcrete, maxHeight, systemUid);
                    this.connectConnectablesWithPipe(v, bo.entity as ConnectableEntityConcrete, maxHeight, systemUid);

                }

            }
            return bestDist + auxLength;
        } else {
            return null;
        }
    }

    findClosestGrid(coord: Coord): GridLine {
        let closeDist = Infinity;
        let closeGrid: GridLine = {
            source: Flatten.point(0, 0),
            lines: [Flatten.vector(0, 1), Flatten.vector(1, 0)],
        };
        this.gridLines.forEach((g) => {
            const dist = g.source.distanceTo(Flatten.point(coord.x, coord.y));
            if (dist[0] < closeDist) {
                closeDist = dist[0];
                closeGrid = g;
            }
        });
        return closeGrid;
    }

    findBestWall(o: BaseBackedObject): Wall | null {
        // find best wall
        let bestWallDist = Infinity;
        let bestWall: Wall | null = null;

        const oshape = this.getOrSetShape(o);

        this.walls.forEach((w) => {
            const wallD = w.line.distanceTo(oshape!);
            if (wallD[0] <= WALL_SNAP_DIST_THRESHOLD_MM ) {
                const sourceD = w.source.distanceTo(oshape!);
                if (sourceD[0] < bestWallDist) {
                    bestWallDist = sourceD[0];
                    bestWall = w;
                }
            }
        });

        return bestWall;
    }

    diffA(a: number, b: number) {
        return Math.min((a - b + 360) % 360, (- a + b + 360 * 2) % 360);
    }

    connectThroughWalls(ao: BaseBackedObject, bo: BaseBackedObject, systemUid: string, doit: boolean): number | null {
        // Do not DFS, this will lead to strange results. Only use wall if it might meet at a
        // corner.
        const wa = this.findBestWall(ao);
        const wb = this.findBestWall(bo);
        if (!wa || !wb) {
            return null;
        }

        // We want the highest pipe height that doesn't compromize
        const maxLow =
            Math.max(this.getEntityHeight(ao.entity)[0], this.getEntityHeight(bo.entity)[0]);
        const minHigh =
            Math.min(this.getEntityHeight(ao.entity)[1], this.getEntityHeight(bo.entity)[1]);
        const newHeight = Math.max(maxLow, minHigh);
        const auxLength = (Math.max(0, newHeight - minHigh) +
            Math.abs(newHeight - this.context.document.drawing.metadata.calculationParams.ceilingPipeHeightM)) * 1000;

        const adeg = wa.line.norm.angleTo(wb.line.norm) / Math.PI * 180 ;
        const adiff = Math.min(this.diffA(adeg, 180), this.diffA(adeg, 0));


        if (adiff < WALL_SAME_ANGLE_THRESHOLD_DEG) {
            // within 5 degrees? consider that the same angle.
            if (wa.source.distanceTo(wb.line)[0] < WALL_SAME_DIST_THRESHOLD_MM) {
                // they snapped to the same wall. Just join directly.
                const path = this.getOrSetShape(ao).distanceTo(this.getOrSetShape(bo));
                if (doit) {
                    if (ao.type === EntityType.PIPE) {
                        ao = this.context.objectStore.get(addValveAndSplitPipe(
                            this.context,
                            ao as Pipe,
                            path[1].end,
                            (ao as Pipe).entity.systemUid,
                            10,
                        ).focus!.uid)!;
                    }

                    if (bo.type === EntityType.PIPE) {
                        bo = this.context.objectStore.get(addValveAndSplitPipe(
                            this.context,
                            bo as Pipe,
                            path[1].start,
                            (bo as Pipe).entity.systemUid,
                            10,
                        ).focus!.uid)!;
                    }

                    assert(isConnectable(ao.type));
                    assert(isConnectable(bo.type));

                    this.connectConnectablesWithPipe(
                        ao.entity as ConnectableEntityConcrete,
                        bo.entity as ConnectableEntityConcrete,
                        newHeight,
                        systemUid,
                    );
                }

                // Pipe length + length to connect other fitting to pipe + length to connect to ceiling.
                return path[0] + auxLength;
            } else {
                // on parallel walls that are too far. We have to go to roof. We don't have enough
                // information to figure out how to pipe it through other walls.
                return null;
            }
        } else {
            // Reachable.
            const corner = wa.line.intersect(wb.line)[0];
            if (corner === undefined) {
                throw new Error('Walls should have intersected, but they didnt. adiff: ' + adiff);
            }
            const pd = corner.distanceTo(this.getOrSetShape(ao))[0] + corner.distanceTo(this.getOrSetShape(bo))[0];
            if (doit) {
                if (ao.type === EntityType.PIPE) {
                    ao = this.context.objectStore.get(addValveAndSplitPipe(
                        this.context,
                        ao as Pipe,
                        corner,
                        (ao as Pipe).entity.systemUid,
                        10,
                    ).focus!.uid)!;
                }

                if (bo.type === EntityType.PIPE) {
                    bo = this.context.objectStore.get(addValveAndSplitPipe(
                        this.context,
                        bo as Pipe,
                        corner,
                        (bo as Pipe).entity.systemUid,
                        10,
                    ).focus!.uid)!;
                }

                assert(isConnectable(ao.entity.type));
                assert(isConnectable(ao.entity.type));

                const ac = ao.toWorldCoord({x: 0, y: 0});
                const ap = Flatten.point(ac.x, ac.y);
                const aline = Flatten.line(ap, wa.line.norm);
                const bc = bo.toWorldCoord({x: 0, y: 0});
                const bp = Flatten.point(bc.x, bc.y);
                const bline = Flatten.line(bp, wb.line.norm);

                const realCorner = aline.intersect(bline)[0];

                const v: FittingEntity = {
                    center: {x: realCorner.x, y: realCorner.y},
                    color: null,
                    parentUid: null,
                    systemUid,
                    calculationHeightM: null,
                    type: EntityType.FITTING,
                    uid: uuid(),
                };

                this.context.$store.dispatch('document/addEntity', v);

                this.connectConnectablesWithPipe(v, ao.entity as ConnectableEntityConcrete, newHeight, systemUid);
                this.connectConnectablesWithPipe(v, bo.entity as ConnectableEntityConcrete, newHeight, systemUid);
            }

            return (pd + auxLength);
        }
    }

    joinGroups(a: string[], b: string[], doit: boolean = true, cutoff?: number): number | null {
        let bestDist: number | null = null;
        let bestPair: [string, string] | null = null;
        a.forEach((auid) => {
            b.forEach((buid) => {
                const res = this.joinEntities(auid, buid, false, cutoff);
                if (res !== null) {
                    if (bestDist === null || res < bestDist) {
                        bestDist = res;
                        bestPair = [auid, buid];
                    }
                }
            });
        });

        if (doit && bestDist !== null) {
            const res = this.joinEntities(bestPair![0], bestPair![1], true);
            return res;
        } else {
            return bestDist;
        }
    }

    getEntitySystem(entity: DrawableEntityConcrete): string | null {
        switch (entity.type) {
            case EntityType.FITTING:
            case EntityType.PIPE:
            case EntityType.RISER:
            case EntityType.SYSTEM_NODE:
                return entity.systemUid;
            case EntityType.DIRECTED_VALVE:
                const res = fillDirectedValveFields(this.context.document, this.context.objectStore, entity);
                return res.systemUidOption;
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.TMV:
            case EntityType.FIXTURE:
                return null;
        }
    }

    groupDistCache = new Map<string, number | null>();
    groupDist(a: string[], b: string[], cutoff: number | undefined): number | null {
        const key = this.unionFind.find(a[0]) + this.unionFind.find(b[0]);
        if (!this.groupDistCache.has(key)) {
            this.groupDistCache.set(key, this.joinGroups(a, b, false, cutoff));
        }

        return this.groupDistCache.get(key)!;
    }

    findCheapestJoin(groups: string[][]): [number, number] | null {
        console.log(JSON.stringify(groups.map((g) => g.length)));
        let currDist: number | null = null;
        let bestAns: [number, number] = [-1, -1];
        for (let a = 0; a < groups.length; a++) {
            for (let b = a + 1; b < groups.length; b++) {
                const dist = this.groupDist(groups[a], groups[b], currDist === null ? undefined : currDist);
                if (dist !== null) {
                    if (currDist === null || dist < currDist) {
                        currDist = dist;
                        bestAns = [a, b];
                    }
                }
            }
        }

        if (currDist === null) {
            return null;
        }
        return bestAns;
    }


    onDeleteEntity = ({entity, levelUid}: EntityParam) => {
        if (entity.type === EntityType.PIPE) {
            this.entityHeightCache.delete(entity.endpointUid[0]);
            this.entityHeightCache.delete(entity.endpointUid[1]);
        }
        this.selected.splice(0, this.selected.length, ...this.selected.filter((o) => o.entity !== undefined));
        // tslint:disable-next-line:semicolon
    };

    onAddEntity = ({entity, levelUid}: EntityParam) => {
        if (this.context.document.uiState.levelUid === levelUid) {
            this.selected.push(this.context.objectStore.get(entity.uid)!);
        }
        if (entity.type === EntityType.PIPE) {
            this.entityHeightCache.delete(entity.endpointUid[0]);
            this.entityHeightCache.delete(entity.endpointUid[1]);
        }
        // tslint:disable-next-line:semicolon
    };

    rig() {
        MainEventBus.$on('delete-entity', this.onDeleteEntity);
        MainEventBus.$on('add-entity', this.onAddEntity);
    }

    teardown() {
        MainEventBus.$off('delete-entity', this.onDeleteEntity);
        MainEventBus.$off('add-entity', this.onAddEntity);
    }

    connectAllTmvs() {
        this.selected.forEach((o) => {
            if (o.type === EntityType.TMV) {
                connectTmvToSource(this.context, o as Tmv);
            }
        });
    }

    autoConnect() {
        this.rig();
        this.calls = 0;

        try {
            // firstly
            this.connectAllTmvs();

            let iters = 0;
            while (true) {
                iters++;
                this.processInitialConnections();
                const groups = this.unionFind.groups();
                const res = this.findCheapestJoin(groups);
                console.log(this.calls);
                if (!res) {
                    break;
                }

                const toBustA = this.unionFind.find(groups[res[0]][0]);
                const toBustB = this.unionFind.find(groups[res[1]][1]);
                this.joinGroups(groups[res[0]], groups[res[1]], true);
                Array.from(this.groupDistCache.keys()).forEach((k) => {
                    if (k.includes(toBustA) || k.includes(toBustB)) {
                        this.groupDistCache.delete(k);
                    }
                });

                // end loggin
                console.log(' ' + this.calls);

                // TODO: something faster. Like just inserting objects directly into the layer or something.
                // this.context.processDocument(false);

                console.log('  ' + this.calls);
            }

            rebaseAll(this.context);
            this.context.$store.dispatch('document/commit');
        } finally {
            this.teardown();
        }

        console.log(this.calls);
    }

    connectConnectablesWithPipe(
        a: ConnectableEntityConcrete,
        b: ConnectableEntityConcrete,
        height: number,
        systemUid: string,
    ) {
        const p: PipeEntity = {
            color: null,
            diameterMM: null,
            endpointUid: [a.uid, b.uid],
            heightAboveFloorM: height,
            lengthM: null,
            material: StandardMaterialUids.Pex,
            maximumVelocityMS: null,
            parentUid: null,
            systemUid,
            type: EntityType.PIPE,
            uid: uuid(),
        };

        this.context.$store.dispatch('document/addEntity', p);
    }
}

export interface GridLine {
    source: Flatten.Point;
    lines: [Flatten.Vector, Flatten.Vector];
}

export interface Wall {
    source: Flatten.Point;
    line: Flatten.Line;
}

class GroupDistCache {
    // Parallel array, 2-way mapping. Remember to maintain that.
    cache = new Map<string, Map<string, number>>();

    addGroup(gid: string, dists: Map<string, number>) {
        dists.forEach((v, k) => {
            this.getOrSet(gid).set(k, v);
            this.getOrSet(k).set(gid, v);
        });
    }

    join(auid: string, buid: string, nuid: string) {
        if (nuid !== auid && nuid !== buid) {
            throw new Error('new uid must be one of the old ones when simulating a union join');
        }
        const newMap = _.clone(this.getOrSet(auid));
        this.getOrSet(buid).forEach((v, k) => {
            if (newMap.has(k)) {
                newMap.set(k, Math.min(newMap.get(k)!, v));
            } else {
                newMap.set(k, v);
            }
        });
        newMap.delete(auid);
        newMap.delete(buid);
        this.delete(auid);
        this.delete(buid);
        this.addGroup(nuid, newMap);
    }

    get(auid: string, buid: string) {
        const v1 = this.cache.get(auid)!.get(buid);
        const v2 = this.cache.get(buid)!.get(auid);
        if (v1 !== v2) {
            throw new Error('cache is inconsistent');
        }
        return v1;
    }

    private getOrSet(key: string) {
        if (!this.cache.has(key)) {
            this.cache.set(key, new Map<string, number>());
        }
        return this.cache.get(key)!;
    }

    private delete(key: string) {
        this.getOrSet(key).forEach((v, k) => {
            this.cache.get(k)!.delete(key);
        });
        this.cache.delete(key);
    }
}
