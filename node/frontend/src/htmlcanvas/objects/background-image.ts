import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { Coord, Rectangle } from "../../../src/store/document/types";
import axios from "axios";
import * as TM from "transformation-matrix";
import { matrixScale, parseScale } from "../../../src/htmlcanvas/utils";
import { Sizeable } from "../../../src/htmlcanvas/lib/object-traits/sizeable-object";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DrawingContext} from "../../../src/htmlcanvas/lib/types";
import { BackgroundEntity } from "../../../src/store/document/entities/background-entity";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../src/store/document/entities/types";
import Flatten from "@flatten-js/core";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { DrawableEntityConcrete } from "../../../src/store/document/entities/concrete-entity";
import { cloneSimple } from "../../../src/lib/utils";
import { DraggableObject } from "../../../src/htmlcanvas/lib/object-traits/draggable-object";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { DrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { GlobalStore } from "../lib/global-store";

export const imageStore = new Map<string, HTMLImageElement>();

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

    image!: HTMLImageElement | null;
    imgScale!: { x: number; y: number };

    grabbedPoint: [number, number] | null = null;
    grabbedCenterState: [number, number] | null = null;
    grabbedOffsetState: Coord | null = null;
    hasDragged: boolean = false;
    shiftKey: boolean = false;

    oldUri: string = "";

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
        this.objectStore.forEach((v) => {
            if (v.entity.parentUid === this.entity.uid) {
                result.push(...v.prepareDelete(context));
            }
        });
        return result;
    }

    initializeImage(onLoad: (image: BackgroundImage) => any) {
        if (this.objectStore instanceof GlobalStore) {
            // this is a ghost
            return;
        }

        this.image = null;

        // Try to load the image. If we can't, then show a loading screen.
        const retry = (expectedUri: string) => {
            if (expectedUri !== this.entity.uri) {
                // Sometimes, there are a lot of URI switches. We just want to keep the latest one.
                return;
            }

            if (imageStore.has(this.entity.uri)) {
                this.image = imageStore.get(this.entity.uri)!;
                if (this.image.complete && this.image.naturalWidth) {
                    this.imgScale = {
                        x: this.width / this.image.naturalWidth,
                        y: this.height / this.image.naturalHeight
                    };

                    // Now now, we all know the scales better be the same
                    if (Math.abs(this.imgScale.x / this.imgScale.y - 1) > 0.05) {
                        throw new Error("Image aspect ratio differs from paper aspect ratio by more than 5%");
                    }

                    this.imgScale.y = this.imgScale.x;
                    onLoad(this);
                    return;
                } else {
                    throw new Error("Not loaded image in cache :/ don't do that");
                }
            }

            axios
                .head(this.entity.uri)
                .then(() => {
                    const image = new Image();

                    image.onload = () => {
                        imageStore.set(this.entity.uri, image);
                        this.imgScale = {
                            x: this.width / image.naturalWidth,
                            y: this.height / image.naturalHeight
                        };

                        // Now now, we all know the scales better be the same
                        if (Math.abs(this.imgScale.x / this.imgScale.y - 1) > 0.05) {
                            throw new Error("Image aspect ratio differs from paper aspect ratio by more than 5%");
                        }

                        this.imgScale.y = this.imgScale.x;

                        this.image = image;
                        onLoad(this);
                    };
                    image.src = this.entity.uri;
                })
                .catch((e) => {
                    setTimeout(() => {
                        retry(expectedUri);
                    }, 1000);
                });
        };

        retry.bind(this)(this.entity.uri);
    }

    /**
     * Draw with natural clip
     */
    naturalClipDraw(
        ctx: CanvasRenderingContext2D,
        alpha: number,
        l: number,
        t: number,
        w: number,
        h: number,
        active: boolean
    ) {
        if (this.image) {
            const sx = matrixScale(ctx.getTransform());
            const oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = alpha;
            const { x, y } = {
                x: (l - this.image.naturalWidth / 2) * this.imgScale.x,
                y: (t - this.image.naturalHeight / 2) * this.imgScale.y
            };
            const oldCompositeOperation = ctx.globalCompositeOperation;

            const sw = w * this.imgScale.x;
            const sh = h * this.imgScale.y;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x, y, sw, sh);

            // Draw a potentially rotated image
            ctx.drawImage(
                this.image,
                l - this.entity.offset.x / this.imgScale.x,
                t - this.entity.offset.y / this.imgScale.y,
                w,
                h,
                x,
                y,
                sw,
                sh
            );

            if (!active) {
                ctx.fillStyle = "#f0f8ff";
                ctx.globalCompositeOperation = "color";
                ctx.fillRect(x, y, sw, sh);
            }

            ctx.lineWidth = 1 / sx;
            ctx.strokeStyle = "#AAAAAA";
            ctx.beginPath();
            ctx.strokeRect(x, y, sw, sh);
            ctx.stroke();
            ctx.globalAlpha = oldAlpha;
            ctx.globalCompositeOperation = oldCompositeOperation;
        } else {
            throw new Error("Trying to draw natural image without a loaded image");
        }
    }

    objectClipDraw(
        ctx: CanvasRenderingContext2D,
        alpha: number,
        x: number,
        y: number,
        w: number,
        h: number,
        selected: boolean,
        active: boolean
    ) {
        // We use an inverse viewport to find the appropriate clip bounds.
        if (this.image) {
            const ivp = new ViewPort(
                TM.transform(TM.scale(this.imgScale.x, this.imgScale.y)),
                this.image.naturalWidth,
                this.image.naturalHeight
            );

            // Remember that when going from world view to image coordinate view,
            // we must invert the y axis about the center.
            const l = ivp.toScreenCoord({ x, y });
            const t = ivp.toScreenCoord({ x, y });

            this.naturalClipDraw(ctx, alpha, l.x, t.y, w / this.imgScale.x, h / this.imgScale.y, active);
        } else {
            const oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#AAAAAA";
            ctx.fillRect(x, y, w, h);
            ctx.font = "20pt " + DEFAULT_FONT_NAME;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText("Loading...", x + w / 2, y + h / 2 - 20);
            ctx.globalAlpha = oldAlpha;
        }
    }

    // Draw without world space concerns
    drawInternal(context: DrawingContext, { selected, active }: DrawingArgs) {
        const { ctx, vp } = context;
        if (selected && active && this.image) {
            this.naturalClipDraw(
                ctx,
                0.2,
                this.entity.offset.x / this.imgScale.x,
                this.entity.offset.y / this.imgScale.y,
                this.image.naturalWidth,
                this.image.naturalHeight,
                active
            );
        }

        let alpha = 1;
        if (selected && this.hasDragged) {
            alpha = 0.6;
        }

        this.objectClipDraw(
            ctx,
            alpha,
            this.boundary.x,
            this.boundary.y,
            this.boundary.w,
            this.boundary.h,
            selected,
            active
        );

        if (selected && active) {
            if (this.entity.pointA) {
                this.drawPoint(context, this.entity.pointA, "A");
            }
            if (this.entity.pointB) {
                this.drawPoint(context, this.entity.pointB, "B");
            }
        }
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

                this.onChange();
                return { handled: true, cursor: "Move" };
            } else {
                return UNHANDLED;
            }
        } else {
            if (this.grabbedCenterState != null || this.grabbedPoint != null) {
                this.onCommit(event);
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
            this.onChange();
            this.onCommit(event);
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
        if (this.entity && this.entity.uri !== this.oldUri) {
            this.initializeImage(() => {
                this.onChange();
            });
            this.oldUri = this.entity.uri;
        }
    }
}
