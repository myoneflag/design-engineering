import {ConnectableEntity, Coord, DrawableEntity} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {ENTITY_NAMES} from '@/store/document/entities';
import Pipe from '@/htmlcanvas/objects/pipe';
import assert from 'assert';

export default interface Connectable {
    radials: (exclude: string | null) => Array<[Coord, BackedDrawableObject<DrawableEntity>]>;
}

export function getRadials(object: BackedDrawableObject<ConnectableEntity>, exclude: string | null = null)
    : Array<[Coord, BackedDrawableObject<DrawableEntity>]>  {
    const result: Array<[Coord, BackedDrawableObject<DrawableEntity>]>  = [];
    object.stateObject.connections.forEach((uid) => {
        if (uid === exclude) {
            return;
        }

        const connected = object.objectStore.get(uid) as BackedDrawableObject<DrawableEntity>;

        if (connected.stateObject.type === ENTITY_NAMES.PIPE) {
            const pipeObject = connected as Pipe;
            const [other] = pipeObject.worldEndpoints(object.uid);
            assert(pipeObject.worldEndpoints(object.uid).length <= 1);

            if (other) {
                result.push([other, pipeObject]);
            }
        }
    });
    return result;
}
