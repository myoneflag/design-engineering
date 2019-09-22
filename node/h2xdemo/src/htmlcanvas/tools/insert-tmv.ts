import {ConnectableEntity, Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import TmvEntity, {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';
import {InteractionType} from '@/htmlcanvas/lib/interaction';
import Pipe from '@/htmlcanvas/objects/pipe';
import Flatten from '@flatten-js/core';
import {BaseBackedObject} from '@/htmlcanvas/lib/backed-drawable-object';
import PipeEntity from '@/store/document/entities/pipe-entity';
import {StandardFlowSystemUids} from '@/store/catalog';
import {addValveAndSplitPipe} from '@/htmlcanvas/tools/insert-valve';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
import SystemNode from '@/htmlcanvas/objects/tmv/system-node';

export default function insertTmv(
    context: CanvasContext,
) {
    context.$store.dispatch('document/commit').then(() => {
        const tmvUid = uuid();
        const coldUid = uuid();
        const hotUid = uuid();
        const warmUid = uuid();

        const coldPipeUid = uuid();

        const hotPipeUid = uuid();

        let splitColdPipe: Pipe | null = null;
        let splitHotPipe: Pipe | null = null;

        MainEventBus.$emit('set-tool-handler', new PointTool(
            (interrupted) => {
                if (interrupted) {
                    context.$store.dispatch('document/revert');
                }
                MainEventBus.$emit('set-tool-handler', null);
            },
            (wc: Coord) => {
                context.lockDrawing();
                context.$store.dispatch('document/revert').then(() => {
                    try {


                        const doc = context.document as DocumentState;

                        // Maybe we drew onto a background
                        const [parentUid, oc] = getInsertCoordsAt(context, wc);

                        const newTmv: TmvEntity = {
                            coldRoughInUid: coldUid,
                            hotRoughInUid: hotUid,
                            outputUid: warmUid,

                            maxFlowRateLS: null,
                            maxHotColdPressureDifferentialPCT: null,
                            maxInletPressureKPA: null,
                            minFlowRateLS: null,
                            minInletPressureKPA: null,
                            pipeDistanceMM: 150,
                            rotation: 0,
                            valveLengthMM: 400,

                            type: EntityType.TMV,
                            center: oc,
                            heightAboveFloorM: 70,
                            parentUid,
                            outputTemperatureC: 50,
                            uid: tmvUid,
                        };

                        const newCold: SystemNodeEntity = {
                            center: {x: newTmv.pipeDistanceMM / 2, y: 0},
                            connections: [],
                            parentUid: tmvUid,
                            type: EntityType.SYSTEM_NODE,
                            systemUid: StandardFlowSystemUids.ColdWater,
                            uid: coldUid,
                        };

                        const newHot: SystemNodeEntity = {
                            center: {x: -newTmv.pipeDistanceMM / 2, y: 0},
                            connections: [],
                            parentUid: tmvUid,
                            type: EntityType.SYSTEM_NODE,
                            systemUid: StandardFlowSystemUids.HotWater,
                            uid: hotUid,
                        };

                        const newWarm: SystemNodeEntity = {
                            center: {x: 0, y: newTmv.valveLengthMM},
                            connections: [],
                            parentUid: tmvUid,
                            type: EntityType.SYSTEM_NODE,
                            systemUid: StandardFlowSystemUids.WarmWater,
                            uid: warmUid,
                        };

                        doc.drawing.entities.push(newTmv, newCold, newHot, newWarm);


                        let tmvObj: Tmv | undefined;
                        let coldObj: SystemNode | undefined;
                        let hotObj: SystemNode | undefined;
                        try {
                            // connect to existing cold pipe

                            interactClosestPipe(context, StandardFlowSystemUids.ColdWater, wc, 3000);
                            if (context.interactive) {
                                    splitColdPipe = context.interactive as Pipe;
                                    // rotate our pipe and try again with correct position of cold water
                                    tmvObj = DrawableObjectFactory.build(
                                        newTmv,
                                        context.document.drawing.backgrounds.find((b) => b.uid === parentUid) || null,
                                        context.objectStore,
                                        false,
                                    ) as Tmv;


                                    const closePoint = splitColdPipe.lastDrawnLine.distanceTo(Flatten.point(wc.x, wc.y))[1].ps;
                                    const currA = tmvObj.toWorldAngle(0);
                                    const desiredA = -Flatten.vector(
                                        Flatten.point(wc.x, wc.y)
                                        , closePoint,
                                    ).angleTo(
                                        Flatten.vector(0, -1),
                                    ) / Math.PI * 180;

                                    newTmv.rotation = ((desiredA - currA) % 360 + 360) % 360;

                                    // maybe refresh is unnecessary?
                                    tmvObj.refreshObject(tmvObj.parentEntity, newTmv);
                                    coldObj = DrawableObjectFactory.build(
                                        newCold,
                                        newTmv,
                                        context.objectStore,
                                        false,
                                    ) as SystemNode;
                                    const coldLoc = coldObj.toWorldCoord({x: 0, y: 0});

                                    leadPipe(context, coldLoc, newCold, coldPipeUid, StandardFlowSystemUids.ColdWater, splitColdPipe);

                            } else {
                                splitColdPipe = null;
                            }


                            // do closest hot pipe
                            if (splitColdPipe) {
                                interactClosestPipe(context, StandardFlowSystemUids.HotWater, wc, 3000);
                                if (context.interactive) {
                                    try {
                                        splitHotPipe = context.interactive as Pipe;

                                        hotObj = DrawableObjectFactory.build(
                                            newHot,
                                            newTmv,
                                            context.objectStore,
                                            false,
                                        ) as SystemNode;

                                        const hotWc = hotObj.toWorldCoord({x: 0, y: 0});

                                        leadPipe(context, hotWc, newHot, hotPipeUid, StandardFlowSystemUids.HotWater, splitHotPipe);
                                    } finally {
                                        if (hotObj) {
                                            context.objectStore.delete(hotObj.uid);
                                        }
                                    }
                                } else {
                                    splitHotPipe = null;
                                }
                            }
                        } finally {
                            if (tmvObj) {
                                context.objectStore.delete(tmvObj.uid);
                            }
                            if (coldObj) {
                                context.objectStore.delete(coldObj.uid);
                            }
                            if (hotObj) {
                                context.objectStore.delete(hotObj.uid);
                            }
                        }
                        context.processDocument();
                    } finally {

                        context.unlockDrawing();
                    }
                });
            },
            (wc: Coord) => {
                if (splitColdPipe) {
                    context.deleteEntity(splitColdPipe);
                }
                if (splitHotPipe) {
                    context.deleteEntity(splitHotPipe);
                }
                context.$store.dispatch('document/commit');
            },
        ));
    });
}

function leadPipe(
    context: CanvasContext,
    wc: Coord,
    connectTo: ConnectableEntity,
    pipeUid: string,
    systemUid: string,
    pipeSpec: string | Pipe,
    radius: number = Infinity,
): PipeEntity | null {

    let pipe: Pipe;
    if (pipeSpec instanceof Pipe) {
        pipe = pipeSpec;
    } else {
        interactClosestPipe(context, pipeSpec, wc, radius);
        if (context.interactive) {
            pipe = context.interactive as Pipe;
        } else {
            return null;
        }
    }

    const valve = addValveAndSplitPipe(context, pipe, wc,
        context.document.drawing.flowSystems.find((s) => s.uid === systemUid)!,
    );

    // Draw de cold peep
    const newPipe: PipeEntity = {
        color: null,
        diameterMM: null,
        endpointUid: [valve.uid, connectTo.uid],
        heightAboveFloorM: 70,
        lengthM: null,
        material: null,
        maximumVelocityMS: null,
        parentUid: null,
        systemUid,
        type: EntityType.PIPE,
        uid: pipeUid,
    };

    context.document.drawing.entities.push(newPipe);
    return newPipe;
}

function interactClosestPipe(context: CanvasContext, systemUid: string, wc: Coord, radius: number) {
    context.offerInteraction(
        {
            type: InteractionType.INSERT,
            entityType: EntityType.TMV,
            worldCoord: wc,
            worldRadius: radius, // 1 M radius
        },
        (object: BaseBackedObject) => {
            const entity: DrawableEntity = object.entity;
            if (entity.type === EntityType.PIPE) {
                const pe: PipeEntity = entity as PipeEntity;
                return pe.systemUid === systemUid;
            }
            return false;
        },
        (object: BaseBackedObject) => {
            return -(object as Pipe).lastDrawnLine.distanceTo(Flatten.point(wc.x, wc.y))[0];
        },
    );
}
