import {ToolConfig} from '../../../src/store/tools/types';
import {MouseMoveResult} from '../../../src/htmlcanvas/types';
import {ViewPort} from '../../../src/htmlcanvas/viewport';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {DrawingContext} from '../../../src/htmlcanvas/lib/types';

export interface ToolHandler {
    config: ToolConfig;
    onMouseDown: (event: MouseEvent, context: CanvasContext) => boolean;
    onMouseMove: (event: MouseEvent, context: CanvasContext) => MouseMoveResult;
    onMouseUp: (event: MouseEvent, context: CanvasContext) => boolean;
    onMouseScroll: (event: MouseEvent, context: CanvasContext) => boolean;

    finish: (interrupted: boolean, displaced: boolean) => void;

    draw(context: DrawingContext): void;
}

export const DEFAULT_TOOL: ToolConfig = {
    name: 'default',
    defaultCursor: 'Default',
    focusSelectedObject: false,
    icon: 'mouse-pointer',
    modesEnabled: true,
    modesVisible: true,
    text: 'Default Mode',
    tooltip: 'Default',
    propertiesEnabled: true,
    propertiesVisible: true,
    toolbarEnabled: true,
    toolbarVisible: true,
};

export const POINT_TOOL: ToolConfig = {
    name: 'point',
    defaultCursor: 'Crosshair',
    focusSelectedObject: true,
    icon: 'dot-circle',
    modesEnabled: false,
    modesVisible: false,
    text: 'Select a Point',
    tooltip: 'point',
    propertiesEnabled: false,
    propertiesVisible: false,
    toolbarEnabled: true,
    toolbarVisible: true,
};
