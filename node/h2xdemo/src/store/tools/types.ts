export default interface ToolState {
    currentTool: ToolConfig;
}

/**
 * Lists all the configurable parameters of tools
 */
export interface ToolConfig {
    name: string;
    text: string;
    tooltip: string;
    icon: string;

    modesVisible: boolean;
    modesEnabled: boolean;

    toolbarVisible: boolean;
    toolbarEnabled: boolean;

    propertiesVisible:boolean;
    propertiesEnabled: boolean;

    focusSelectedObject: boolean;

    defaultCursor: string;
}
