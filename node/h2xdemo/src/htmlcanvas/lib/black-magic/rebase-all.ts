import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {EntityType} from '@/store/document/entities/types';
import {isCentered, isConnectable} from '@/store/document';
import Centered from '@/htmlcanvas/lib/object-traits/centered-object';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {CenteredEntityConcrete} from '@/store/document/entities/concrete-entity';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';

export function rebaseAll(context: CanvasContext) {
    context.objectStore.forEach((o) => {
        if (isCentered(o.entity.type)) {
            const co = o as BaseBackedObject & Centered;
            co.debase();
            co.rebase(context);
        }
    });
}
