import {ToolConfig} from '@/store/tools/types';
import {MouseMoveResult} from '@/htmlcanvas/types';
import {ViewPort} from '@/htmlcanvas/viewport';

export interface ToolHandler {
    config: ToolConfig;
    onMouseDown: (event: MouseEvent, vp: ViewPort) => boolean;
    onMouseMove: (event: MouseEvent, vp: ViewPort) => MouseMoveResult;
    onMouseUp: (event: MouseEvent, vp: ViewPort) => boolean;
    onMouseScroll: (event: MouseEvent, vp: ViewPort) => boolean;
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
