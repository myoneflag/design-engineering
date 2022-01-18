import Pipe from "../../../../src/htmlcanvas/objects/pipe";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import PipeEntity from "../../../../../common/src/api/document/entities/pipe-entity";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import BackedConnectable from "../../../../src/htmlcanvas/lib/BackedConnectable";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete
} from "../../../../../common/src/api/document/entities/concrete-entity";
import { getInsertCoordsAt } from "../../../../src/htmlcanvas/lib/utils";
import { MagicResult } from "../../../../src/htmlcanvas/lib/black-magic/index";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import Fitting from "../../../../src/htmlcanvas/objects/fitting";
import { rebaseAll } from "../../../../src/htmlcanvas/lib/black-magic/rebase-all";
import { Coord } from "../../../../../common/src/api/document/drawing";

export function addValveAndSplitPipe(
    context: CanvasContext,
    pipe: Pipe,
    hoverWc: Coord,
    system?: string,
    minDistToEndpoint: number = 0,
    newValve?: ConnectableEntityConcrete
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
            parentUid: null,
            systemUid: system,
            calculationHeightM: null,
            type: EntityType.FITTING,
            uid: uuid()
        };
        created.push(newValve);

        context.$store.dispatch("document/addEntity", newValve);
    } else {
        newValve.center = hoverWc;
        newValve.parentUid = null;
    }

    const newPipe1: PipeEntity = {
        color: pipe.entity.color,
        diameterMM: pipe.entity.diameterMM,
        endpointUid: [newValve.uid, pipe.entity.endpointUid[0]],
        heightAboveFloorM: pipe.entity.heightAboveFloorM,
        lengthM: null,
        material: pipe.entity.material,
        maximumVelocityMS: pipe.entity.maximumVelocityMS,
        gradePCT: null,
        parentUid: null,
        systemUid: pipe.entity.systemUid,
        network: pipe.entity.network,
        type: EntityType.PIPE,
        uid: pipe1uid,
        entityName: null
    };

    const newPipe2: PipeEntity = {
        color: pipe.entity.color,
        diameterMM: pipe.entity.diameterMM,
        endpointUid: [newValve.uid, pipe.entity.endpointUid[1]],
        heightAboveFloorM: pipe.entity.heightAboveFloorM,
        lengthM: null,
        material: pipe.entity.material,
        maximumVelocityMS: pipe.entity.maximumVelocityMS,
        gradePCT: null,
        parentUid: null,
        systemUid: pipe.entity.systemUid,
        network: pipe.entity.network,
        type: EntityType.PIPE,
        uid: pipe2uid,
        entityName: null
    };
    const puid = pipe.uid;
    context.$store.dispatch("document/deleteEntity", pipe.entity);
    context.$store.dispatch("document/addEntity", newPipe1);
    context.$store.dispatch("document/addEntity", newPipe2);

    created.push(newPipe1, newPipe2);

    if (wasInteractive) {
        context.interactive!.push(newPipe1, newPipe2);
    }

    return {
        deleted: [puid],
        created,
        focus: newValve
    };
}
