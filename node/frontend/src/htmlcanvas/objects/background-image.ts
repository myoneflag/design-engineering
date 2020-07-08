import { ViewPort } from "../../../src/htmlcanvas/viewport";
import axios from "axios";
import * as TM from "transformation-matrix";
import { matrixScale, parseScale } from "../../../src/htmlcanvas/utils";
import { Sizeable } from "../../../src/htmlcanvas/lib/object-traits/sizeable-object";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import { BackgroundEntity } from "../../../../common/src/api/document/entities/background-entity";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import Flatten from "@flatten-js/core";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { DraggableObject } from "../../../src/htmlcanvas/lib/object-traits/draggable-object";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { DrawingArgs, EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { GlobalStore } from "../lib/global-store";
import ImageLoader from "../lib/image-loader";
import { Coord, Rectangle } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { FloorPlanRender, FloorPlanRenders } from "../../../../common/src/api/document/types";
import { getFloorPlanRenders } from "../../api/pdf";

export const imageStore = new Map<string, HTMLImageElement>();

export const RESOLUTION_TOLERANCE = 2;

export class BackgroundImage extends BackedDrawableObject<BackgroundEntity> implements Sizeable {
    get position() {
        return TM.transform(
            TM.translate(this.entity.center.x, this.entity.center.y),
            TM.rotateDEG(this.entity.rotation),
            TM.scale(this.entity.scaleFactor)
        );
    }

    get width() {
        return this.entity.paperSize.widthMM / parseScale(this.entity.scaleName);
    }

    get height() {
        return this.entity.paperSize.heightMM / parseScale(this.entity.scaleName);
    }

    get center() {
        return this.entity.center;
    }

    set center(value) {
        this.entity.center = value;
    }

    get boundary() {
        return this.entity.crop;
    }

    set boundary(value: Rectangle) {
        this.entity.crop = value;
    }
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.BACKGROUND_IMAGE, BackgroundImage);
    }

    grabbedPoint: [number, number] | null = null;
    grabbedCenterState: [number, number] | null = null;
    grabbedOffsetState: Coord | null = null;
    hasDragged: boolean = false;
    shiftKey: boolean = false;
    selectable = true;

    oldKey: string = "";

    imageCache = new Map<string, HTMLImageElement | null>(); // null means we are loading.

    renderIndex: FloorPlanRenders | null | false = null; // false means loading

    drawPoint(context: DrawingContext, objectCoord: Coord, label: string) {
        const { ctx } = context;
        this.withScreen(context, objectCoord, () => {
            ctx.fillStyle = "#ff0000";
            ctx.beginPath();

            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = "14pt " + DEFAULT_FONT_NAME;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(label, -6, +7);
        });
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const result: BaseBackedObject[] = [this];
        this.globalStore.forEach((v) => {
            if (v.entity.parentUid === this.entity.uid) {
                result.push(...v.prepareDelete(context));
            }
        });
        return result;
    }

    // If an image is immediately available, return the best one. Otherwise (or in addition), load the best one and
    // redraw when appropriate.
    chooseImage(context: DrawingContext, forExport: boolean): HTMLImageElement | null {
        // target resolution
        const widthInPixels = context.vp.toScreenLength(this.toWorldLength(this.width));

        // find image in thing.
        if (this.renderIndex === false) {
            return null;
        }

        if (this.renderIndex === null) {
            this.renderIndex = false;
            getFloorPlanRenders(this.entity.key).then((res) => {
                if (res.success) {
                    this.renderIndex = res.data;
                    this.onRedrawNeeded();
                }
            });
            return null;
        }

        if (Object.keys(this.renderIndex.bySize).length === 0) {
            return null;
        }

        let bestVal: FloorPlanRender | null = null;
        let lastVal!: FloorPlanRender;
        const renders = Object.values(this.renderIndex.bySize).sort((a, b) => a.width - b.width);
        let bestValI = renders.length - 1;
        for (let i = 0; i < renders.length; i++) {
            const k = renders[i];
            if (k.width * RESOLUTION_TOLERANCE >= widthInPixels) {
                bestVal = k;
                bestValI = i;
                if (!forExport) {
                    // Choosing lower res images is only for performance. Recover the high res one when exporting.
                    break;
                }
            }
            lastVal = k;
        }
        if (bestVal === null) {
            bestVal = lastVal;
        }

        if (bestVal.images.length !== 1) {
            throw new Error("only layers with one image are supported right now");
        }

        // check if current image exists
        const imageVal = this.imageCache.get(bestVal.images[0].key);
        if (imageVal) {
            return imageVal;
        }

        // otherwise, provoke the loading of the image
        if (imageVal !== null) {
            // check that it isn't already loading
            this.imageCache.set(bestVal.images[0].key, null);
            ImageLoader.get(bestVal.images[0].key).then((img) => {
                this.imageCache.set(bestVal!.images[0].key, img);
                this.onRedrawNeeded();
            });
        }

        // and finally return a more suitable image.
        for (let i = bestValI - 1; i >= 0; i--) {
            if (renders[i].images.length !== 1) {
                throw new Error("only layers with one image are supported right now");
            }

            const img = this.imageCache.get(renders[i].images[0].key);
            if (img) {
                return img;
            }
        }

        for (let i = bestValI + 1; i < renders.length; i++) {
            if (renders[i].images.length !== 1) {
                throw new Error("only layers with one image are supported right now");
            }

            const img = this.imageCache.get(renders[i].images[0].key);
            if (img) {
                return img;
            }
        }

        // no images loaded at all.
        return null;
    }

    // get ready for export.
    async ensureHighestResImageIsLoaded() {
        if (this.renderIndex === null) {
            this.renderIndex = false;
            const res = await getFloorPlanRenders(this.entity.key);
            if (res.success) {
                this.renderIndex = res.data;
            }
        }

        if (this.renderIndex === false) {
            return;
        }

        if (Object.keys(this.renderIndex.bySize).length === 0) {
            return;
        }

        const renders = Object.values(this.renderIndex.bySize).sort((a, b) => a.width - b.width);
        const highestRes = renders[renders.length - 1];

        this.imageCache.set(highestRes.images[0].key, await ImageLoader.get(highestRes.images[0].key));
    }

    /**
     * Draw with natural clip
     */
    naturalClipDraw(
        context: DrawingContext,
        alpha: number,
        l: number,
        t: number,
        w: number,
        h: number,
        active: boolean,
        forExport: boolean
    ) {
        const ctx = context.ctx;
        const image = this.chooseImage(context, forExport);

        if (image) {
            const imgScaleX = this.width / image.width;
            const imgScaleY = this.height / image.height;

            const sx = context.vp.currToSurfaceScale(ctx);
            const oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = alpha;
            const { x, y } = {
                x: (l - image.naturalWidth / 2) * imgScaleX,
                y: (t - image.naturalHeight / 2) * imgScaleY
            };
            const oldCompositeOperation = ctx.globalCompositeOperation;
            const sw = w * imgScaleX;
            const sh = h * imgScaleY;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x, y, sw, sh);

            // Draw a potentially rotated image
            ctx.drawImage(
                image,
                l - this.entity.offset.x / imgScaleX,
                t - this.entity.offset.y / imgScaleY,
                w,
                h,
                x,
                y,
                sw,
                sh
            );

            if (!active && !forExport) {
                ctx.fillStyle = "#f0f8ff";
                ctx.globalCompositeOperation = "color";
                ctx.fillRect(x, y, sw, sh);
            }

            if (!forExport) {
                ctx.lineWidth = 1 / sx;
                ctx.strokeStyle = "#AAAAAA";
                ctx.beginPath();
                ctx.strokeRect(x, y, sw, sh);
            }
            ctx.globalAlpha = oldAlpha;
            ctx.globalCompositeOperation = oldCompositeOperation;
        } else {
            throw new Error("Trying to draw natural image without a loaded image");
        }
    }

    objectClipDraw(
        context: DrawingContext,
        alpha: number,
        x: number,
        y: number,
        w: number,
        h: number,
        selected: boolean,
        active: boolean,
        forExport: boolean
    ) {
        // We use an inverse viewport to find the appropriate clip bounds.
        const ctx = context.ctx;
        const image = this.chooseImage(context, forExport);

        if (image) {
            const imgScaleX = this.width / image.width;
            const imgScaleY = this.height / image.height;

            const ivp = new ViewPort(
                TM.transform(TM.scale(imgScaleX, imgScaleY)),
                image.naturalWidth,
                image.naturalHeight
            );

            const l = ivp.toSurfaceCoord({ x, y });
            const t = ivp.toSurfaceCoord({ x, y });

            this.naturalClipDraw(
                context,
                alpha,
                l.x + image.naturalWidth / 2,
                t.y + image.naturalHeight / 2,
                w / imgScaleX,
                h / imgScaleY,
                active,
                forExport
            );
        } else {
            if (!forExport) {
                const oldAlpha = ctx.globalAlpha;
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "#AAAAAA";
                ctx.fillRect(x, y, w, h);
                const fontSize = Math.round(w / 20);
                ctx.font = fontSize + "pt " + DEFAULT_FONT_NAME;
                ctx.fillStyle = "#FFFFFF";
                const textW = ctx.measureText("Please Wait...");
                ctx.fillText("Please Wait...", x + w / 2 - textW.width / 2, y + h / 2 + fontSize / 2);
                ctx.globalAlpha = oldAlpha;
            }
        }
    }

    // Draw without world space concerns
    drawEntity(context: DrawingContext, { selected, layerActive, forExport }: EntityDrawingArgs) {
        const { ctx, vp } = context;
        const image = this.chooseImage(context, forExport);

        if (selected && image) {
            const imgScaleX = this.width / image.width;
            const imgScaleY = this.height / image.height;

            this.naturalClipDraw(
                context,
                0.2,
                this.entity.offset.x / imgScaleX,
                this.entity.offset.y / imgScaleY,
                image.naturalWidth,
                image.naturalHeight,
                layerActive,
                forExport
            );
        }

        let alpha = 1;
        if (selected && this.hasDragged && !forExport) {
            alpha = 0.6;
        }

        this.objectClipDraw(
            context,
            alpha,
            this.boundary.x,
            this.boundary.y,
            this.boundary.w,
            this.boundary.h,
            selected,
            layerActive,
            forExport
        );

        if (selected && layerActive && !forExport) {
            if (this.entity.pointA) {
                this.drawPoint(context, this.entity.pointA, "A");
            }
            if (this.entity.pointB) {
                this.drawPoint(context, this.entity.pointB, "B");
            }
        }
    }

    getCopiedObjects(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [this];
        const mylvl = this.globalStore.levelOfEntity.get(this.uid)!;
        for (const euid of this.globalStore.entitiesInLevel.get(mylvl)!.values()) {
            const obj = this.globalStore.get(euid)!;
            if (obj.entity.parentUid === this.uid) {
                res.push(obj);
                const conns = this.globalStore.getConnections(obj.uid);
                res.push(...conns.map((c) => this.globalStore.get(c)!));
            }
        }
        return res;
    }

    /**
     * Event Handlers
     */

    inBounds(objectCoord: Coord): boolean {
        if (objectCoord.x < this.entity.crop.x || objectCoord.y < this.entity.crop.y) {
            return false;
        } else if (
            objectCoord.x <= this.entity.crop.x + this.entity.crop.w &&
            objectCoord.y <= this.entity.crop.y + this.entity.crop.h
        ) {
            return true;
        }
        return false;
    }

    onMouseDown(event: MouseEvent, context: CanvasContext): boolean {
        this.shiftKey = event.shiftKey; // shift click moves the pdf but not the crop box or child points.
        const w = context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
        const o = this.toObjectCoord(w);
        if (this.inBounds(o)) {
            context.isLayerDragging = true;
            this.grabbedPoint = [w.x, w.y];
            this.grabbedCenterState = [this.center.x, this.center.y];
            this.grabbedOffsetState = cloneSimple(this.entity.offset);
            this.hasDragged = false;
            if (this.onSelect) {
                this.onSelect(event);
            }
            return true;
        }
        return false;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        if (event.buttons && 1) {
            if (this.grabbedPoint != null && this.grabbedCenterState != null && this.grabbedOffsetState != null) {
                if (!this.hasDragged) {
                    if (event.shiftKey) {
                        this.shiftKey = true;
                    } // Give the user the change to click then shift then drag.
                }
                this.hasDragged = true;

                const w = context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
                if (this.shiftKey) {
                    // Move the offset, not the object
                    const o = this.toObjectCoord(w);
                    const grabbedO = this.toObjectCoord({ x: this.grabbedPoint[0], y: this.grabbedPoint[1] });

                    this.entity.offset.x = this.grabbedOffsetState.x + o.x - grabbedO.x;
                    this.entity.offset.y = this.grabbedOffsetState.y + o.y - grabbedO.y;
                } else {
                    // Move the object
                    this.center.x = this.grabbedCenterState[0] + w.x - this.grabbedPoint[0];
                    this.center.y = this.grabbedCenterState[1] + w.y - this.grabbedPoint[1];
                }

                this.onRedrawNeeded();
                return { handled: true, cursor: "Move" };
            } else {
                return UNHANDLED;
            }
        } else {
            if (this.grabbedCenterState != null || this.grabbedPoint != null) {
                this.onInteractionComplete(event);
            }
            this.grabbedCenterState = null;
            this.grabbedPoint = null;
            this.grabbedOffsetState = null;
            this.hasDragged = false;
            return UNHANDLED;
        }
    }

    onMouseUp(event: MouseEvent, context: CanvasContext): boolean {
        if (this.grabbedPoint || this.grabbedCenterState) {
            context.isLayerDragging = false;
            this.grabbedPoint = null;
            this.grabbedCenterState = null;
            this.hasDragged = false;
            this.onRedrawNeeded();
            this.onInteractionComplete(event);
            return true;
        }
        return false;
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        switch (interaction.type) {
            case InteractionType.INSERT:
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
            case InteractionType.MOVE_ONTO_RECEIVE:
            case InteractionType.MOVE_ONTO_SEND:
            case InteractionType.EXTEND_NETWORK:
                return null;
        }
    }

    rememberToRegister(): void {
        //
    }

    shape() {
        const a = this.toWorldCoord({ x: this.boundary.x, y: this.boundary.y });
        const b = this.toWorldCoord({ x: this.boundary.x + this.boundary.w, y: this.boundary.y });
        const c = this.toWorldCoord({ x: this.boundary.x, y: this.boundary.y + this.boundary.h });
        const d = this.toWorldCoord({ x: this.boundary.x + this.boundary.w, y: this.boundary.y + this.boundary.h });

        const shape = new Flatten.Polygon();
        shape.addFace([a, b, c, d].map((p) => Flatten.point(p.x, p.y)));
        return shape;
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        sign: boolean
    ): number {
        throw new Error("not implemented");
    }

    getCalculationEntities(context: CalculationContext): DrawableEntityConcrete[] {
        return [];
    }

    onUpdate() {
        if (this.entity && this.entity.key !== this.oldKey) {
            this.oldKey = this.entity.key;
            getFloorPlanRenders(this.entity.key).then((res) => {
                if (res.success) {
                    this.renderIndex = res.data;
                    this.onRedrawNeeded();
                }
            });
        }
    }

    cost(context: CalculationContext): number | null {
        return null;
    }
}
