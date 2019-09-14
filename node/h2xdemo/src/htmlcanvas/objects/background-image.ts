import {ViewPort} from '@/htmlcanvas/viewport';
import {Background, Coord, DrawableEntity, Rectangle} from '@/store/document/types';
import axios from 'axios';
import * as TM from 'transformation-matrix';
import {matrixScale, parseScale} from '@/htmlcanvas/utils';
import {Sizeable} from '@/htmlcanvas/lib/object-traits/sizeable-object';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import _ from 'lodash';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {Interaction, InteractionType} from '@/htmlcanvas/tools/interaction';

// TODO: Convert into backed drawable object.
export class BackgroundImage extends BackedDrawableObject<Background> implements Sizeable {
    static drawPoint(ctx: CanvasRenderingContext2D, point: Coord, label: string) {
        const scale = matrixScale(ctx.getTransform());


        ctx.fillStyle = '#ff0000';
        ctx.beginPath();

        ctx.arc(point.x, point.y, 12 / scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = Math.floor(14 / scale) + 'pt Helvetica';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, point.x - 5 / scale, point.y + 7 / scale);
    }

    image: HTMLImageElement | null = null;
    imgScale: {x: number, y: number} = {x: 1, y: 1};

    grabbedPoint: [number, number] | null = null;
    grabbedCenterState: [number, number] | null = null;
    grabbedOffsetState: Coord | null = null;
    hasDragged: boolean = false;
    shiftKey: boolean = false;


    prepareDelete(): Array<BackedDrawableObject<DrawableEntity>> {
        throw new Error('Method not implemented.');
    }

    initializeImage(onLoad: (image: BackgroundImage) => any) {
        this.image = null;
        // Try to load the image. If we can't, then show a loading screen.
        const retry = (expectedUri: string) => {
            if (expectedUri !== this.stateObject.uri) {
                // Sometimes, there are a lot of URI switches. We just want to keep the latest one.
                return;
            }

            axios.head(this.stateObject.uri).then(() => {
                    const image = new Image();
                    image.src = this.stateObject.uri;

                    image.onload = () => {
                        this.imgScale = {
                            x: this.width / image.naturalWidth,
                            y: this.height / image.naturalHeight,
                        };

                        // Now now, we all know the scales better be the same
                        if (Math.abs(this.imgScale.x / this.imgScale.y - 1) > 0.05) {
                            throw new Error('Image aspect ratio differs from paper aspect ratio by more than 5%');
                        }

                        this.imgScale.y = this.imgScale.x;

                        this.image = image;
                        onLoad(this);
                    };
                    image.src = this.stateObject.uri;
                },
            ).catch(() => {
                setTimeout(() => {
                    retry(expectedUri);
                }, 1000);
            });
        };

        retry(this.stateObject.uri);
    }

    get position() {
        return TM.transform(
            TM.translate(this.stateObject.center.x, this.stateObject.center.y),
            TM.rotateDEG(this.stateObject.rotation),
            TM.scale(this.stateObject.scaleFactor),
        );
    }

    get width() {
        return this.stateObject.paperSize.widthMM / parseScale(this.stateObject.scaleName);
    }

    get height() {
        return this.stateObject.paperSize.heightMM / parseScale(this.stateObject.scaleName);
    }

    get center() {
        return this.stateObject.center;
    }

    set center(value) {
        this.stateObject.center = value;
    }

    get boundary() {
        return this.stateObject.crop;
    }

    set boundary(value: Rectangle) {
        this.stateObject.crop = value;
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
        active: boolean,
    ) {
        if (this.image) {

            const sx = matrixScale(ctx.getTransform());
            const oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = alpha;
            const {x, y} = {x: (l - this.image.naturalWidth / 2) * this.imgScale.x,
                y: (t - this.image.naturalHeight / 2) * this.imgScale.y};
            const oldCompositeOperation = ctx.globalCompositeOperation;


            const sw = w * this.imgScale.x;
            const sh = h * this.imgScale.y;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x, y, sw, sh);


            // Draw a potentially rotated image
            ctx.drawImage(
                this.image,
                l - this.stateObject.offset.x / this.imgScale.x,
                t - this.stateObject.offset.y / this.imgScale.y,
                w, h,
                x, y,
                sw, sh,
            );

            if (!active) {
                ctx.fillStyle = '#f0f8ff';
                ctx.globalCompositeOperation = 'color';
                ctx.fillRect(
                    x,
                    y,
                    sw,
                    sh,
                );
            }

            ctx.lineWidth = 1 / sx;
            ctx.strokeStyle = '#AAAAAA';
            ctx.beginPath();
            ctx.strokeRect(
                x, y,
                sw,
                sh,
            );
            ctx.stroke();
            ctx.globalAlpha = oldAlpha;
            ctx.globalCompositeOperation = oldCompositeOperation;
        } else {
            throw new Error('Trying to draw natural image without a loaded image');
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
        active: boolean,
    ) {
        // We use an inverse viewport to find the appropriate clip bounds.
        if (this.image) {
            const ivp = new ViewPort(TM.transform(
                TM.scale(this.imgScale.x, this.imgScale.y),
                ),
                this.image.naturalWidth,
                this.image.naturalHeight,
            );

            // Remember that when going from world view to image coordinate view,
            // we must invert the y axis about the center.
            const l = ivp.toScreenCoord({x, y});
            const t = ivp.toScreenCoord({x, y});

            this.naturalClipDraw(ctx, alpha, l.x, t.y,
                w / this.imgScale.x,
                h / this.imgScale.y,
                active,
            );


        } else {

            const oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#AAAAAA';
            ctx.fillRect(
                x, y, w, h,
            );
            ctx.font = '20pt Helvetica';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Loading...', x + (w) / 2, y + (h) / 2 - 20);
            ctx.globalAlpha = oldAlpha;
        }
    }


    // Draw without world space concerns
    drawInternal(ctx: CanvasRenderingContext2D, vp: ViewPort, selected: boolean, active: boolean) {
        if ((selected && active) && this.image) {
            this.naturalClipDraw(
                ctx,
                0.2,
                this.stateObject.offset.x / this.imgScale.x,
                this.stateObject.offset.y / this.imgScale.y,
                this.image.naturalWidth,
                this.image.naturalHeight,
                active,
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
            active,
        );

        if ((selected && active)) {
            if (this.stateObject.pointA) {
                BackgroundImage.drawPoint(ctx, this.stateObject.pointA, 'A');
            }
            if (this.stateObject.pointB) {
                BackgroundImage.drawPoint(ctx, this.stateObject.pointB, 'B');
            }
        }
    }

    /**
     * Event Handlers
     */


    inBounds(objectCoord: Coord): boolean {
        // let clipP = this.toWorldCoord(this.stateObject.crop);

        if (objectCoord.x < this.stateObject.crop.x || objectCoord.y < this.stateObject.crop.y) {
            return false;
        } else if (objectCoord.x <= this.stateObject.crop.x + this.stateObject.crop.w
            && objectCoord.y <= this.stateObject.crop.y + this.stateObject.crop.h) {
            return true;
        }
        return false;
    }


    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        this.shiftKey = event.shiftKey; // shift click moves the pdf but not the crop box or child points.
        const w = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const o = this.toObjectCoord(w);
        if (this.inBounds(o)) {
            this.grabbedPoint = [w.x, w.y];
            this.grabbedCenterState = [this.center.x, this.center.y];
            this.grabbedOffsetState = _.cloneDeep(this.stateObject.offset);
            this.hasDragged = false;
            if (this.onSelect) {
                this.onSelect();
            }
            return true;
        }
        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        if (event.buttons && 1) {
            if (this.grabbedPoint != null && this.grabbedCenterState != null && this.grabbedOffsetState != null) {

                if (!this.hasDragged) {
                    if (event.shiftKey) {
                        this.shiftKey = true;
                    } // Give the user the change to click then shift then drag.
                }
                this.hasDragged = true;

                const w = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
                if (this.shiftKey) {
                    // Move the offset, not the object
                    const o = this.toObjectCoord(w);
                    const grabbedO = this.toObjectCoord({x: this.grabbedPoint[0], y: this.grabbedPoint[1]});

                    this.stateObject.offset.x  = this.grabbedOffsetState.x + o.x - grabbedO.x;
                    this.stateObject.offset.y = this.grabbedOffsetState.y + o.y - grabbedO.y;
                } else {

                    // Move the object
                    this.center.x = this.grabbedCenterState[0] + w.x - this.grabbedPoint[0];
                    this.center.y = this.grabbedCenterState[1] + w.y - this.grabbedPoint[1];
                }


                this.onChange();
                return {handled: true, cursor: 'Move'};
            } else {
                return UNHANDLED;
            }
        } else {
            if (this.grabbedCenterState != null || this.grabbedPoint != null) {
                this.onCommit();
            }
            this.grabbedCenterState = null;
            this.grabbedPoint = null;
            this.grabbedOffsetState = null;
            this.hasDragged = false;
            return UNHANDLED;
        }
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        if (this.grabbedPoint || this.grabbedCenterState) {
            this.grabbedPoint = null;
            this.grabbedCenterState = null;
            this.hasDragged = false;
            this.onChange();
            this.onCommit();
            return true;
        }
        return false;
    }

    offerInteraction(interaction: Interaction): boolean {
        switch (interaction.type) {
            case InteractionType.INSERT:
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
                return true;
            default:
                return false;
        }
    }

    protected refreshObjectInternal(obj: Background, old: Background): void {
        if (old) {
            if (this.stateObject.uri !== old.uri) {
                this.initializeImage(() => {
                    this.onChange();
                });
            }
        } else {
            this.initializeImage(() => {
                this.onChange();
            });
        }
    }

}
