import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {ConnectableEntity} from '@/store/document/types';
import assert from 'assert';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';

export default abstract class BackedConnectable<T extends ConnectableEntityConcrete> extends BackedDrawableObject<T> {
    abstract minimumConnections: number;

    prepareDeleteConnection(uid: string): BaseBackedObject[] {
        const index = this.entity.connections.indexOf(uid);
        if (index === -1) {
            throw new Error('Tried to delete a connection that doesn\'t exist: ' +
                uid + ' in ' + JSON.stringify(this.entity),
            );
        }
        this.entity.connections.splice(index, 1);

        if (this.entity.connections.length < this.minimumConnections) {
            return this.prepareDelete();
        } else {
            return [];
        }
    }
}
