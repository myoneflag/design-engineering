import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import { CenteredEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { getInsertCoordsAt } from "../../../../src/htmlcanvas/lib/utils";

export default interface Centered {
    debase(context: CanvasContext): void;

    rebase(context: CanvasContext): void;
}

export function CenteredObject<T extends new (...args: any[]) => Centered & BackedDrawableObject<CenteredEntityConcrete>>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor implements Connectable {
        centered: true = true;

        debase(context: CanvasContext): void {
            if (context.document.uiState.levelUid !== context.globalStore.levelOfEntity.get(this.uid)) {
                return;
            }
            const wc = this.toWorldCoord({ x: 0, y: 0 });
            const angle = this.toWorldAngleDeg(0);

            this.entity.parentUid = null;
            this.entity.center.x = wc.x;
            this.entity.center.y = wc.y;

            if ('rotation' in this.entity) {
                this.entity.rotation = angle;
            }
        }

        rebase(context: CanvasContext) {
            if (context.document.uiState.levelUid !== context.globalStore.levelOfEntity.get(this.uid)) {
                return;
            }
            if (this.entity.parentUid !== null) {
                throw new Error("Entity must be orphan before reparenting. I am " + JSON.stringify(this.entity));
            }
            const [par, oc] = getInsertCoordsAt(context, this.entity.center);
            this.entity.parentUid = par;
            this.entity.center = oc;


            if (par && 'rotation' in this.entity) {
                const parent = context.globalStore.get(par)!;
                this.entity.rotation -= parent.toWorldAngleDeg(0);
            }

        }
    };
}

export function CenteredObjectNoParent<T extends new (...args: any[]) => Centered & BackedDrawableObject<CenteredEntityConcrete>>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    // tslint:disable-next-line:max-classes-per-file
    return class extends constructor implements Connectable {
        centered: true = true;

        debase(): void {
            //
        }

        rebase(context: CanvasContext) {
            //
        }
    };
}
