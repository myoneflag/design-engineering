import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import * as _ from 'lodash';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import doc = Mocha.reporters.doc;


export function getInsertCoordsAt(context: CanvasContext, wc: Coord): [string | null, Coord] {
    const floor = context.backgroundLayer.getBackgroundAt(wc, context.objectStore);
    let parentUid: string | null = null;
    let oc = _.cloneDeep(wc);
    if (floor != null) {
        parentUid = floor.entity.uid;
        oc = floor.toObjectCoord(wc);
    }
    return [parentUid, oc];
}

export function getBoundingBox(objectStore: ObjectStore, document: DocumentState) {
    let l = Infinity;
    let r = -Infinity;
    let t = Infinity;
    let b = -Infinity;

    const look = (e: DrawableEntity) => {
        const obj = objectStore.get(e.uid);
        if (obj) {
            const bb = obj.shape();
            if (bb) {
                l = Math.min(l, bb.box.xmin);
                r = Math.max(r, bb.box.xmax);
                t = Math.min(t, bb.box.ymin);
                b = Math.max(b, bb.box.ymax);
            }
        }
    };

    document.drawing.backgrounds.forEach(look);
    document.drawing.entities.forEach(look);

    return {l, r, t, b};
}

export function getDocumentCenter(objectStore: ObjectStore, document: DocumentState): Coord {
    const {l, r, t, b} = getBoundingBox(objectStore, document);
    return {x: (l + r) / 2, y: (t + b) / 2};
}

export function resolveProperty(prop: string, obj: any): any {
    if (prop.indexOf('.') === -1) {
        return obj[prop];
    }

    return resolveProperty(
        prop.split('.').splice(1).join('.'),
        obj[prop.split('.')[0]],
    );
}
