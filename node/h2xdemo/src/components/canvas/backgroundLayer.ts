import Layer from '@/components/canvas/layer';
import {DocumentState} from '@/store/document/types';
import {ViewPort} from '@/Drawings/2DViewport';
import {BackgroundImage} from '@/Drawings/BackgroundImage';
import axios from 'axios';
import {parseScale} from '@/Drawings/Utils';
import {ResizeControl} from '@/Drawings/ResizeControl';

export default class BackgroundLayer implements Layer {
    sidToObject: { [uuid: string]: BackgroundImage } = {};
    sidsInOrder: string[] = [];
    selectedId: string | null = null;
    resizeBox: ResizeControl | null = null;

    onLoad: (selectId: string) => any;
    onChange: (selectId: string) => any;
    onCommit: (selectId: string) => any;

    constructor(onLoad: (selectId: string) => any, onChange: (selectId: string) => any, onCommit: (selectId: string) => any) {
        this.onLoad = onLoad;
        this.onChange = onChange;
        this.onCommit = onCommit;
    }


    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, active: boolean) {
        // draw selected one on top.
        this.sidsInOrder.forEach((selectId) => {
            if (this.sidToObject[selectId]) {
                if (selectId !== this.selectedId || !active || !this.sidToObject[selectId].hasDragged) {
                    const bgi = this.sidToObject[selectId];
                    bgi.draw(ctx, vp, this.selectedId === selectId, active);
                }
            }
        });

        if (active) {
            this.sidsInOrder.forEach((selectId) => {
                if (this.sidToObject[selectId] && selectId === this.selectedId && this.sidToObject[selectId].hasDragged) {
                    const bgi = this.sidToObject[selectId];
                    bgi.draw(ctx, vp, this.selectedId === selectId, active);
                }
            });
        }
    }

    update(doc: DocumentState) {
        this.resizeBox = null; // We regenerate this if needed.

        for (const background of doc.drawing.backgrounds) {
            if ( this.sidToObject[background.selectId] === undefined) {
                console.log("Background layer updating dom for thing with center " + background.center.x + " " + background.center.y);
                this.sidToObject[background.selectId] = new BackgroundImage(
                    background.uri,
                    {x: Number(background.center.x), y: Number(background.center.y)},
                    {
                        w: background.paperSize.width / parseScale(background.scale),
                        h: background.paperSize.height / parseScale(background.scale),
                    },
                    (image: BackgroundImage) => {
                        this.onLoad(background.selectId);
                    },
                    (image: BackgroundImage) => {
                        this.updateSelectionBox();
                        this.onChange(background.selectId);
                    },
                    (backgroundImage: BackgroundImage) => {
                        const {x, y} = backgroundImage.toWorldCoord(backgroundImage.clipOs);
                        this.selectedId = background.selectId;
                        this.updateSelectionBox();
                        this.onChange(this.selectedId);
                        return true;
                    },
                    (backgroundImage: BackgroundImage) => {
                        console.log("Background image called my onCommit");
                        this.onCommit(background.selectId);
                    },
                );
                this.sidsInOrder.push(background.selectId);
            } else {
                this.sidToObject[background.selectId].center = background.center;
                this.sidToObject[background.selectId].clipOs = background.crop;
            }
        }

        this.updateSelectionBox();
    }

    // When the state changes, the selection box needs to follow.
    updateSelectionBox() {
        this.resizeBox = null;
        for (let selectId in this.sidToObject) {
            if (selectId === this.selectedId) {
                const background = this.sidToObject[selectId];
                const {x, y} = background.toWorldCoord(background.clipOs);
                this.resizeBox = new ResizeControl(
                    x,
                    y,
                    background.clipOs.w,
                    background.clipOs.h,
                    (e: ResizeControl) =>  this.onSelectedResize(e),
                    (e: ResizeControl) => {
                        // Do deh operation transform.
                        // TODO: Deh operation transform
                        console.log("Resize control called my onCommit");
                        this.onCommit(selectId);
                    },
                );
            }
        }
    }

    // This is when our guy resizes
    onSelectedResize(target: ResizeControl) {
        if (this.selectedId) {
            const background = this.sidToObject[this.selectedId];
            if (background) {
                const {x, y} = background.toObjectCoord(target);
                background.clipOs.x = x;
                background.clipOs.y = y;
                background.clipOs.w = target.w;
                background.clipOs.h = target.h;
            }
        }
        this.onChange(this.selectedId as string);
    }

    drawSelectionLayer(ctx: CanvasRenderingContext2D, vp: ViewPort) {
        if (this.resizeBox) {
            this.resizeBox.draw(ctx, vp);
        }
    }

    onMouseDown(event: MouseEvent, vp: ViewPort) {
        if (this.resizeBox) {
            if (this.resizeBox.onMouseDown(event, vp)) {
                return true;
            }
        }

        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.sidsInOrder[i];
            if (this.sidToObject[selectId]) {
                const background = this.sidToObject[selectId];
                if (background.onMouseDown(event, vp)) {
                    return true;
                }
            }
        }

        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort) {
        if (this.resizeBox) {
            if (this.resizeBox.onMouseMove(event, vp)) {
                return true;
            }
        }

        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.sidsInOrder[i];
            if (this.sidToObject[selectId]) {
                const background = this.sidToObject[selectId];
                if (background.onMouseMove(event, vp)) {
                    return true;
                }
            }
        }

        return false;
    }


    onMouseUp(event: MouseEvent, vp: ViewPort) {
        console.log("Background layer received an up event");
        if (this.resizeBox) {
            if (this.resizeBox.onMouseUp(event, vp)) {
                return true;
            }
        }

        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.sidsInOrder[i];
            if (this.sidToObject[selectId]) {
                const background = this.sidToObject[selectId];
                if (background.onMouseUp(event, vp)) {
                    return true;
                }
            }
        }

        this.selectedId = null;
        this.resizeBox = null;
        console.log("Background layer has the up event");
        this.onChange('');

        return false;
    }
}
