import {ConnectableEntity, Coord, DocumentState, FlowSystemParameters} from '@/store/document/types';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';
import {InteractionType} from '@/htmlcanvas/lib/interaction';
import * as _ from 'lodash';
import Pipe from '@/htmlcanvas/objects/pipe';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {addValveAndSplitPipe} from '@/htmlcanvas/lib/interactions/split-pipe';
import {cloneSimple} from '@/lib/utils';

export default function insertFlowSource(
    context: CanvasContext,
    system: FlowSystemParameters,
) {
    const newUid = uuid();
    let toReplace: BackedDrawableObject<ConnectableEntityConcrete> | null = null;
    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
            if (interrupted) {
                context.$store.dispatch('document/revert');
            }
            if (!displaced) {
                MainEventBus.$emit('set-tool-handler', null);
            }
        },
        (wc: Coord) => {
            // Preview
            context.$store.dispatch('document/revert', false).then(() => {

                const interactive = context.offerInteraction({
                    entityType: EntityType.FLOW_SOURCE,
                    worldCoord: wc,
                    worldRadius: 10,
                    type: InteractionType.INSERT,
                },
                    (o) => {
                    return o[0].type === EntityType.VALVE || o[0].type === EntityType.PIPE;
                });


                let connections: string[] = [];

                const newEntity: FlowSourceEntity = {
                    connections,
                    center: cloneSimple(wc),
                    color: null,
                    heightAboveFloor: 0,
                    material: null,
                    maximumVelocityMS: null,
                    parentUid: null,
                    pressureKPA: null,
                    diameterMM: 100,
                    spareCapacity: null,
                    systemUid: system.uid,
                    temperatureC: null,
                    type: EntityType.FLOW_SOURCE,
                    uid: newUid,
                    calculation: null,
                };

                if (interactive) {
                    const object = context.objectStore.get(interactive[0].uid)!;
                    if (object instanceof Pipe) {
                        addValveAndSplitPipe(context, object, wc, object.entity.systemUid, 30, newEntity);
                        wc = newEntity.center;
                    } else {

                        const entity = object.entity as ConnectableEntity;
                        connections = cloneSimple(entity.connections);

                        connections.forEach((e) => {
                            const other = context.objectStore.get(e);
                            if (other instanceof Pipe) {
                                if (other.entity.endpointUid[0] === entity.uid) {
                                    other.entity.endpointUid[0] = newUid;
                                } else {
                                    other.entity.endpointUid[1] = newUid;
                                }
                            } else {
                                throw new Error('Connection is not a pipe');
                            }
                        });

                        toReplace = object as BackedDrawableObject<ConnectableEntityConcrete>;
                        toReplace.entity.connections.splice(0);
                        context.deleteEntity(toReplace);
                        wc = object.toWorldCoord({x: 0, y: 0});
                    }
                } else {
                    toReplace = null;
                }

                const doc = context.document as DocumentState;

                // Maybe we drew onto a background
                const [parentUid, oc] = getInsertCoordsAt(context, wc);
                newEntity.center = oc;
                newEntity.parentUid = parentUid;

                doc.drawing.entities.push(newEntity);

                context.processDocument();

            });
        },
        () => {
            context.$store.dispatch('document/commit');

            // Notify the user that there's fields to select
            MainEventBus.$emit('select', {uid: newUid, property: 'pressureKPA', recenter: false});
        },
        'Insert Flow Source',
    ));
}
