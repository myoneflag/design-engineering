import BackedConnectable from "../../../../src/htmlcanvas/lib/BackedConnectable";
import { ConnectableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import Pipe from "../../../../src/htmlcanvas/objects/pipe";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import assert from "assert";
import { addValveAndSplitPipe } from "../../../../src/htmlcanvas/lib/black-magic/split-pipe";
import PipeEntity from "../../../../../common/src/api/document/entities/pipe-entity";
import { cloneSimple } from "../../../../../common/src/lib/utils";

/**
 * Moves object join source to object dest, regardless of compatability, and keeps
 * only the object with highest dragPriority.
 *
 * Returns the losing object, which is deleted (default) or optionally kept.
 */
export function moveOnto(
    source: BackedConnectable<ConnectableEntityConcrete>,
    dest: BackedConnectable<ConnectableEntityConcrete> | Pipe,
    context: CanvasContext
) {
    if (dest instanceof Pipe) {
        const { focus } = addValveAndSplitPipe(
            context,
            dest,
            source.toWorldCoord({ x: 0, y: 0 }),
            dest.entity.systemUid,
            10,
            source.entity
        );
        assert(focus!.uid === source.uid);
    } else {
        dest.debase();
        source.debase();
        const entity = dest.entity;
        const finalCenter = dest.entity.center;
        // delete incidental pipes

        let survivor = source;
        let loser = dest;

        if (dest.dragPriority > source.dragPriority) {
            const tmp = survivor;
            survivor = loser;
            loser = tmp;
        }

        const incidental = context.objectStore
            .getConnections(source.uid)
            .filter((puid) => context.objectStore.getConnections(dest.uid).includes(puid));
        incidental.forEach((pipe) => {
            // Non cascadingly delete
            context.$store.dispatch("document/deleteEntity", context.objectStore.get(pipe)!.entity);
        });

        const pipeE = context.objectStore.getConnections(loser.uid).map((puid) => {
            return cloneSimple(context.objectStore.get(puid)!.entity) as PipeEntity;
        });

        survivor.entity.center.x = finalCenter.x;
        survivor.entity.center.y = finalCenter.y;

        cloneSimple(context.objectStore.getConnections(loser.uid)).forEach((puid) => {
            const pipe = context.objectStore.get(puid)!.entity as PipeEntity;
            assert(pipe.type === EntityType.PIPE);

            assert((pipe.endpointUid[0] === loser.uid) !== (pipe.endpointUid[1] === loser.uid));

            context.$store.dispatch("document/updatePipeEndpoints", {
                entity: pipe,
                endpoints: [
                    pipe.endpointUid[0] === loser.uid ? survivor.uid : pipe.endpointUid[0],
                    pipe.endpointUid[1] === loser.uid ? survivor.uid : pipe.endpointUid[1]
                ]
            });
        });

        if (context.objectStore.has(loser.uid)) {
            context.deleteEntity(loser, false);
        }
    }
}
