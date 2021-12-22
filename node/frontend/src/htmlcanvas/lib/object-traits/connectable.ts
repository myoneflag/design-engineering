import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";
import Pipe from "../../../../src/htmlcanvas/objects/pipe";
import assert from "assert";
import {EntityType} from "../../../../../common/src/api/document/entities/types";
import {BaseBackedConnectable} from "../../../../src/htmlcanvas/lib/BackedConnectable";
import {
    ConnectableEntityConcrete,
    EdgeLikeEntity
} from "../../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import {DrawingContext, ValidationResult} from "../../../../src/htmlcanvas/lib/types";
import Flatten from "@flatten-js/core";
import {PIPE_HEIGHT_GRAPHIC_EPS_MM} from "../../../../src/config";
import {CalculationContext, PressurePushMode} from "../../../../src/calculations/types";
import {FlowNode} from "../../../../src/calculations/calculation-engine";
import {angleDiffRad} from "../../../../src/lib/trigonometry";
import {EntityDrawingArgs} from "../../../../src/htmlcanvas/lib/drawable-object";
import {CalculationData} from "../../../../src/store/document/calculations/calculation-field";
import * as TM from "transformation-matrix";
import PipeEntity from "../../../../../common/src/api/document/entities/pipe-entity";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import {getEdgeLikeHeightAboveGroundM} from "../utils";
import Cached from "../cached";
import stringify from "json-stable-stringify";
import uuid from "uuid";
import Fitting from "../../objects/fitting";
import {Coord, Coord3D} from "../../../../../common/src/api/document/drawing";
import {determineConnectableNetwork, determineConnectableSystemUid} from "../../../store/document/entities/lib";
import {assertUnreachable, ComponentPressureLossMethod} from "../../../../../common/src/api/config";

export default interface Connectable {
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]>;
    getAngleDiffs(): number[];
    getSortedAngles(): number[];
    prepareDelete(context: CanvasContext): BaseBackedObject[];
    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[];
    isStraight(tolerance: number): boolean;
    getAngleOfRad(connection: string): number;
    get3DOffset(connection: string): Coord3D;

    connect(uid: string): void;
    disconnect(uid: string): void;

    drawEntity(context: DrawingContext, args: EntityDrawingArgs): void;

    getCalculationTower(context: CalculationContext): Array<[FittingEntity, PipeEntity] | [FittingEntity]>;
    getCalculationNode(context: CalculationContext, connectionUid: string): ConnectableEntityConcrete;
    getCalculationConnectionGroups(context: CalculationContext): EdgeLikeEntity[][];

    getCalculationConnections(): string[];
}

const EPS = 1e-5;

const MAX_PIPE_GROUP_SEPARATION_M = 0.05;

let hlcounts = 0;

export interface ConnectableObjectOptions {
    customCopyObjects?: boolean;
}

export function ConnectableObject(opts?: ConnectableObjectOptions) {

    if (!opts) {
        opts = {
            customCopyObjects: false,
        };
    }

    return <T extends new (...args: any[]) => Connectable & BaseBackedConnectable>(constructor: T) => {
        // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
        class Generated extends constructor implements Connectable {
            drawEntity(context: DrawingContext, args: EntityDrawingArgs): void {
                const { selected } = args;
                super.drawEntity(context, args);

                const e = this.entity;
                switch (e.type) {
                    case EntityType.RISER:
                        // don't do this for risers lol horseshoe
                        if (!this.entity.uid.startsWith("4075e")) {
                            // lucky 1 in a million
                            return;
                        } else {
                            break;
                        }
                    case EntityType.FITTING:
                    case EntityType.SYSTEM_NODE:
                    case EntityType.LOAD_NODE:
                    case EntityType.FLOW_SOURCE:
                    case EntityType.DIRECTED_VALVE:
                        break;
                    default:
                        assertUnreachable(e);
                }
                const { ctx } = context;

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
                        throw new Error("don't know how to handle non-pipe objects");
                    }
                });

                const highPipes = new Set<string>();

                radials.forEach(([a, r]) => {
                    if (r.entity.type === EntityType.PIPE) {
                        if (r.entity.heightAboveFloorM + PIPE_HEIGHT_GRAPHIC_EPS_MM / 1000 >= highest) {
                            highPipes.add(r.entity.uid);
                        }
                    } else {
                        throw new Error("don't know how to handle non-pipe objects");
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
                                    (this.globalStore.get(r.uid) as Pipe).lastDrawnWidth,
                                    (this.globalStore.get(huid) as Pipe).lastDrawnWidth
                                );
                                const maxWidth = this.toObjectLength(maxWidthWorld) + 2;

                                const mya = radialAngles[ix][0];

                                const adiff = ((a - mya + 4 * Math.PI - EPS) % (2 * Math.PI)) + EPS;
                                const v1 = Flatten.vector([1, 0])
                                    .rotate(mya)
                                    .normalize()
                                    .multiply(maxWidth * (3 - adiff / (Math.PI * 0.95)));
                                const v1perp = v1
                                    .rotate90CCW()
                                    .normalize()
                                    .multiply(maxWidth);
                                const v2 = Flatten.vector([1, 0])
                                    .rotate(a)
                                    .normalize()
                                    .multiply(maxWidth * (3 - adiff / (Math.PI * 0.95)));
                                const v2perp = v2
                                    .rotate90CW()
                                    .normalize()
                                    .multiply(maxWidth);

                                const l1s = Flatten.point()
                                    .translate(v1)
                                    .translate(v1perp);
                                const l1e = Flatten.point().translate(v1perp);
                                const l2s = Flatten.point()
                                    .translate(v2)
                                    .translate(v2perp);
                                const l2e = Flatten.point().translate(v2perp);

                                ctx.lineWidth = maxWidth / 2;
                                ctx.strokeStyle = "#000";
                                if (adiff > Math.PI - EPS) {
                                    // round
                                    ctx.beginPath();
                                    ctx.moveTo(l1s.x, l1s.y);
                                    ctx.lineTo(l1e.x, l1e.y);
                                    ctx.stroke();
                                    ctx.beginPath();
                                    if (adiff > Math.PI + EPS) {
                                        ctx.arc(0, 0, maxWidth, a - Math.PI / 2, mya + Math.PI / 2, true);
                                    }
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

            @Cached(
                (kek) =>
                    new Set(
                        [kek]
                            .map((n) => [n, n.getParentChain(), n.getNeighbours()])
                            .flat(2)
                            .map((n) => [n, n.getParentChain(), n.getNeighbours()])
                            .flat(2)
                            .map((n) => n.getParentChain())
                            .flat()
                            .map((o) => o.uid)
                    ),
                (exclude) => exclude
            )
            getRadials(exclude: string | null = null): Array<[Coord3D, BaseBackedObject]> {
                const result: Array<[Coord3D, BaseBackedObject]> = [];
                this.globalStore.getConnections(this.entity.uid).forEach((uid) => {
                    if (uid === exclude) {
                        return;
                    }

                    const connected = this.globalStore.get(uid) as BaseBackedObject;

                    if (connected === undefined) {
                        throw new Error("connectable not found: " + uid + " of " + JSON.stringify(this.entity));
                    }

                    if (connected.entity.type === EntityType.PIPE) {
                        const pipeObject = connected as Pipe;
                        const [other] = pipeObject.worldEndpoints(this.uid);
                        if (pipeObject.worldEndpoints(this.uid).length > 1) {
                            throw new Error(
                                "pipe object we are connected to doesn't connect to us: \n" +
                                JSON.stringify(pipeObject.entity.endpointUid) +
                                " " +
                                pipeObject.uid +
                                "\n" +
                                JSON.stringify(this.globalStore.getConnections(this.entity.uid)) +
                                " \n" +
                                JSON.stringify(this.globalStore.get(this.uid)!.entity)
                            );
                        }

                        if (other) {
                            result.push([other, pipeObject]);
                        }
                    }
                });
                return result;
            }

            validate(context: CanvasContext, tryToFix: boolean): ValidationResult {
                const pres = super.validate(context, tryToFix);
                if (pres && !pres.success) {
                    return pres;
                }

                const conns = context.globalStore.getConnections(this.uid);

                if (this.maximumConnections !== null && conns.length > this.maximumConnections) {
                    if (tryToFix) {
                        // Try to fix by deleting a neighbouring pipe.
                        const victim = conns[0];
                        const level = context.document.drawing.levels[context.globalStore.levelOfEntity.get(victim)!].name;
                        const type = context.globalStore.get(victim)!.type;

                        context.deleteEntity(context.globalStore.get(victim)!);

                        return {
                            success: false,
                            message: "Too many connections coming out of a " + this.type + ', deleted ' + type +
                                '(' + victim + ") on level " + level + " to try to fix. Please review",
                            modified: true,
                        };
                    } else {
                        return {
                            success: false,
                            message: "Too many connections coming out of a " + this.type,
                            modified: false,
                        };
                    }
                }

                if (this.minimumConnections !== null && conns.length < this.minimumConnections) {
                    return {
                        success: false,
                        message: "Too few connections coming out of a " + this.type,
                        modified: false,
                    };
                }

                return {
                    success: true
                };
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
                    ret.push(((diff * 180) / Math.PI + 360) % 360);
                }
                let sum = 0;
                ret.forEach((n) => (sum += n));
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

                if (this.globalStore.getConnections(this.entity.uid).length >= 2) {
                    for (let i = 0; i < angles.length; i++) {
                        const a = angles[i];
                        const b = angles[(i + 1) % angles.length];
                        const diff = (b - a + Math.PI * 2) % (Math.PI * 2);
                        candidates.push([a + diff / 2, diff]);
                    }
                    candidates.sort((a, b) => -(a[1] - b[1]));
                    candidates.push(
                        [candidates[0][0] + Math.PI / 4, -1],
                        [candidates[0][0] - Math.PI / 4, -1],
                        [candidates[0][0] + Math.PI / 2, -1],
                        [candidates[0][0] - Math.PI / 2, -1],
                        [candidates[0][0] + (Math.PI * 3) / 4, -1],
                        [candidates[0][0] - (Math.PI * 3) / 4, -1]
                    );
                } else if (this.globalStore.getConnections(this.entity.uid).length === 1) {
                    candidates = [
                        [angles[0] + Math.PI, -1],
                        [angles[0] + Math.PI + Math.PI / 4, -1],
                        [angles[0] + Math.PI - Math.PI / 4, -1],
                        [angles[0] + Math.PI + Math.PI / 2, -1],
                        [angles[0] + Math.PI - Math.PI / 2, -1],
                        [angles[0] + Math.PI + (Math.PI * 3) / 4, -1],
                        [angles[0] + Math.PI - (Math.PI * 3) / 4, -1]
                    ];
                } else {
                    for (let i = 0; i < 8; i++) {
                        candidates.push([(Math.PI * i) / 4, -1]);
                    }
                }

                const wc = this.toWorldCoord();

                return candidates.map(([dir, gapAngle]) => {
                    return TM.transform(
                        TM.identity(),
                        TM.translate(wc.x, wc.y),
                        TM.rotate(dir + Math.PI / 2),
                        TM.scale(scale),
                        TM.translate(0, -80),
                        TM.rotate(-dir - Math.PI / 2)
                    );
                });
            }

            isStraight(toleranceDEG: number = EPS): boolean {
                const angles = this.getAngleDiffs();
                if (angles.length !== 2) {
                    return false;
                }
                return Math.abs(angles[0] - 180) <= toleranceDEG;
            }

            prepareDelete(context: CanvasContext): BaseBackedObject[] {
                const pres = super.prepareDelete(context);
                if (pres.length) {
                    return pres;
                }

                this.debase(context);
                // Delete all connected pipes.
                // make that work.
                // If we are not a pipe,
                const isStraight = this.isStraight(1);

                if (isStraight) {
                    let onePipe!: PipeEntity;
                    // If we were straight, restore the pipe first
                    const ends = this.globalStore
                        .getConnections(this.entity.uid)
                        .slice()
                        .map((cuid) => {
                            const c = this.globalStore.get(cuid) as Pipe;
                            onePipe = c.entity;
                            const other =
                                c.entity.endpointUid[0] === this.uid ? c.entity.endpointUid[1] : c.entity.endpointUid[0];

                            return other;
                        });

                    const newPipe: PipeEntity = {
                        ...onePipe,
                        uid: uuid(),
                        endpointUid: [ends[0], ends[1]]
                    };

                    context.$store.dispatch("document/addEntity", newPipe);
                }

                if (this.entity.type === EntityType.FITTING || isStraight) {
                    const result: BaseBackedObject[] = [];
                    this.globalStore
                        .getConnections(this.entity.uid)
                        .slice()
                        .forEach((c) => {
                            const o = this.globalStore.get(c);
                            if (o instanceof Pipe) {
                                result.push(...o.prepareDelete(context));
                            } else {
                                throw new Error("Non existent connection on valve " + JSON.stringify(this.entity));
                            }
                        });

                    const superResult = super.prepareDelete(context);
                    result.push(...superResult);
                    result.push(this);

                    return result;
                } else {
                    // we are an irregular connetable. Instead of deleting, turn into a fitting instead.
                    const conns = this.globalStore.getConnections(this.uid);
                    if (conns.length === 0) {
                        // just an hero
                        return [this];
                    } else {
                        // turn into a fitting.
                        const fitting: FittingEntity = {
                            calculationHeightM: null,
                            center: this.entity.center,
                            color: null,
                            parentUid: this.entity.parentUid,
                            systemUid: determineConnectableSystemUid(this.globalStore, this.entity)!,
                            type: EntityType.FITTING,
                            uid: uuid()
                        };
                        context.$store.dispatch("document/addEntity", fitting);

                        for (const uid of conns.slice()) {
                            const p = this.globalStore.get(uid) as Pipe;
                            if (p.entity.endpointUid[0] === this.uid) {
                                p.entity.endpointUid[0] = fitting.uid;
                            } else {
                                p.entity.endpointUid[1] = fitting.uid;
                            }
                        }
                        (this.globalStore.get(fitting.uid) as Fitting).debase(context);
                        (this.globalStore.get(fitting.uid) as Fitting).rebase(context);

                        return [this];
                    }
                }
            }
            /*
            @Cached(
                (kek) => new Set(
                    [kek]
                        .map((n) => [n, n.getParentChain(), n.getNeighbours()])
                        .flat(2)
                        .map((n) => [n, n.getParentChain(), n.getNeighbours()])
                        .flat(2)
                        .map((n) => n.getParentChain())
                        .flat()
                        .map((o) => o.uid),
                ),
                (exclude) => exclude,
            )*/
            getAngleOfRad(connection: string): number {
                if (!this.getRadials().find((a) => a[1].uid === connection)) {
                    throw new Error(
                        new Error(
                            "connection not in radials " + connection + " \n" + "" + JSON.stringify(this.getRadials())
                        ) +
                        "\n" +
                        "" +
                        JSON.stringify(this.entity)
                    );
                }
                const c = this.toObjectCoord(this.getRadials().find((a) => a[1].uid === connection)![0]);
                return Math.atan2(c.y, c.x);
            }

            get3DOffset(connection: string): Coord3D {
                if (!this.getRadials().find((a) => a[1].uid === connection)) {
                    throw new Error(
                        new Error(
                            "connection not in radials " + connection + " \n" + "" + JSON.stringify(this.getRadials())
                        ) +
                        "\n" +
                        "" +
                        JSON.stringify(this.entity)
                    );
                }
                const c = this.getRadials().find((a) => a[1].uid === connection)!;
                if (this.entity.calculationHeightM === null) {
                    return { ...this.toObjectCoord(c[0]), z: 0 };
                } else {
                    return { ...this.toObjectCoord(c[0]), z: this.entity.calculationHeightM * 1000 - c[0].z };
                }
            }

            // @Cached(
            //     (kek) =>
            //         new Set(
            //             [kek]
            //                 .map((n) => [n, n.getParentChain(), n.getNeighbours()])
            //                 .flat(2)
            //                 .map((n) => [n, n.getParentChain(), n.getNeighbours()])
            //                 .flat(2)
            //                 .map((n) => n.getParentChain())
            //                 .flat()
            //                 .map((o) => o.uid)
            //         ),
            //     (context, flowLS, from, to, signed, mode, pipeSizes) =>
            //         flowLS + from.connectable + to.connectable + signed + mode + stringify(pipeSizes)
            // )
            getFrictionHeadLoss(
                context: CalculationContext,
                flowLS: number,
                from: FlowNode,
                to: FlowNode,
                signed: boolean,
                pressureKPA: number | null,
                pressurePushMode: PressurePushMode,
                pipeSizes?: [number, number]
            ): number | null {
                hlcounts++;

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

                // @ts-ignore
                let componentHL = super.getFrictionHeadLoss(context, oFlowLS, oFrom, oTo, signed, pressureKPA);

                if (this.entity.type === EntityType.SYSTEM_NODE) {
                    // @ts-ignore
                    return componentHL;
                }

                switch (context.drawing.metadata.calculationParams.componentPressureLossMethod) {
                    case ComponentPressureLossMethod.INDIVIDUALLY:
                        // Find pressure loss from pipe size changes
                        break;
                    case ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE:
                        return componentHL;
                    default:
                        assertUnreachable(context.drawing.metadata.calculationParams.componentPressureLossMethod);
                }

                const fromo = this.globalStore.get(from.connection);
                const too = this.globalStore.get(to.connection);
                if (!fromo || fromo.type !== EntityType.PIPE || !too || too.type !== EntityType.PIPE) {
                    return 0;
                }

                return componentHL;
            }

            connect(uid: string) {
                super.connect(uid);
            }

            disconnect(uid: string) {
                super.disconnect(uid);
            }

            getCalculationConnectionGroups(context: CalculationContext): EdgeLikeEntity[][] {
                const edgeLikes = this.getCalculationConnections()
                    .map((puid) => this.globalStore.get(puid)!.entity as EdgeLikeEntity)
                    .sort((a, b) => getEdgeLikeHeightAboveGroundM(a, context) - getEdgeLikeHeightAboveGroundM(b, context));

                const res: EdgeLikeEntity[][] = [];
                let group: EdgeLikeEntity[] = [];
                edgeLikes.forEach((entity) => {
                    if (
                        group.length === 0 ||
                        getEdgeLikeHeightAboveGroundM(entity, context) <=
                        getEdgeLikeHeightAboveGroundM(group[0], context) + MAX_PIPE_GROUP_SEPARATION_M
                    ) {
                        group.push(entity);
                    } else {
                        res.push(group);
                        group = [entity];
                    }
                });

                if (group.length) {
                    res.push(group);
                }

                return res;
            }

            getCalculationNode(context: CalculationContext, connectionUid: string): ConnectableEntityConcrete {
                const groups = this.getCalculationConnectionGroups(context);
                const index = groups.findIndex((l) => l.find((pe) => pe.uid === connectionUid));
                if (index === -1) {
                    throw new Error(
                        "Requesting calculation node from a non neighbour. I am " +
                        JSON.stringify(this.entity) +
                        "\n " +
                        "connections: " +
                        JSON.stringify(this.globalStore.getConnections(this.uid)) +
                        "" +
                        "arg: " +
                        connectionUid
                    );
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
            getCalculationTower(context: CalculationContext, forRiser = false): Array<[FittingEntity, PipeEntity] | [FittingEntity]> {
                const groups = this.getCalculationConnectionGroups(context);

                if (groups.length === 0) {
                    return [];
                }

                const result: Array<[FittingEntity, PipeEntity] | [FittingEntity]> = [];
                const mySystemUid = determineConnectableSystemUid(this.globalStore, this.entity)!;

                let lastGroup: EdgeLikeEntity[] | undefined;

                const spawnedPipeNetwork = determineConnectableNetwork(context.globalStore, this.entity);

                let i = 0;
                groups.forEach((g) => {
                    const minHeight = getEdgeLikeHeightAboveGroundM(g[0], context, forRiser);
                    const maxHeight = getEdgeLikeHeightAboveGroundM(g[g.length - 1], context, forRiser);

                    let systemUid = mySystemUid;
                    if (g[0].type === EntityType.PIPE) {
                        systemUid = g[0].systemUid;
                    }

                    const ce: FittingEntity = {
                        center: this.entity.center,
                        color: null,
                        parentUid: this.entity.parentUid,
                        calculationHeightM: (minHeight + maxHeight) / 2,
                        systemUid,
                        type: EntityType.FITTING,
                        uid: this.uid + "." + i
                    };

                    if (lastGroup) {
                        const pe: PipeEntity = {
                            color: null,
                            diameterMM: null,
                            endpointUid: [this.uid + "." + i, this.uid + "." + (i - 1)],
                            heightAboveFloorM: 0,
                            lengthM: null,
                            material: null,
                            maximumVelocityMS: null,
                            parentUid: null,
                            systemUid,
                            network: spawnedPipeNetwork!,
                            type: EntityType.PIPE,
                            uid: this.uid + "." + i + ".p",
                            gradePCT: null,
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

            getCalculationConnections(): string[] {
                return [...this.globalStore.getConnections(this.uid), ...super.getCalculationConnections()];
            }

            getNeighbours(): BaseBackedObject[] {
                const conn = this.globalStore.getConnections(this.uid);
                return [...conn.map((uid) => this.globalStore.get(uid)!), ...super.getNeighbours()];
            }

            // Don't copy neighbours in our case - just copy the single component.
            getCopiedObjects(): BaseBackedObject[] {
                if (opts!.customCopyObjects) {
                    return super.getCopiedObjects();
                } else {
                    return [this];
                }
            }

            @Cached((kek) => new Set(kek.getParentChain().map((o) => o.uid)))
            shape() {
                const point = this.toWorldCoord({ x: 0, y: 0 });
                return Flatten.circle(Flatten.point(point.x, point.y), 30);
            }
        }

        return Generated;
    };
}
