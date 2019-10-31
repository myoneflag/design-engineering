import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import Pipe from '@/htmlcanvas/objects/pipe';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {EntityType} from '@/store/document/entities/types';
import assert from 'assert';
import {replacePipeEndpointLocal} from '@/store/document/entities/pipe-entity';
import {addValveAndSplitPipe} from '@/htmlcanvas/lib/interactions/split-pipe';

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
        const result = addValveAndSplitPipe(
            context,
            dest,
            source.toWorldCoord({x: 0, y: 0}),
            dest.entity.systemUid,
            10,
            source.entity,
        );
        assert(result.uid === source.uid);
    } else {
        const entity = dest.entity;
        const finalCenter = dest.entity.center;
        // delete incidental pipes
        const incidental = source.entity.connections.filter((puid) => dest.entity.connections.includes(puid));
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

        loser.entity.connections.forEach((puid) => {
            const pipe = context.objectStore.get(puid) as Pipe;
            assert (pipe.type === EntityType.PIPE);

            replacePipeEndpointLocal(pipe.entity, loser.uid, survivor.uid);
            survivor.entity.connections.push(pipe.uid);
        });
        loser.entity.connections.splice(0);

        context.deleteEntity(loser, false);
    }
}
