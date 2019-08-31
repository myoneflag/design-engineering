import Layer from '@/components/canvas/layer';
import {Background, DocumentState} from '@/store/document/types';
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

    onChange: () => any;
    onSelect: (selectId: Background | null) => any;
    onCommit: (selectId: Background) => any;

    constructor(onChange: () => any, onSelect: (selectId: Background | null) => any, onCommit: (selectId: Background) => any) {
        this.onChange = onChange;
        this.onSelect = onSelect;
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

        let existingSids: string[] = [];

        for (const background of doc.drawing.backgrounds) {
            if ( this.sidToObject[background.selectId] === undefined) {
                console.log("Background layer updating dom for thing with center " + background.center.x + " " + background.center.y);
                this.sidToObject[background.selectId] = new BackgroundImage(
                    background,
                    (image: BackgroundImage) => {
                        this.onChange();
                    },
                    (image: BackgroundImage) => {
                        this.updateSelectionBox();
                        this.onChange();
                    },
                    (backgroundImage: BackgroundImage) => {
                        const {x, y} = backgroundImage.toWorldCoord(backgroundImage.background.crop);
                        this.selectedId = background.selectId;
                        this.updateSelectionBox();
                        this.onSelect(backgroundImage.background);
                        return true;
                    },
                    (backgroundImage: BackgroundImage) => {
                        console.log("Background image called my onCommit");
                        this.onCommit(backgroundImage.background);
                    },
                );
                this.sidsInOrder.push(background.selectId);
            } else {
                this.sidToObject[background.selectId].background = background;
                if (background.selectId === this.selectedId) {
                    this.onSelect(background);
                }
            }

            existingSids.push(background.selectId);
        }

        let toDelete: string[] = [];
        for (const selectId in this.sidToObject) {
            if (existingSids.indexOf(selectId) === -1) {
                this.sidsInOrder.splice(this.sidsInOrder.indexOf(selectId), 1);
                if (selectId === this.selectedId) {
                    this.selectedId = null;
                    this.onSelect(null);
                }
                toDelete.push(selectId);
            }
        }
        toDelete.forEach((s) => delete this.sidToObject[s]);

        console.log("Existing: " + JSON.stringify(existingSids));
        console.log("ToDelete: " + JSON.stringify(toDelete));

        this.updateSelectionBox();
    }

    // When the state changes, the selection box needs to follow.
    updateSelectionBox() {
        this.resizeBox = null;
        for (let selectId in this.sidToObject) {
            if (selectId === this.selectedId) {
                const background = this.sidToObject[selectId];
                const {x, y} = background.toWorldCoord(background.background.crop);
                this.resizeBox = new ResizeControl(
                    this.sidToObject[selectId],
                    (e: ResizeControl) =>  this.onSelectedResize(e),
                    (e: ResizeControl) => {
                        // Do deh operation transform.
                        // TODO: Deh operation transform
                        console.log("Resize control called my onCommit");
                        this.onCommit(background.background);
                    },
                );
            }
        }
    }

    // This is when our guy resizes
    onSelectedResize(target: ResizeControl) {
        if (this.selectedId) {
            const background = this.sidToObject[this.selectedId];
            if (background) {/*
                const {x, y} = background.toObjectCoord(target);
                background.background.crop.x = x;
                background.background.crop.y = y;
                background.background.crop.w = target.w;
                background.background.crop.h = target.h;*/
            }
            this.onChange();
        }
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
        this.onSelect(null);
        this.onChange();

        return false;
    }
}
