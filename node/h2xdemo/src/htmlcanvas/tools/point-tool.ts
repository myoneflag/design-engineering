import {Coord} from '@/store/document/types';
import {POINT_TOOL, ToolHandler} from '@/htmlcanvas/tools/tool';
import {UNHANDLED} from '@/htmlcanvas/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {ToolConfig} from '@/store/tools/types';

export default class PointTool implements ToolHandler {

    onPointChosen: (worldCoord: Coord, event: MouseEvent) => void;
    onMove: (worldCoord: Coord, event: MouseEvent) => void;
    onFinish: (interrupted: boolean) => void;
    moved: boolean = false;

    constructor(
        onFinish: (interrupted: boolean) => void,
        onMove: (worldCoord: Coord, event: MouseEvent) => void,
        onPointChosen: (worldCoord: Coord, event: MouseEvent) => void,
    ) {
        this.onPointChosen = onPointChosen;
        this.onMove = onMove;
        this.onFinish = onFinish;
    }

    get config(): ToolConfig {
        return POINT_TOOL;
    }

    onMouseDown(event: MouseEvent, vp: ViewPort) {
        this.moved = false;
        return false;
    }
    onMouseMove(event: MouseEvent, vp: ViewPort) {
        this.moved = true;
        this.onMove(vp.toWorldCoord({x: event.offsetX, y: event.offsetY}), event);
        return UNHANDLED;
    }
    onMouseScroll(event: MouseEvent, vp: ViewPort) {
        return false;
    }
    onMouseUp(event: MouseEvent, vp: ViewPort) {
        if (this.moved) {
            return false;
        } else {
            // End event.
            this.onFinish(false);
            this.onPointChosen(vp.toWorldCoord({x: event.offsetX, y: event.offsetY}), event);
            return true;
        }
    }
}
