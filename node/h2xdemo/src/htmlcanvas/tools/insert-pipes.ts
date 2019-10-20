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
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {addValveAndSplitPipe} from '@/htmlcanvas/lib/interactions/split-pipe';
import Pipe from '@/htmlcanvas/objects/pipe';
import {isConnectable} from '@/store/document';

export default function insertPipes(context: CanvasContext, system: FlowSystemParameters) {
    // strategy:
    // 1. create new pipe at click point
    // 2. endpoint of pipe is at 2nd click point and follows the move in order to preview
    // 3. clicking creates new pipe with start point the same as endpoint.
    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
            if (!displaced) {
                MainEventBus.$emit('set-tool-handler', null);
            }
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
            context.scheduleDraw();

        },
        (wc: Coord, event: MouseEvent) => {


            // Preview
            const interactive = context.offerInteraction(
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
            if (interactive) {
                const target = interactive[0];
                if (target.type === EntityType.PIPE) {
                    entity = addValveAndSplitPipe(
                        context,
                        context.objectStore.get(target.uid) as Pipe,
                        wc,
                        target.systemUid,
                        30,
                    );
                    context.deleteEntity(context.objectStore.get(target.uid) as Pipe);
                } else {
                    entity = target as ConnectableEntity;
                }


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
    console.log('inserting pipe chain at ' + JSON.stringify(lastAttachment));
    let nextEntity: ConnectableEntityConcrete | ValveEntity;
    const pipeUid = uuid();

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
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

            if (!displaced) {
                MainEventBus.$emit('set-tool-handler', null);
                // stamp and draw another pipe
                insertPipes(context, system);
            }
        },
        (wc: Coord, event: MouseEvent) => {

            context.$store.dispatch('document/revert', false);

            // create pipe
            const pipe: PipeEntity = {
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

            // maybe we drew onto an existing node.

            const interactive = context.offerInteraction(
                {
                    type: InteractionType.STARTING_PIPE,
                    system,
                    worldRadius: context.lastDrawingContext ?
                        Math.max(context.lastDrawingContext.vp.toWorldLength(3), 50)
                        : 0,
                    worldCoord: wc,
                },
                undefined,
                ([obj]) => {
                    if (obj.type === EntityType.PIPE) {
                        return 0;
                    } else {
                        return 10;
                    }
                },
            );

            if (interactive) {
                if (interactive[0].type === EntityType.PIPE) {
                    nextEntity = addValveAndSplitPipe(
                        context,
                        context.objectStore.get(interactive[0].uid) as Pipe,
                        wc,
                        pipe.systemUid,
                        30,
                    );
                    context.deleteEntity(context.objectStore.get(interactive[0].uid) as Pipe);
                    nextEntity.connections.push(pipe.uid);
                } else if (isConnectable(interactive[0].type)) {
                    nextEntity = interactive[0] as ConnectableEntityConcrete;
                    nextEntity.connections.push(pipeUid);
                    context.hydraulicsLayer.selectedObject = context.objectStore.get(interactive[0].uid)!;

                } else {
                    throw new Error('Don\'t know how to handle this');
                }
            } else {
                // Create an endpoint fitting for it instead
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
                const [parentUid, oc] = getInsertCoordsAt(context, wc);

                // Create 2nd valve
                nextEntity = {
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
                context.document.drawing.entities.push(nextEntity);
            }

            pipe.endpointUid.splice(1, 1, nextEntity.uid);

            context.processDocument();
        },

        (wc: Coord) => {
            context.interactive = null;
            // committed to the point. And also create new pipe, continue the chain.
            context.$store.dispatch('document/commit').then(() => {
                insertPipeChain(context, nextEntity, system);
            });
        },
    ));
}
