import {ConnectableEntity, Coord, DrawableEntity} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import Pipe from '@/htmlcanvas/objects/pipe';
import assert from 'assert';
import {EntityType} from '@/store/document/entities/types';

export default interface Connectable {
    getRadials(exclude?: string | null): Array<[Coord, BackedDrawableObject<DrawableEntity>]>;
}


export function ConnectableObject<T extends new (...args: any[])
    => Connectable & BackedDrawableObject<ConnectableEntity>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor implements Connectable {
        getRadials(exclude: string | null = null)
            : Array<[Coord, BackedDrawableObject<DrawableEntity>]> {
            const result: Array<[Coord, BackedDrawableObject<DrawableEntity>]> = [];
            this.stateObject.connections.forEach((uid) => {
                if (uid === exclude) {
                    return;
                }

                const connected = this.objectStore.get(uid) as BackedDrawableObject<DrawableEntity>;

                if (connected.stateObject.type === EntityType.PIPE) {
                    const pipeObject = connected as Pipe;
                    const [other] = pipeObject.worldEndpoints(this.uid);
                    assert(pipeObject.worldEndpoints(this.uid).length <= 1);

                    if (other) {
                        result.push([other, pipeObject]);
                    }
                }
            });
            return result;
        }
    };
}
