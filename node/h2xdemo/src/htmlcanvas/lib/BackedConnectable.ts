import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {ConnectableEntity} from '@/store/document/types';
import assert from 'assert';

export default abstract class BackedConnectable<T extends ConnectableEntity> extends BackedDrawableObject<T> {
    abstract minimumConnections: number;

    prepareDeleteConnection(uid: string): BaseBackedObject[] {
        const index = this.entity.connections.indexOf(uid);
        assert(index !== -1);
        this.entity.connections.splice(index, 1);

        if (this.entity.connections.length < this.minimumConnections) {
            return this.prepareDelete();
        } else {
            return [];
        }
    }
}
