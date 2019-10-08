import {ConnectableEntity, Coord, DocumentState, FlowSystemParameters} from '@/store/document/types';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {InteractionType} from '@/htmlcanvas/lib/interaction';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import {EntityType} from '@/store/document/entities/types';
import ValveEntity from '@/store/document/entities/valve-entity';
import uuid from 'uuid';
import PipeEntity from '@/store/document/entities/pipe-entity';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import Connectable from '@/htmlcanvas/lib/object-traits/connectable';
import Flatten from '@flatten-js/core';
import * as _ from 'lodash';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';

export default function insertPipes(context: CanvasContext, system: FlowSystemParameters) {
    // strategy:
    // 1. create new pipe at click point
    // 2. endpoint of pipe is at 2nd click point and follows the move in order to preview
    // 3. clicking creates new pipe with start point the same as endpoint.
    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted) => {
            MainEventBus.$emit('set-tool-handler', null);
        },
        (wc: Coord, event: MouseEvent) => {
            context.lockDrawing();
            // Preview
            context.offerInteraction(
                {
                    type: InteractionType.STARTING_PIPE,
                    system,
                    worldRadius: context.lastDrawingContext ?
                        Math.max(context.lastDrawingContext.vp.toWorldLength(3), 50)
                        : 0,
                    worldCoord: wc,
                },
                (object) => {
                    return object[0].type !== EntityType.BACKGROUND_IMAGE;
                },
            );
            context.unlockDrawing();
        },
        (wc: Coord, event: MouseEvent) => {


            // Preview
            context.offerInteraction(
                {
                    type: InteractionType.STARTING_PIPE,
                    system,
                    worldRadius: context.lastDrawingContext ?
                        Math.max(context.lastDrawingContext.vp.toWorldLength(3), 50)
                        : 0,
                    worldCoord: wc,
                },
                (object) => {
                    return object[0].type !== EntityType.BACKGROUND_IMAGE;
                },
            );

            // Create a valve. It will only have a single pipe, and thus be a dead-leg.
            const doc = context.document as DocumentState;
            // maybe we drew onto an existing node.
            let entity: ConnectableEntity | ValveEntity;
            if (context.interactive &&
                context.interactive.length &&
                context.interactive[0].type !== EntityType.BACKGROUND_IMAGE
            ) {
                entity = context.interactive[0] as ConnectableEntity;
                const object = context.objectStore.get(context.interactive[0].uid)!;
                context.hydraulicsLayer.onSelected(object);
            } else {
                // Maybe we drew onto a background
                const [parentUid, oc] = getInsertCoordsAt(context, wc);

                // Nope, we landed on nothing. We create new valve here.
                const valveEntity: ValveEntity = {
                    center: oc,
                    color: null,
                    connections: [],
                    parentUid,
                    systemUid: system.uid,
                    type: EntityType.VALVE,
                    uid: uuid(),
                    // These names should come from databases.
                    valveType: 'fitting',
                    calculation: null,
                };
                entity = valveEntity;
                doc.drawing.entities.push(valveEntity);
            }

            context.$store.dispatch('document/commit').then(() => {
                context.interactive = null;
                insertPipeChain(context, entity, system);
            });
        },
    ));
}

function insertPipeChain(context: CanvasContext, lastAttachment: ConnectableEntity, system: FlowSystemParameters) {
    let nextEntity: ConnectableEntityConcrete | ValveEntity;
    let nextEntityWasNew: boolean = false;
    let pipe: PipeEntity;
    const pipeUid = uuid();

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted) => {
            MainEventBus.$emit('set-tool-handler', null);
            if (interrupted) {
                // revert changes.
                context.$store.dispatch('document/revert').then(() => {

                    // it's possible that we are drawing the first connection, in which case we will have an
                    // orphaned valve. Delete it.
                    if (lastAttachment.connections.length === 0) {
                        const index = context.document.drawing.entities.findIndex((b) => b.uid === lastAttachment.uid);
                        context.document.drawing.entities.splice(index, 1);
                    }
                    context.$store.dispatch('document/commit');
                });
            }
        },
        (wc: Coord, event: MouseEvent) => {

            let needUpdate: boolean = false;

            // create pipe
            if (!pipe) {
                pipe = {
                    color: null,
                    diameterMM: null,
                    lengthM: null,
                    endpointUid: [lastAttachment.uid, lastAttachment.uid],
                    heightAboveFloorM: 0.7,
                    material: null,
                    maximumVelocityMS: null,
                    parentUid: null,
                    systemUid: system.uid,
                    type: EntityType.PIPE,
                    uid: pipeUid,
                    calculation: null,
                };
                context.document.drawing.entities.push(pipe);
                (context.document.drawing.entities.find((e) => e.uid === lastAttachment.uid) as ConnectableEntity)
                    .connections.push(pipe.uid);
                // context.processDocument();
                needUpdate = true;
            }


            // maybe we drew onto an existing node.
            const exclude: string[] = [];
            if (nextEntityWasNew && nextEntity) {
                exclude.push(nextEntity.uid);
            }

            if (!nextEntityWasNew) {
                if (nextEntity) {
                    nextEntity.connections.splice(nextEntity.connections.indexOf(pipeUid), 1);
                }
            }

            context.offerInteraction(
                {
                    type: InteractionType.STARTING_PIPE,
                    system,
                    worldRadius: context.lastDrawingContext ?
                        Math.max(context.lastDrawingContext.vp.toWorldLength(3), 50)
                        : 0,
                    worldCoord: wc,
                },
                (obj) => {
                    if (obj[0].uid !== pipeUid) {
                        if (nextEntity) {
                            return exclude.indexOf(obj[0].uid) === -1;
                        } else {
                            return true;
                        }
                    }
                    return false;
                },
            );

            if (!nextEntityWasNew) {
                if (nextEntity) {
                    nextEntity.connections.push(pipeUid);
                }
            }

            if (context.interactive &&
                context.interactive.length &&
                context.interactive[0].type !== EntityType.BACKGROUND_IMAGE
            ) {
                if (nextEntityWasNew && nextEntity !== null) {
                    // delete the no longer needed new phantom pipe
                    const index = context.document.drawing.entities.findIndex((e) => e.uid === nextEntity.uid);
                    context.document.drawing.entities.splice(index, 1);
                    needUpdate = true;
                }

                if (!nextEntityWasNew) {
                    if (nextEntity) {
                        nextEntity.connections.splice(nextEntity.connections.indexOf(pipeUid), 1);
                    }
                }

                nextEntity = context.interactive[0] as ConnectableEntityConcrete;
                nextEntity.connections.push(pipeUid);
                context.hydraulicsLayer.selectedObject = context.objectStore.get(context.interactive[0].uid)!;
                nextEntityWasNew = false;
            } else {
                context.hydraulicsLayer.selectedObject = null;
                if (!event.shiftKey) {
                    // Snap onto a direction.

                    const bases = [Flatten.vector(0, 1)];
                    const connectable = context.objectStore.get(lastAttachment.uid) as
                        (BackedDrawableObject<ConnectableEntityConcrete> & Connectable);

                    const lawc = connectable.fromParentToWorldCoord(lastAttachment.center);
                    const lawcp = Flatten.point(lawc.x, lawc.y);
                    const wcp = Flatten.point(wc.x, wc.y);
                    connectable.getRadials(pipeUid).forEach(([radialWc, obj]) => {
                        // right now, we don't need a uid check because we are guaranteed that the state was
                        // reset.
                        bases.push(Flatten.vector(lawcp, Flatten.point(radialWc.x, radialWc.y)));
                    });


                    let bestPoint: [number, Flatten.Point] = [Infinity, wcp];
                    bases.forEach((dirVec) => {
                        for (let i = 0; i < 4; i++) {
                            const contextPoint = wcp.projectionOn(Flatten.line(lawcp, dirVec));
                            const dist = contextPoint.distanceTo(wcp)[0];
                            if (dist < bestPoint[0]) {
                                bestPoint = [dist, contextPoint];
                            }
                            dirVec = dirVec.rotate90CCW();
                        }
                    });

                    wc.x = bestPoint[1].x;
                    wc.y = bestPoint[1].y;

                }

                // Maybe we drew onto a background
                const floor = context.backgroundLayer.getBackgroundAt(wc, context.objectStore);
                let parentUid: string | null = null;
                let oc = _.cloneDeep(wc);
                if (floor != null) {
                    parentUid = floor.entity.uid;
                    oc = floor.toObjectCoord(wc);
                }

                if (nextEntityWasNew) {
                    const oldpar = nextEntity.parentUid;
                    nextEntity.center = oc;
                    nextEntity.parentUid = parentUid;
                    if (oldpar !== parentUid) {
                        needUpdate = true;
                    }
                } else {
                    if (nextEntity) {
                        nextEntity.connections.splice(nextEntity.connections.indexOf(pipeUid), 1);
                    }

                    // Create 2nd valve
                    const valveEntity: ValveEntity = {
                        center: oc,
                        color: null,
                        connections: [pipeUid],
                        parentUid,
                        systemUid: system.uid,
                        type: EntityType.VALVE,
                        uid: uuid(),
                        // These names should come from databases.
                        valveType: 'fitting',
                        calculation: null,
                    };
                    nextEntity = valveEntity;
                    context.document.drawing.entities.push(nextEntity);
                    needUpdate = true;
                }

                nextEntityWasNew = true;
            }

            pipe.endpointUid.splice(1, 1, nextEntity.uid);

            if (needUpdate) {
                context.processDocument();
            } else {
                context.scheduleDraw();
            }
        },

        (wc: Coord) => {
            context.interactive = null;
            // committed to the point. And also create new pipe, continue the chain.
            if (nextEntity && lastAttachment.uid !== nextEntity.uid) {
                context.$store.dispatch('document/commit').then(() => {
                    insertPipeChain(context, nextEntity, system);
                });
            } else {
                // end
                context.$store.dispatch('document/revert').then(() => {
                    // it's possible that we are drawing the first connection, in which case we will have an
                    // orphaned valve. Delete it.
                    if (lastAttachment.connections.length === 0) {
                        const index = context.document.drawing.entities.findIndex((b) => b.uid === lastAttachment.uid);
                        context.document.drawing.entities.splice(index, 1);
                    }
                    context.$store.dispatch('document/commit');
                });
            }
        },
    ));
}
