import Pipe from '../../../../src/htmlcanvas/objects/pipe';
import {Coord} from '../../../../src/store/document/types';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import PipeEntity from '../../../../src/store/document/entities/pipe-entity';
import {EntityType} from '../../../../src/store/document/entities/types';
import uuid from 'uuid';
import BackedConnectable from '../../../../src/htmlcanvas/lib/BackedConnectable';
import {ConnectableEntityConcrete, DrawableEntityConcrete} from '../../../../src/store/document/entities/concrete-entity';
import {getInsertCoordsAt} from '../../../../src/htmlcanvas/lib/utils';
import {MagicResult} from '../../../../src/htmlcanvas/lib/black-magic/index';
import FittingEntity from '../../../../src/store/document/entities/fitting-entity';
import Fitting from '../../../../src/htmlcanvas/objects/fitting';
import {rebaseAll} from '../../../../src/htmlcanvas/lib/black-magic/rebase-all';

export function addValveAndSplitPipe(
    context: CanvasContext,
    pipe: Pipe,
    hoverWc: Coord,
    system?: string,
    minDistToEndpoint: number = 0,
    newValve?: ConnectableEntityConcrete,
): MagicResult {
    hoverWc = pipe.project(hoverWc, minDistToEndpoint);

    let wasInteractive: boolean = false;
    if (context.interactive && context.interactive.findIndex((obj) => obj.uid === pipe.uid) !== -1) {
        wasInteractive = true;
    }

    if (system === undefined) {
        system = pipe.entity.systemUid;
    }

    const pipe1uid = uuid();
    const pipe2uid = uuid();

    const created: DrawableEntityConcrete[] = [];

    if (newValve === undefined) {
        newValve = {
            center: hoverWc,
            color: null,
            connections: [pipe1uid, pipe2uid],
            parentUid: null,
            systemUid: system,
            type: EntityType.FITTING,
            uid: uuid(),
            calculation: null,
        };
        created.push(newValve);

        context.$store.dispatch('document/addEntity', newValve);
    } else {
        const nvo = context.objectStore.get(newValve.uid) as BackedConnectable<ConnectableEntityConcrete>;
        nvo.connect(pipe1uid);
        nvo.connect(pipe2uid);

        newValve.center = hoverWc;
    }

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
        calculation: null,
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
        calculation: null,
    };
    context.$store.dispatch('document/addEntity', newPipe1);
    context.$store.dispatch('document/addEntity', newPipe2);

    const newPipes = [newPipe1, newPipe2];
    for (let i = 0; i < 2; i++) {
        const o = context.objectStore.get(pipe!.entity.endpointUid[i])!;
        if (o.type === EntityType.FITTING) {
            (o as Fitting).connect(newPipes[i].uid);
        }
    }

    context.deleteEntity(pipe);

    for (let i = 0; i < 2; i++) {
        const o = context.objectStore.get(pipe!.entity.endpointUid[i])!;
        if (o.type !== EntityType.FITTING) {
            (o as Fitting).connect(newPipes[i].uid);
        }
    }
    created.push(newPipe1, newPipe2);

    if (wasInteractive) {
        context.interactive!.push(newPipe1, newPipe2);
    }

    return {
        deleted: [pipe.uid],
        created,
        focus: newValve,
    };
}
