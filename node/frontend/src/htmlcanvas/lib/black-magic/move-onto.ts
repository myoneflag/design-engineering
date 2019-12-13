import BackedConnectable from '../../../../src/htmlcanvas/lib/BackedConnectable';
import {ConnectableEntityConcrete} from '../../../../src/store/document/entities/concrete-entity';
import Pipe from '../../../../src/htmlcanvas/objects/pipe';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {EntityType} from '../../../../src/store/document/entities/types';
import assert from 'assert';
import {addValveAndSplitPipe} from '../../../../src/htmlcanvas/lib/black-magic/split-pipe';
import {cloneSimple, connect, disconnect} from '../../../../src/lib/utils';

/**
 * Moves object join source to object dest, regardless of compatability, and keeps
 * only the object with highest dragPriority.
 *
 * Returns the losing object, which is deleted (default) or optionally kept.
 */
export function moveOnto(
    source: BackedConnectable<ConnectableEntityConcrete>,
    dest: BackedConnectable<ConnectableEntityConcrete> | Pipe,
    context: CanvasContext,
) {
    if (dest instanceof Pipe) {
        const {focus} = addValveAndSplitPipe(
            context,
            dest,
            source.toWorldCoord({x: 0, y: 0}),
            dest.entity.systemUid,
            10,
            source.entity,
        );
        assert(focus!.uid === source.uid);
    } else {
        const entity = dest.entity;
        const finalCenter = dest.entity.center;
        // delete incidental pipes
        const incidental =
            context.objectStore.getConnections(source.uid)
                .filter((puid) => context.objectStore.getConnections(dest.uid)
                .includes(puid));
        incidental.forEach((pipe) => {
            context.deleteEntity(context.objectStore.get(pipe)!);
        });

        let survivor = source;
        let loser = dest;

        if (dest.dragPriority > source.dragPriority) {
            const tmp = survivor;
            survivor = loser;
            loser = tmp;
        }

        survivor.entity.center.x = finalCenter.x;
        survivor.entity.center.y = finalCenter.y;

        cloneSimple(context.objectStore.getConnections(loser.uid)).forEach((puid) => {
            const pipe = context.objectStore.get(puid) as Pipe;
            assert (pipe.type === EntityType.PIPE);

            assert((pipe.entity.endpointUid[0] === loser.uid) !== (pipe.entity.endpointUid[1] === loser.uid));

            context.objectStore.updatePipeEndpoints(pipe.uid, [
                pipe.entity.endpointUid[0] === loser.uid ? survivor.uid : pipe.entity.endpointUid[0],
                pipe.entity.endpointUid[1] === loser.uid ? survivor.uid : pipe.entity.endpointUid[1],
            ]);
            survivor.connect(pipe.uid);
        });

        context.objectStore.getConnections(loser.uid).slice().forEach((c) => {
            loser.disconnect(c);
        });

        if (context.objectStore.has(loser.uid)) {
            context.deleteEntity(loser, false);
        }
    }
}
