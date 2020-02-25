import { ToolHandler } from "../../../src/htmlcanvas/lib/tool";
import { UNHANDLED } from "../../../src/htmlcanvas/types";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { ToolConfig } from "../../../src/store/tools/types";
import { MainEventBus } from "../../../src/store/main-event-bus";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import { KeyCode, keyCode2Image, matrixScale, parseScale } from "../../../src/htmlcanvas/utils";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { Coord, Rectangle } from "../../../../common/src/api/document/drawing";
import { PAPER_SIZES } from "../../../../common/src/api/paper-config";
import { EPS } from "../../calculations/pressure-drops";

export const MARGIN_SIZE_MM = 15;
export const INFO_BAR_SIZE_MM = 90;

export default class PdfSnapshotTool implements ToolHandler {
    get config(): ToolConfig {
        return {
            name: "point",
            defaultCursor: "auto",
            focusSelectedObject: false,
            icon: "dot-circle",
            modesEnabled: false,
            modesVisible: false,
            text: "Position the screen",
            tooltip: "Take PDF Snapshot",
            propertiesEnabled: false,
            propertiesVisible: false,
            paperSnapshotTopBar: true,
            toolbarEnabled: false,
            toolbarVisible: false,
            preventZooming: true
        };
    }

    static getScreenPaperScale(context: DrawingContext): number {
        const sw = context.ctx.canvas.width;
        const sh = context.ctx.canvas.height;
        const paperSize = context.doc.uiState.exportSettings.paperSize;
        return Math.min((sw - 50) / paperSize.widthMM, (sh - 250) / paperSize.heightMM);
    }

    static getScreenMarginRect(context: DrawingContext): Rectangle {
        const sw = context.ctx.canvas.width;
        const sh = context.ctx.canvas.height;

        const paperSize = context.doc.uiState.exportSettings.paperSize;

        const scale = PdfSnapshotTool.getScreenPaperScale(context);
        const rw = scale * paperSize.widthMM;
        const rh = scale * paperSize.heightMM;

        const bw = MARGIN_SIZE_MM * scale;

        const top = (sh - rh) / 2;
        const left = (sw - rw) / 2;

        return {
            x: left + bw,
            y: top + bw,
            w: rw - bw * 2,
            h: rh - bw * 2
        };
    }

    static getWorldMarginRect(context: DrawingContext): Rectangle {
        const sr = this.getScreenMarginRect(context);
        const tl = context.vp.toWorldCoord({ x: sr.x, y: sr.y });
        const br = context.vp.toWorldCoord({ x: sr.x + sr.w, y: sr.y + sr.h });
        return {
            x: tl.x,
            y: tl.y,
            w: br.x - tl.x,
            h: br.y - tl.y
        };
    }

    escapeCallback: () => void;
    isFinishing = false;
    lastScreenMarginRect: Rectangle;

    constructor() {
        this.escapeCallback = () => {
            this.finish(true, false);
        };
        MainEventBus.$on("escape-pressed", this.escapeCallback);
    }

    beforeDraw(context: DrawingContext) {
        // fit the viewport to the paper size.
        const scale = parseScale(context.doc.uiState.exportSettings.scale);
        const paperSize = context.doc.uiState.exportSettings.paperSize;

        const viewWidthPaperMM = paperSize.widthMM - MARGIN_SIZE_MM * 2 - INFO_BAR_SIZE_MM;
        const viewWorldMM = viewWidthPaperMM / scale;
        const viewWidthPx = PdfSnapshotTool.getScreenPaperScale(context) * viewWidthPaperMM;

        const oldScreenScale = context.vp.screenScale;
        const newScreenScale = 0.9 ** context.doc.uiState.exportSettings.detail;

        if (Math.abs(oldScreenScale - newScreenScale) > EPS) {
            MainEventBus.$emit("set-detail-scale", newScreenScale);
        }

        const vpScale = viewWorldMM / viewWidthPx;
        const s = matrixScale(context.vp.screenToSurface);
        if (Math.abs(s - vpScale) > EPS) {
            MainEventBus.$emit("set-scale", vpScale);
        }
    }

    draw(context: DrawingContext) {
        // paper width and stuff
        const { ctx, vp } = context;
        const sw = ctx.canvas.width;
        const sh = ctx.canvas.height;

        ctx.resetTransform();

        const paperSize = context.doc.uiState.exportSettings.paperSize;

        const scale = PdfSnapshotTool.getScreenPaperScale(context);

        const rw = scale * paperSize.widthMM;
        const rh = scale * paperSize.heightMM;

        const top = (sh - rh) / 2;
        const left = (sw - rw) / 2;

        // Draw border whites
        const bw = MARGIN_SIZE_MM * scale;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(left, top, rw, bw);
        ctx.fillRect(left, top + rh - bw, rw, bw);
        ctx.fillRect(left, top + bw, bw, rh - 2 * bw);
        ctx.fillRect(left + rw - bw, top + bw, bw, rh - 2 * bw);

        const infoWidth = scale * INFO_BAR_SIZE_MM;

        // right title bar
        ctx.fillRect(left + rw - bw - infoWidth, top + bw, infoWidth, rh - bw * 2);

        // Draw outlines. Margin
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        const mr = PdfSnapshotTool.getScreenMarginRect(context);
        ctx.strokeRect(left + bw, top + bw, rw - bw * 2, rh - bw * 2);

        // Paper outline
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#000000";
        ctx.strokeRect(left, top, rw, rh);

        ctx.closePath();

        // Info bar
        ctx.beginPath();
        ctx.moveTo(left + rw - bw - infoWidth, top + bw);
        ctx.lineTo(left + rw - bw - infoWidth, top + rh - bw);
        ctx.stroke();

        this.lastScreenMarginRect = {
            x: mr.x,
            y: mr.y,
            w: mr.w - infoWidth,
            h: mr.h
        };
    }

    onMouseDown(event: MouseEvent, context: CanvasContext) {
        return false;
    }
    onMouseMove(event: MouseEvent, context: CanvasContext) {
        return UNHANDLED;
    }
    onMouseScroll(event: MouseEvent, context: CanvasContext) {
        return false;
    }

    finish(interrupted: boolean, displaced: boolean) {
        if (!this.isFinishing) {
            this.isFinishing = true;
            MainEventBus.$off("escape-pressed", this.escapeCallback);
        }
    }

    onMouseUp(event: MouseEvent, context: CanvasContext) {
        return false;
    }

    refresh() {}
}

export interface KeyHandler {
    name: string;
    fn(event: KeyboardEvent, onRefresh: () => void): void;
}
