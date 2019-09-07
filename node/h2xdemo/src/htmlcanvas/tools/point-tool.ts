import {Coord} from '@/store/document/types';
import {POINT_TOOL, ToolHandler} from '@/htmlcanvas/tools/tool';
import {UNHANDLED} from '@/htmlcanvas/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {ToolConfig} from '@/store/tools/types';

export default class PointTool implements ToolHandler {

    onPointChosen: (worldCoord: Coord) => void;
    onFinish: () => void;
    moved: boolean = false;

    constructor(onFinish: () => void, onPointChosen: (worldCoord: Coord) => void) {
        this.onPointChosen = onPointChosen;
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
            this.onFinish();
            this.onPointChosen(vp.toWorldCoord({x: event.offsetX, y: event.offsetY}));
            return true;
        }
    }
}
