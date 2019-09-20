import {Coord} from '@/store/document/types';
import {POINT_TOOL, ToolHandler} from '@/htmlcanvas/lib/tool';
import {UNHANDLED} from '@/htmlcanvas/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {ToolConfig} from '@/store/tools/types';
import {MainEventBus} from '@/store/main-event-bus';

export default class PointTool implements ToolHandler {

    onPointChosen: (worldCoord: Coord, event: MouseEvent) => void;
    onMove: (worldCoord: Coord, event: MouseEvent) => void;
    onFinish: (interrupted: boolean) => void;
    moved: boolean = false;

    escapeCallback: () => void;

    constructor(
        onFinish: (interrupted: boolean) => void,
        onMove: (worldCoord: Coord, event: MouseEvent) => void,
        onPointChosen: (worldCoord: Coord, event: MouseEvent) => void,
    ) {
        this.onPointChosen = onPointChosen;
        this.onMove = onMove;
        this.onFinish = onFinish;
        this.escapeCallback = () => {
            this.finish(true);
        };
        MainEventBus.$on('escape-pressed', this.escapeCallback);
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

    finish(interrupted: boolean) {
        MainEventBus.$off('escape-pressed', this.escapeCallback);
        this.onFinish(interrupted);
    }


    onMouseUp(event: MouseEvent, vp: ViewPort) {
        if (this.moved) {
            return false;
        } else {
            // End event.
            this.finish(false);
            this.onPointChosen(vp.toWorldCoord({x: event.offsetX, y: event.offsetY}), event);
            return true;
        }
    }
}
