import {ConnectableEntity, Coord, DrawableEntity} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import Pipe from '@/htmlcanvas/objects/pipe';
import assert from 'assert';
import {EntityType} from '@/store/document/entities/types';
import * as _ from 'lodash';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';

export default interface Connectable {
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]>;
    getAngles(): number[];
    prepareDelete(context: CanvasContext): BaseBackedObject[];
    isStraight(tolerance: number): boolean;
    debase(): void;
    rebase(context: CanvasContext): void;
}

const EPS = 1e-5;

export function ConnectableObject<T extends new (...args: any[])
    => Connectable & BackedConnectable<ConnectableEntityConcrete>>(constructor: T) {


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

        getAngles(): number[] {
            const ret = [];
            const radials = this.getRadials();
            const angles = radials.map((r) => this.toObjectCoord(r[0])).map((r) => Math.atan2(r.y, r.x));
            angles.sort();
            for (let i = 0; i < angles.length; i++) {
                const diff = angles[(i + 1) % angles.length] - angles[i];
                ret.push((diff * 180 / Math.PI + 360) % 360);
            }
            let sum = 0;
            ret.forEach((n) => sum += n);
            console.log(JSON.stringify(ret));
            assert(Math.abs(sum - 360) <= EPS || Math.abs(sum) <= EPS);
            return ret;
        }

        isStraight(tolerance: number = EPS): boolean {
            const angles = this.getAngles();
            if (angles.length !== 2) {
                return false;
            }
            return Math.abs(angles[0] - 180) <= tolerance;
        }

        prepareDelete(context: CanvasContext): BaseBackedObject[] {
            // Delete all connected pipes.
            // don't think about adding 'this' since deleting our connecting pipes will automagically
            // make that work.
            const result: BaseBackedObject[] = [];
            _.clone(this.entity.connections).forEach((c) => {
                const o = this.objectStore.get(c);
                if (o instanceof BackedDrawableObject) {
                    result.push(...o.prepareDelete(context));
                } else {
                    throw new Error('Non existent connection on valve ' + JSON.stringify(this.entity));
                }
            });

            const superResult = super.prepareDelete(context);
            result.push(...superResult);

            result.push(this);

            return result;
        }

        debase(): void {
            const wc = this.toWorldCoord({x: 0, y: 0});
            this.entity.parentUid = null;
            this.entity.center = wc;
        }

        rebase(context: CanvasContext) {
            assert(this.entity.parentUid === null);
            const [par, oc] = getInsertCoordsAt(context, this.entity.center);
            this.entity.parentUid = par;
            this.entity.center = oc;
        }
    };
}
