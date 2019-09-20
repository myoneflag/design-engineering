import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {ConnectableEntity, Coord, FlowSystemParameters} from '@/store/document/types';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import {InteractionType} from '@/htmlcanvas/lib/interaction';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import Pipe from '@/htmlcanvas/objects/pipe';
import ValveEntity from '@/store/document/entities/valve-entity';
import PipeEntity from '@/store/document/entities/pipe-entity';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';

export default function insertValve(context: CanvasContext, system: FlowSystemParameters) {

    let pipe: Pipe | null = null;

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted) => {
            if (interrupted) {
                context.$store.dispatch('document/revert').then(() => {
                    MainEventBus.$emit('set-tool-handler', null);
                    context.$store.dispatch('document/commit');
                });
            }
        },
        (wc, event) => {
            context.$store.dispatch('document/revert', false).then(() => {

                context.offerInteraction(
                    {
                        type: InteractionType.INSERT,
                        entityType: EntityType.VALVE,
                        worldCoord: wc,
                        worldRadius: 0,
                    },
                    (drawable) => {
                        return drawable.type === EntityType.PIPE;
                    },
                );

                if (context.interactive) {
                    pipe = context.interactive as Pipe;
                    // Project onto pipe
                    addValveAndSplitPipe(context, pipe, wc, system);

                    context.processDocument();
                } else {
                    pipe = null;
                }
            });
        },
        (worldCoord, event) => {
            context.interactive = null;
            MainEventBus.$emit('set-tool-handler', null);
            if (pipe) {
                context.deleteEntity(pipe);
            }
            context.$store.dispatch('document/commit');
        },
    ));
}

export function addValveAndSplitPipe(context: CanvasContext, pipe: Pipe, wc: Coord, system: FlowSystemParameters): ValveEntity {
    wc = pipe.project(wc);

    // Maybe we drew onto a background
    const [parentUid, oc] = getInsertCoordsAt(context, wc);

    const pipe1uid = uuid();
    const pipe2uid = uuid();

    const newValve: ValveEntity = {
        center: oc,
        color: null,
        connections: [pipe1uid, pipe2uid],
        parentUid,
        systemUid: system.uid,
        type: EntityType.VALVE,
        uid: uuid(),
        valveType: 'fitting',
    };

    const newPipe1: PipeEntity = {
        color: pipe.entity.color,
        diameterMM: pipe.entity.diameterMM,
        endpointUid: [newValve.uid, pipe.entity.endpointUid[0]],
        heightAboveFloorM: pipe.entity.heightAboveFloorM,
        lengthM: null,
        material: pipe.entity.material,
        maximumVelocityMS: pipe.entity.maximumVelocityMS,
        parentUid: null,
        systemUid: pipe.entity.systemUid,
        type: EntityType.PIPE,
        uid: pipe1uid,
    };

    const newPipe2: PipeEntity = {
        color: pipe.entity.color,
        diameterMM: pipe.entity.diameterMM,
        endpointUid: [newValve.uid, pipe.entity.endpointUid[1]],
        heightAboveFloorM: pipe.entity.heightAboveFloorM,
        lengthM: null,
        material: pipe.entity.material,
        maximumVelocityMS: pipe.entity.maximumVelocityMS,
        parentUid: null,
        systemUid: pipe.entity.systemUid,
        type: EntityType.PIPE,
        uid: pipe2uid,
    };

    (context.document.drawing.entities.find(
            (o) => o.uid === pipe!.entity.endpointUid[0]) as ConnectableEntity
    ).connections.push(newPipe1.uid);
    (context.document.drawing.entities.find(
            (o) => o.uid === pipe!.entity.endpointUid[1]) as ConnectableEntity
    ).connections.push(newPipe2.uid);

    context.document.drawing.entities.push(newValve, newPipe1, newPipe2);

    return newValve;
}
