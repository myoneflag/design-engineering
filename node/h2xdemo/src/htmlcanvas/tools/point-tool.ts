import {Coord} from '@/store/document/types';
import {POINT_TOOL, ToolHandler} from '@/htmlcanvas/lib/tool';
import {UNHANDLED} from '@/htmlcanvas/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {ToolConfig} from '@/store/tools/types';
import {MainEventBus} from '@/store/main-event-bus';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

export default class PointTool implements ToolHandler {

    onPointChosen: (worldCoord: Coord, event: MouseEvent) => void;
    onMove: (worldCoord: Coord, event: MouseEvent) => void;
    onFinish: (interrupted: boolean, displaced: boolean) => void;
    moved: boolean = false;

    escapeCallback: () => void;

    isFinishing = false;

    constructor(
        onFinish: (interrupted: boolean, displaced: boolean) => void,
        onMove: (worldCoord: Coord, event: MouseEvent) => void,
        onPointChosen: (worldCoord: Coord, event: MouseEvent) => void,
    ) {
        this.onPointChosen = onPointChosen;
        this.onMove = onMove;
        this.onFinish = onFinish;
        this.escapeCallback = () => {
            this.finish(true, false);
        };
        MainEventBus.$on('escape-pressed', this.escapeCallback);
    }

    get config(): ToolConfig {
        return POINT_TOOL;
    }

    onMouseDown(event: MouseEvent, context: CanvasContext) {
        this.moved = false;
        return false;
    }
    onMouseMove(event: MouseEvent, context: CanvasContext) {
        this.moved = true;
        this.onMove(context.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY}), event);
        return UNHANDLED;
    }
    onMouseScroll(event: MouseEvent, context: CanvasContext) {
        return false;
    }

    finish(interrupted: boolean, displaced: boolean) {
        if (!this.isFinishing) {
            this.isFinishing = true;
            MainEventBus.$off('escape-pressed', this.escapeCallback);
            this.onFinish(interrupted, displaced);
        }
    }


    onMouseUp(event: MouseEvent, context: CanvasContext) {
        if (this.moved) {
            return false;
        } else {
            // End event.
            this.onPointChosen(context.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY}), event);
            this.finish(false, false);
            return true;
        }
    }
}
