import { ToolHandler } from "../../../src/htmlcanvas/lib/tool";
import { UNHANDLED } from "../../../src/htmlcanvas/types";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { ToolConfig } from "../../../src/store/tools/types";
import { MainEventBus } from "../../../src/store/main-event-bus";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import { KeyCode, keyCode2Image } from "../../../src/htmlcanvas/utils";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { Coord } from "../../../../common/src/api/document/drawing";

export default class PointTool implements ToolHandler {
    onPointChosen: (worldCoord: Coord, event: MouseEvent) => void;
    onMove: (worldCoord: Coord, event: MouseEvent) => void;
    onFinish: (interrupted: boolean, displaced: boolean) => void;
    keyHandlers: Array<[KeyCode, KeyHandler]>;
    moved: boolean = false;
    onKeyDown: (event: KeyboardEvent) => void;

    escapeCallback: () => void;
    clickActionName: string;

    isFinishing = false;
    images: HTMLImageElement[] = [];
    getInfoText: (() => string[]) | undefined;

    lastEvent!: MouseEvent;
    lastWc!: Coord;

    constructor(
        onFinish: (interrupted: boolean, displaced: boolean) => void,
        onMove: (worldCoord: Coord, event: MouseEvent) => void,
        onPointChosen: (worldCoord: Coord, event: MouseEvent) => void,
        clickActionName: string,
        keyHandlers: Array<[KeyCode, KeyHandler]> = [],
        getInfoText?: () => string[]
    ) {
        this.onPointChosen = onPointChosen;
        this.onMove = onMove;
        this.onFinish = onFinish;
        this.escapeCallback = () => {
            this.finish(true, false);
        };
        this.onKeyDown = (event: KeyboardEvent) => {
            this.keyHandlers.forEach(([k, h]) => {
                if (k === event.keyCode) {
                    h.fn(event, () => this.refresh());
                }
            });
        };
        this.getInfoText = getInfoText;
        this.keyHandlers = keyHandlers;
        MainEventBus.$on("escape-pressed", this.escapeCallback);
        MainEventBus.$on("keydown", this.onKeyDown);
        this.clickActionName = clickActionName;
    }

    draw(context: DrawingContext) {
        const { ctx, vp } = context;

        let top = vp.height - 50 - this.keyHandlers.length * 40;
        ctx.fillStyle = "#000";
        ctx.font = "18px " + DEFAULT_FONT_NAME;

        if (this.getInfoText) {
            const status = this.getInfoText();
            let stop = top - 40 * status.length;
            status.forEach((s) => {
                ctx.fillText(s, 30, stop);
                stop += 40;
            });
        }

        this.keyHandlers.forEach(([k, h]) => {
            const img = keyCode2Image(k);
            const width = img.width;
            const height = img.height;
            const scale = Math.max(35 / width, 35 / height);
            ctx.drawImage(keyCode2Image(k), 30, top, width * scale, height * scale);
            ctx.fillText(h.name, 40 + width * scale, top + 20);
            top += 40;
        });
    }

    beforeDraw(context: DrawingContext): void {
        // nop
    }

    get config(): ToolConfig {
        return {
            name: "point",
            defaultCursor: "Crosshair",
            focusSelectedObject: true,
            icon: "dot-circle",
            modesEnabled: false,
            modesVisible: false,
            text: "Select a Point",
            tooltip: "point",
            propertiesEnabled: false,
            propertiesVisible: false,
            toolbarEnabled: true,
            toolbarVisible: true
        };
    }

    onMouseDown(event: MouseEvent, context: CanvasContext) {
        this.moved = false;
        return false;
    }
    onMouseMove(event: MouseEvent, context: CanvasContext) {
        this.moved = true;
        this.lastEvent = event;
        this.lastWc = context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
        this.onMove(this.lastWc, event);
        return UNHANDLED;
    }
    onMouseScroll(event: MouseEvent, context: CanvasContext) {
        return false;
    }

    finish(interrupted: boolean, displaced: boolean) {
        if (!this.isFinishing) {
            this.isFinishing = true;
            MainEventBus.$off("escape-pressed", this.escapeCallback);
            MainEventBus.$off("keydown", this.onKeyDown);
            this.onFinish(interrupted, displaced);
        }
    }

    onMouseUp(event: MouseEvent, context: CanvasContext) {
        if (this.moved) {
            return false;
        } else {
            // End event.
            this.onPointChosen(context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY }), event);
            this.finish(false, false);
            return true;
        }
    }

    refresh() {
        this.onMove(this.lastWc, this.lastEvent);
    }
}

export interface KeyHandler {
    name: string;
    fn(event: KeyboardEvent, onRefresh: () => void): void;
}
