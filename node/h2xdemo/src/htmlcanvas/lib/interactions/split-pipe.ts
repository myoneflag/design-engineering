import Pipe from '@/htmlcanvas/objects/pipe';
import {ConnectableEntity, Coord, FlowSystemParameters} from '@/store/document/types';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import Flatten from '@flatten-js/core';
import PipeEntity from '@/store/document/entities/pipe-entity';
import * as _ from 'lodash';
import ValveEntity from '@/store/document/entities/valve-entity';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';
import {cloneSimple} from '@/lib/utils';

export function jointifyClosestValve(pipe: Pipe, otherWc: Coord, context: CanvasContext) {
    const pipeJoinable = pipe.snipEnds(30);
    const joinPoint = Flatten.point(otherWc.x, otherWc.y).distanceTo(pipeJoinable)[1].end;

    const pipe1: PipeEntity = cloneSimple(pipe.entity);
    const pipe2: PipeEntity = cloneSimple(pipe.entity);
    pipe1.uid = uuid();
    pipe2.uid = uuid();
    const newFitting: ValveEntity = {
        calculation: null,
        center: {x: joinPoint.x, y: joinPoint.y},
        color: null,
        connections: [pipe1.uid, pipe2.uid],
        parentUid: null,
        systemUid: pipe.entity.systemUid,
        type: EntityType.VALVE,
        uid: uuid(),
        valveType: 'fitting',
    };

    pipe1.calculation = pipe2.calculation = null;
    pipe1.endpointUid = [newFitting.uid, pipe.entity.endpointUid[0]];
    pipe2.calculation = pipe2.calculation = null;
    pipe2.endpointUid = [newFitting.uid, pipe.entity.endpointUid[1]];

    const a1 = context.objectStore.get(pipe.entity.endpointUid[0]) as
        BackedConnectable<ConnectableEntityConcrete>;
    a1.entity.connections.push(pipe1.uid);


    const a2 = context.objectStore.get(pipe.entity.endpointUid[1]) as
        BackedConnectable<ConnectableEntityConcrete>;
    a2.entity.connections.push(pipe2.uid);

    context.document.drawing.entities.push(pipe1, pipe2, newFitting);

    context.deleteEntity(pipe);

    return newFitting;
}

export function addValveAndSplitPipe(
    context: CanvasContext,
    pipe: Pipe,
    hoverWc: Coord,
    system?: string,
    minDistToEndpoint: number = 0,
    newValve?: ConnectableEntityConcrete,
): ConnectableEntityConcrete {
    hoverWc = pipe.project(hoverWc, minDistToEndpoint);

    let wasInteractive: boolean = false;
    if (context.interactive && context.interactive.findIndex((obj) => obj.uid === pipe.uid) !== -1) {
        wasInteractive = true;
    }

    if (system === undefined) {
        system = pipe.entity.systemUid;
    }

    // Maybe we drew onto a background
    const [parentUid, oc] = getInsertCoordsAt(context, hoverWc);

    const pipe1uid = uuid();
    const pipe2uid = uuid();

    if (newValve === undefined) {
        newValve = {
            center: oc,
            color: null,
            connections: [pipe1uid, pipe2uid],
            parentUid,
            systemUid: system,
            type: EntityType.VALVE,
            uid: uuid(),
            valveType: 'fitting',
            calculation: null,
        };
        context.document.drawing.entities.push(newValve);
    } else {
        newValve.connections.push(pipe1uid, pipe2uid);
        newValve.parentUid = parentUid;
        newValve.center = oc;
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


    (context.document.drawing.entities.find(
            (o) => o.uid === pipe!.entity.endpointUid[0]) as ConnectableEntity
    ).connections.push(newPipe1.uid);
    (context.document.drawing.entities.find(
            (o) => o.uid === pipe!.entity.endpointUid[1]) as ConnectableEntity
    ).connections.push(newPipe2.uid);

    context.document.drawing.entities.push(newPipe1, newPipe2);

    if (wasInteractive) {
        context.interactive!.push(newPipe1, newPipe2);
    }

    context.deleteEntity(pipe);
    return newValve;
}
