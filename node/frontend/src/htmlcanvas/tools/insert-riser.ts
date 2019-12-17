import {ConnectableEntity, Coord, DocumentState, FlowSystemParameters} from '../../../src/store/document/types';
import {MainEventBus} from '../../../src/store/main-event-bus';
import PointTool from '../../../src/htmlcanvas/tools/point-tool';
import RiserEntity from '../../store/document/entities/riser-entity';
import {EntityType} from '../../../src/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt} from '../../../src/htmlcanvas/lib/utils';
import {InteractionType} from '../../../src/htmlcanvas/lib/interaction';
import * as _ from 'lodash';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import BackedDrawableObject from '../../../src/htmlcanvas/lib/backed-drawable-object';
import {ConnectableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {addValveAndSplitPipe} from '../../../src/htmlcanvas/lib/black-magic/split-pipe';
import {cloneSimple} from '../../../src/lib/utils';
import {rebaseAll} from '../../../src/htmlcanvas/lib/black-magic/rebase-all';

export default function insertRiser(
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
                    entityType: EntityType.RISER,
                    worldCoord: wc,
                    worldRadius: 10,
                    type: InteractionType.INSERT,
                },
                    (o) => {
                    return o[0].type === EntityType.FITTING || o[0].type === EntityType.PIPE;
                });


                let connections: string[] = [];

                const newEntity: RiserEntity = {
                    bottomHeightM: null,
                    topHeightM: null,
                    center: cloneSimple(wc),
                    color: null,
                    pressureSourceHeightM: null,
                    material: null,
                    maximumVelocityMS: null,
                    calculationHeightM: null,
                    parentUid: null,
                    pressureKPA: null,
                    diameterMM: null,
                    systemUid: system.uid,
                    temperatureC: null,
                    type: EntityType.RISER,
                    uid: newUid,
                };

                context.$store.dispatch('document/addEntity', newEntity);

                if (interactive) {
                    const object = context.objectStore.get(interactive[0].uid)!;
                    if (object instanceof Pipe) {
                        addValveAndSplitPipe(context, object, wc, object.entity.systemUid, 50, newEntity);
                        wc = newEntity.center;
                    } else {

                        const entity = object.entity as ConnectableEntity;
                        connections = cloneSimple(context.objectStore.getConnections(entity.uid));

                        connections.forEach((e) => {
                            const other = context.objectStore.get(e);
                            if (other instanceof Pipe) {
                                if (other.entity.endpointUid[0] === entity.uid) {
                                    context.$store.dispatch('document/updatePipeEndpoints', {
                                        entity: other.entity,
                                        endpoints: [newUid, other.entity.endpointUid[1]],
                                    });
                                } else {
                                    context.$store.dispatch('document/updatePipeEndpoints', {
                                        entity: other.entity,
                                        endpoints: [other.entity.endpointUid[0], newUid],
                                    });
                                }
                            } else {
                                throw new Error('Connection is not a pipe');
                            }
                        });

                        toReplace = object as BackedDrawableObject<ConnectableEntityConcrete>;
                        newEntity.center = toReplace.entity.center;
                        context.deleteEntity(toReplace);

                        wc = object.toWorldCoord({x: 0, y: 0});
                    }
                } else {
                    toReplace = null;
                }

                //rebaseAll(context);

                context.scheduleDraw();
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
