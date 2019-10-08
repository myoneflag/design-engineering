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
import ValveEntity from '@/store/document/entities/valve-entity';
import Valve from '@/htmlcanvas/objects/valve';
import Pipe from '@/htmlcanvas/objects/pipe';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';

export default function insertFlowSource(
    context: CanvasContext,
    system: FlowSystemParameters,
) {
    const newUid = uuid();
    let toReplace: BackedDrawableObject<ConnectableEntityConcrete> | null = null;
    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted) => {
            if (interrupted) {
                context.$store.dispatch('document/revert');
            }
            MainEventBus.$emit('set-tool-handler', null);
        },
        (wc: Coord) => {
            // Preview
            context.lockDrawing();
            context.$store.dispatch('document/revert', false).then(() => {

                const interactive = context.offerInteraction({
                    entityType: EntityType.FLOW_SOURCE,
                    worldCoord: wc,
                    worldRadius: 0,
                    type: InteractionType.INSERT,
                },
                    (o) => {
                    return o.length > 0 && o[0].type === EntityType.VALVE;
                });


                let connections: string[] = [];

                if (interactive) {
                    const object = context.objectStore.get(interactive[0].uid)!;
                    const entity = object.entity as ConnectableEntity;
                    connections = _.cloneDeep(entity.connections);

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
                    wc = object.toWorldCoord({x: 0, y: 0});
                } else {
                    toReplace = null;
                }

                const doc = context.document as DocumentState;

                // Maybe we drew onto a background
                const [parentUid, oc] = getInsertCoordsAt(context, wc);

                const newEntity: FlowSourceEntity = {
                    connections,
                    center: oc,
                    color: null,
                    heightAboveFloorM: 0,
                    material: null,
                    maximumVelocityMS: null,
                    parentUid,
                    pressureKPA: null,
                    diameterMM: 100,
                    spareCapacity: null,
                    systemUid: system.uid,
                    temperatureC: null,
                    type: EntityType.FLOW_SOURCE,
                    uid: newUid,
                    calculation: null,
                };

                doc.drawing.entities.push(newEntity);

                context.unlockDrawing();
                context.processDocument();

            });
        },
        (wc: Coord) => {
            if (toReplace) {
                context.deleteEntity(toReplace);
            }
            context.$store.dispatch('document/commit');

            // Notify the user that there's fields to select
            MainEventBus.$emit('select', {uid: newUid, property: 'pressureKPA', recenter: false});
        },
    ));
}
