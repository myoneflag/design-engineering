import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {Coord} from '@/store/document/types';
import * as _ from 'lodash';


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
