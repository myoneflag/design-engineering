import {ConnectableEntity, Coord, DrawableEntity} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import Pipe from '@/htmlcanvas/objects/pipe';
import assert from 'assert';
import {EntityType} from '@/store/document/entities/types';
import * as _ from 'lodash';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';

export default interface Connectable {
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]>;
    prepareDelete(): BaseBackedObject[];
}


export function ConnectableObject<T extends new (...args: any[])
    => Connectable & BackedConnectable<ConnectableEntity>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor implements Connectable {
        getRadials(exclude: string | null = null)
            : Array<[Coord, BaseBackedObject]> {
            const result: Array<[Coord, BaseBackedObject]> = [];
            this.entity.connections.forEach((uid) => {
                if (uid === exclude) {
                    return;
                }

                const connected = this.objectStore.get(uid) as BaseBackedObject;

                if (connected === undefined) {
                    throw new Error('connectable not found: ' + uid + ' of ' + JSON.stringify(this.entity));
                }

                if (connected.entity.type === EntityType.PIPE) {
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

        prepareDelete(): BaseBackedObject[] {
            // Delete all connected pipes.
            // don't think about adding 'this' since deleting our connecting pipes will automagically
            // make that work.
            const result: BaseBackedObject[] = [];
            _.clone(this.entity.connections).forEach((c) => {
                const o = this.objectStore.get(c);
                if (o instanceof BackedDrawableObject) {
                    result.push(...o.prepareDelete());
                } else {
                    throw new Error('Non existent connection on valve ' + JSON.stringify(this.entity));
                }
            });

            const superResult = super.prepareDelete();
            result.push(...superResult);

            result.push(this);

            return result;
        }
    };
}
