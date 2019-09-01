import {Coord} from '@/store/document/types';
import Vue from 'vue';
import {DEFAULT_TOOL, POINT_TOOL, ToolHandler} from '@/htmlcanvas/tools/tool';
import DrawingCanvas from '@/components/editor/DrawingCanvas.vue';
import store from '@/store/store';
import {UNHANDLED} from '@/htmlcanvas/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {ToolConfig} from '@/store/tools/types';

export default class PointTool implements ToolHandler {

    onPointChosen: (worldCoord: Coord) => void;
    onFinish: () => void;

    constructor(onFinish: () => void, onPointChosen: (worldCoord: Coord) => void) {
        this.onPointChosen = onPointChosen;
        this.onFinish = onFinish;
    }

    moved: boolean = false;

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
    onMouseUp (event: MouseEvent, vp: ViewPort) {
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
