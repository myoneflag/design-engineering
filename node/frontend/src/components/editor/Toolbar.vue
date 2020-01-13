import { GridLineMode } from "../../store/document/types";
<template>
    <div class="toolbar">
        <div class="container">
            <b-row>
                <b-col>
                    <b-button-group>
                        <template v-for="tool in TOOLBAR_BUTTONS" v-text="tool.tooltip">
                            <b-button
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
                        <b-tooltip :target="tool.name + '_btn'" :title="tool.tooltip"></b-tooltip>
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
    import { assertUnreachable } from "../../config";

    @Component({
    props: {
        currentToolConfig: Object,
        onToolClick: Function,
        onFitToViewClick: Function,
        onChange: Function,
    }
})
export default class Toolbar extends Vue {
    TOOLBAR_BUTTONS: ToolConfig[] = [DEFAULT_TOOL];

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
        return this.$store.getters['document/document'];
    }


}
</script>

<style lang="less">
.toolbar {
    position: fixed;

    left: 50%;
    transform: translate(-50%, 0);
    bottom: 20px;
}

.toolBtn {
    font-size: 12px;
    background-color: white;
    width: 50px;
    height: 40px;
}
</style>
