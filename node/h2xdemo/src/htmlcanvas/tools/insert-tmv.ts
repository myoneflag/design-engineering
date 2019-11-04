import {ConnectableEntity, Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import TmvEntity, {FlowConfiguration, SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';
import {InteractionType} from '@/htmlcanvas/lib/interaction';
import Pipe from '@/htmlcanvas/objects/pipe';
import Flatten from '@flatten-js/core';
import PipeEntity from '@/store/document/entities/pipe-entity';
import {StandardFlowSystemUids} from '@/store/catalog';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
import SystemNode from '@/htmlcanvas/objects/tmv/system-node';
import {addValveAndSplitPipe} from '@/htmlcanvas/lib/black-magic/split-pipe';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {isConnectable} from '@/store/document';
import ValveEntity from '@/store/document/entities/valve-entity';
import {KeyCode} from '@/htmlcanvas/utils';

export default function insertTmv(
    context: CanvasContext,
    tmvhasCold: boolean,
    angle: number,
) {
    const tmvUid = uuid();
    const coldUid = uuid();
    const hotUid = uuid();
    const warmUid = uuid();
    const coldOutUid = uuid();

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
            if (interrupted) {
                context.$store.dispatch('document/revert');
            }
            if (!displaced) {
                MainEventBus.$emit('set-tool-handler', null);
                if (!interrupted) {
                    // stamp
                    insertTmv(context, tmvhasCold, angle);
                }
            }
        },
        (wc: Coord) => {
            context.$store.dispatch('document/revert', false);

            const doc = context.document as DocumentState;

            // Maybe we drew onto a background
            const [parentUid, oc] = getInsertCoordsAt(context, wc);

            const newTmv: TmvEntity = {
                coldRoughInUid: coldUid,
                hotRoughInUid: hotUid,
                warmOutputUid: warmUid,
                coldOutputUid: tmvhasCold ? coldOutUid : null,

                maxFlowRateLS: null,
                maxHotColdPressureDifferentialPCT: null,
                maxInletPressureKPA: null,
                minFlowRateLS: null,
                minInletPressureKPA: null,
                pipeDistanceMM: 150,
                rotation: angle,
                valveLengthMM: 50,

                type: EntityType.TMV,
                center: oc,
                heightAboveFloorM: 1,
                parentUid,
                outputTemperatureC: 50,
                uid: tmvUid,
                calculation: null,
            };

            const newCold: SystemNodeEntity = {
                center: {x: newTmv.pipeDistanceMM / 2, y: 0},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.ColdWater,
                uid: coldUid,
                configuration: FlowConfiguration.INPUT,
            };

            const newHot: SystemNodeEntity = {
                center: {x: -newTmv.pipeDistanceMM / 2, y: 0},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.HotWater,
                uid: hotUid,
                configuration: FlowConfiguration.INPUT,
            };

            const newWarm: SystemNodeEntity = {
                center: {x: 0, y: newTmv.valveLengthMM},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.WarmWater,
                uid: warmUid,
                configuration: FlowConfiguration.OUTPUT,
            };

            const newColdOut: SystemNodeEntity = {
                center: {x: -newTmv.pipeDistanceMM / 4, y: newTmv.valveLengthMM},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.ColdWater,
                uid: coldOutUid,
                configuration: FlowConfiguration.OUTPUT,
            };
            const interactive = getClosestJoinable(context, StandardFlowSystemUids.ColdWater, wc, 3000);

            [newTmv, newCold, newHot, newWarm].forEach((e) => {
                context.$store.dispatch('document/addEntity', e);
            });

            if (tmvhasCold) {
                context.$store.dispatch('document/addEntity', newColdOut);
            }

            let tmvObj: Tmv | undefined;
            let coldObj: SystemNode | undefined;
            let hotObj: SystemNode | undefined;
            let coldDrawn = false;


            if (interactive) {
                coldDrawn = true;
                const target = interactive[0];
                const targetObj = context.objectStore.get(target.uid)!;
                // rotate our pipe and try again with correct position of cold water
                tmvObj = context.objectStore.get(newTmv.uid) as Tmv;

                const closePoint = targetObj.shape()!.distanceTo(Flatten.point(wc.x, wc.y))[1].ps;
                const currA = tmvObj.toWorldAngle(0);
                const desiredA = -Flatten.vector(
                    Flatten.point(wc.x, wc.y)
                    , closePoint,
                ).angleTo(
                    Flatten.vector(0, -1),
                ) / Math.PI * 180;

                newTmv.rotation = ((desiredA - currA) % 360 + 360) % 360;

                // maybe refresh is unnecessary?
                tmvObj.refreshObject(newTmv);
                coldObj = context.objectStore.get(newCold.uid) as SystemNode;
                const coldLoc = coldObj.toWorldCoord({x: 0, y: 0});

                leadPipe(
                    context,
                    coldLoc,
                    newCold,
                    StandardFlowSystemUids.ColdWater,
                    target.uid,
                );

            }

            // do closest hot pipe
            if (coldDrawn) {
                const interactiveC = getClosestJoinable(context, StandardFlowSystemUids.HotWater, wc, 3000);
                if (interactiveC && interactiveC.length) {
                    const pipeE = interactiveC[0];

                    hotObj = DrawableObjectFactory.build(
                        context.hydraulicsLayer,
                        newHot,
                        context.objectStore,
                        false,
                    ) as SystemNode;

                    const hotWc = hotObj.toWorldCoord({x: 0, y: 0});

                    leadPipe(
                        context,
                        hotWc,
                        newHot,
                        StandardFlowSystemUids.HotWater,
                    );
                }
            }

            context.processDocument();
        },
        (wc: Coord) => {
            context.$store.dispatch('document/commit');
        },
        'Insert TMV',
        [
            [KeyCode.SHIFT, {name: '+ Precise Rotating', fn: (event: KeyboardEvent) => { /* */ }}],
            [KeyCode.RIGHT, {name: 'Rotate Clockwise', fn: (event: KeyboardEvent, onRefresh: () => void) => {
                    if (event.shiftKey || event.ctrlKey) {
                        angle += 1;
                    } else {
                        angle += 45;
                    }
                    onRefresh();
                }}],
            [KeyCode.LEFT, {name: 'Rotate Counter-clockwise', fn: (event: KeyboardEvent, onRefresh: () => void) => {
                    if (event.shiftKey || event.ctrlKey) {
                        angle -= 1;
                    } else {
                        angle -= 45;
                    }
                    onRefresh();
                }}],
        ],
    ));
}

function leadPipe(
    context: CanvasContext,
    wc: Coord,
    connectTo: ConnectableEntity,
    systemUid: string,
    pipeSpec?: string,
    radius: number = Infinity,
): PipeEntity | null {

    let pipe: Pipe;
    let valve: ConnectableEntityConcrete;
    if (pipeSpec !== undefined) {
        const obj = context.objectStore.get(pipeSpec)!;
        if (obj.entity.type === EntityType.PIPE) {
            valve = addValveAndSplitPipe(context, obj as Pipe, wc, systemUid, 30).focus as ValveEntity;
        } else if (isConnectable(obj.type)) {
            valve = obj.entity as ConnectableEntityConcrete;
        } else {
            throw new Error('not supported to lead from');
        }
    } else {
        const interactive = getClosestJoinable(context, systemUid, wc, radius);
        if (interactive) {
            if (interactive[0].type === EntityType.PIPE) {
                const pipeE = interactive[0];
                pipe = context.objectStore.get(pipeE.uid) as Pipe;
                valve = addValveAndSplitPipe(context, pipe, wc, systemUid, 30).focus as ValveEntity;

            } else if (isConnectable(interactive[0].type)) {
                valve = interactive[0] as ConnectableEntityConcrete;
            } else {
                throw new Error('not supported');
            }

        } else {
            return null;
        }
    }

    // Draw de cold peep
    const newPipe: PipeEntity = {
        color: null,
        diameterMM: null,
        endpointUid: [valve.uid, connectTo.uid],
        heightAboveFloorM: 1,
        lengthM: null,
        material: null,
        maximumVelocityMS: null,
        parentUid: null,
        systemUid,
        type: EntityType.PIPE,
        uid: uuid(),
        calculation: null,
    };

    valve.connections.push(newPipe.uid);
    connectTo.connections.push(newPipe.uid);

    context.$store.dispatch('document/addEntity', newPipe);
    return newPipe;

}

function getClosestJoinable(
    context: CanvasContext,
    systemUid: string,
    wc: Coord, radius: number,
): Array<PipeEntity | ConnectableEntityConcrete> | null {
    return context.offerInteraction(
        {
            type: InteractionType.EXTEND_NETWORK,
            systemUid,
            worldCoord: wc,
            worldRadius: radius, // 1 M radius
            configuration: FlowConfiguration.OUTPUT,
        },
        undefined,
        (object: DrawableEntity[]) => {
            const obj = context.objectStore.get(object[0].uid);
            if (!obj) {
                return -Infinity;
            }
            if (!obj.shape()) {
                return -Infinity;
            }

            return -obj!.shape()!.distanceTo(Flatten.point(wc.x, wc.y))[0];
        },
    ) as Array<PipeEntity | ConnectableEntityConcrete>;
}
