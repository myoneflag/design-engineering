import { GridLineMode } from "../../store/document/types";
<template>
    <div class="toolbar">
        <div>
            <b-row>
                <b-col v-if="profile">
                    <b-button-group>
                        <b-button
                            variant="outline-dark"
                            v-b-tooltip.hover="{ title: 'Undo' }"
                            class="toolBtn"
                            :disabled="document.undoIndex <= 0"
                            @click="onUndo"
                        >
                            <v-icon name="undo" scale="1.5" />
                        </b-button>
                        <b-button
                            variant="outline-dark"
                            v-b-tooltip.hover="{ title: 'Redo' }"
                            class="toolBtn"
                            :disabled="document.undoIndex >= document.undoStack.length"
                            @click="onRedo"
                        >
                            <v-icon name="redo" scale="1.5" />
                        </b-button>
                    </b-button-group>
                </b-col>

                <b-col v-if="profile">
                    <b-button-group>
                        <b-button
                            variant="outline-dark"
                            v-b-tooltip.hover="{ title: 'Copy' }"
                            class="toolBtn"
                            :disabled="this.$props.showExport"
                            @click="onCopy"
                        >
                            <v-icon name="copy" scale="1.5" />
                        </b-button>
                        <b-button
                            variant="outline-dark"
                            v-b-tooltip.hover="{ title: 'Paste' }"
                            class="toolBtn"
                            :disabled="this.$props.showExport"
                            @click="onPaste"
                        >
                            <v-icon name="paste" scale="1.5" />
                        </b-button>
                    </b-button-group>
                </b-col>

                <b-col>
                    <b-button-group>
                        <template v-for="tool in TOOLBAR_BUTTONS" v-text="tool.tooltip">
                            <b-button
                                :key="tool.name"
                                class="toolBtn"
                                :id="tool.name + '_btn'"
                                size="large"
                                variant="outline-dark"
                                :pressed="currentToolConfig.name === tool.name"
                                @click="toolBtnClick(tool)"
                            >
                                <v-icon :name="tool.icon" scale="1.5" />
                            </b-button>
                        </template>
                    </b-button-group>

                    <template v-for="tool in TOOLBAR_BUTTONS" v-text="tool.tooltip">
                        <b-tooltip 
                            :key="tool.name"
                            :target="tool.name + '_btn'" :title="tool.tooltip"
                        ></b-tooltip>
                    </template>
                </b-col>
                <b-col>
                    <b-button-group>
                        <b-button
                            variant="outline-dark"
                            v-b-tooltip.hover="{ title: 'Fit to View' }"
                            class="toolBtn"
                            @click="onFitToViewClick"
                        >
                            <v-icon name="expand" scale="1.5" />
                        </b-button>
                        <b-button
                            variant="outline-dark"
                            v-b-tooltip.hover="{ title: 'Switch Grid Lines' }"
                            class="toolBtn"
                            :pressed="document.uiState.gridLines !== GridLineMode.NONE"
                            @click="switchGridLines"
                        >
                            <v-icon name="border-all" scale="1.5" />
                        </b-button>
                    </b-button-group>
                </b-col>
            </b-row>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DEFAULT_TOOL } from "../../htmlcanvas/lib/tool";
import { ToolConfig } from "../../../src/store/tools/types";
import { DocumentState, GridLineMode } from "../../store/document/types";
import { assertUnreachable } from "../../../../common/src/api/config";
import { User } from "../../../../common/src/models/User";
import { MainEventBus } from "../../store/main-event-bus";

@Component({
    props: {
        currentToolConfig: Object,
        onToolClick: Function,
        onFitToViewClick: Function,
        onChange: Function,
        onUndo: Function,
        onRedo: Function,
        onCopy: Function,
        onPaste: Function,
        showExport: Boolean
    }
})
export default class Toolbar extends Vue {
    TOOLBAR_BUTTONS: ToolConfig[] = [DEFAULT_TOOL];

    cancel() {
        MainEventBus.$emit("set-tool-handler", null);
    }
    
    get GridLineMode() {
        return GridLineMode;
    }

    toolBtnClick(tool: ToolConfig) {
        if (this.$props.onToolClick) {
            this.$props.onToolClick(tool);
        }
    }

    switchGridLines() {
        switch (this.document.uiState.gridLines) {
            case GridLineMode.NONE:
                this.document.uiState.gridLines = GridLineMode.ORIGIN;
                break;
            case GridLineMode.ORIGIN:
                this.document.uiState.gridLines = GridLineMode.FULL;
                break;
            case GridLineMode.FULL:
                this.document.uiState.gridLines = GridLineMode.NONE;
                break;
            default:
                assertUnreachable(this.document.uiState.gridLines);
        }
        this.$props.onChange();
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }
}
</script>

<style lang="less">
.toolbar {
    position: fixed;
    left: 44%;
    -webkit-transform: translate(-50%, 0);
    transform: translate(-50%, 0);
    bottom: 20px;
    width: auto;
}

.toolBtn {
    font-size: 12px;
    background-color: white;
    width: 50px;
    height: 40px;
}
</style>
