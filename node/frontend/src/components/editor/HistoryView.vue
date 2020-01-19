import { DrawingMode } from "../../htmlcanvas/types";
<template>
    <div>

                <b-card class="historySidePanel">
                    <b-card-text>
                        <b>Change #{{ +document.uiState.historyIndex + 1 }} of {{ discreteHistory.length }}</b>
                    </b-card-text>
                    <b-btn-group>
                        <b-btn @click="onBB">
                            <<
                        </b-btn>
                        <b-btn @click="onB">
                            <
                        </b-btn>
                        <b-btn @click="onF">
                            >
                        </b-btn>
                        <b-btn @click="onFF">
                            >>
                        </b-btn>
                    </b-btn-group>
                    <b-card-text>
                        <template v-if="document.uiState.historyIndex >= 0 && document.uiState.historyIndex < discreteHistory">
                            <p>Date: {{
                                discreteHistory[document.uiState.historyIndex][0].dateTime ?
                                new Date(discreteHistory[document.uiState.historyIndex][0].dateTime).toLocaleString() :
                                'Unknown'
                                }}
                            </p>
                            <p>Editor: {{
                                discreteHistory[document.uiState.historyIndex][0].blame ?
                                discreteHistory[document.uiState.historyIndex][0].blame.username :
                                'Unknown'
                                }}
                            </p>
                        </template>
                        <b-card-text v-else>
                            Blank Drawing
                        </b-card-text>
                    </b-card-text>
                    <b-button-group>
                        <b-button variant="success" size="sm" @click="revert">
                            Revert to Here
                        </b-button>
                        <b-btn style="opacity: 0.2" v-b-toggle.collapse-history-debug variant="primary">
                            <v-icon name="info" scale="0.8"></v-icon>
                        </b-btn>
                    </b-button-group>

                </b-card>
                <b-card class="history-slider">
                    <b-input type="range" min="-1" :max="discreteHistory.length - 1" v-model="document.uiState.historyIndex" ></b-input>
                </b-card>
                <b-collapse id="collapse-history-debug" class="mt-2">
                <b-card style="overflow-y: auto; max-height: 400px" class="history-debug">
                    <h2>Debugging info</h2>
                        <pre style="font-size: 12px; text-align: left">
                            {{ discreteHistory[document.uiState.historyIndex] }}
                        </pre>
                </b-card>
                </b-collapse>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { DocumentState } from "../../../src/store/document/types";
    import { OPERATION_NAMES } from "../../../../common/src/api/document/operation-transforms";
    import { Operation } from "../../../../common/src/models/Operation";
    import { DrawingMode } from "../../htmlcanvas/types";
    import { MainEventBus } from "../../store/main-event-bus";

    @Component({
        components: {},
        props: {
            objects: Array,
            onChange: Function
        }
    })
    export default class HistoryView extends Vue {

        unwatch: () => void;

        mounted() {
            this.unwatch = this.$watch(
                () => this.document.uiState.historyIndex,
                (newVal, oldVal) => {
                    this.document.uiState.selectedUids.splice(0);
                    newVal = Number(newVal);
                    oldVal = Number(oldVal);
                    if (newVal > oldVal) { // fast forward
                        for (let i = oldVal + 1; i <= newVal; i++) {
                            for (let j = 0; j < this.discreteHistory[i].length; j++) {
                                const op = this.discreteHistory[i][j];
                                switch (op.operation.type) {
                                    case OPERATION_NAMES.DIFF_OPERATION:
                                        this.$store.dispatch('document/applyDiff', op.operation.diff);
                                        break;
                                    case OPERATION_NAMES.COMMITTED_OPERATION:
                                        break;
                                }
                            }
                        }
                    }

                    if (newVal < oldVal) {
                        for (let i = oldVal; i > newVal; i--) {
                            for (let j = this.discreteHistory[i].length - 1; j >= 0; j--) {
                                const op = this.discreteHistory[i][j];
                                switch (op.operation.type) {
                                    case OPERATION_NAMES.DIFF_OPERATION:
                                        this.$store.dispatch('document/applyDiff', op.operation.inverse);
                                        break;
                                    case OPERATION_NAMES.COMMITTED_OPERATION:
                                        break;
                                }
                            }
                        }
                    }
                    MainEventBus.$emit('redraw');
                }
            );

            this.document.uiState.historyIndex = this.discreteHistory.length - 1;
        }

        destroyed() {
            this.unwatch();
        }

        get document(): DocumentState {
            return this.$store.getters["document/document"];
        }

        get discreteHistory(): Operation[][] {
            return this.$store.getters['document/discreteHistory'];
        }

        onBB() {
            this.document.uiState.historyIndex = Math.max(-1, +this.document.uiState.historyIndex - 30)
        }
        onB() {
            this.document.uiState.historyIndex = Math.max(-1, +this.document.uiState.historyIndex - 1)
        }
        onFF() {
            this.document.uiState.historyIndex = Math.min(this.discreteHistory.length - 1, +this.document.uiState.historyIndex + 30)
        }
        onF() {
            this.document.uiState.historyIndex = Math.min(this.discreteHistory.length - 1, +this.document.uiState.historyIndex + 1)
        }

        async revert() {
            const res = await this.$bvModal.msgBoxConfirm('Are you sure you want to revert to this state? (This will show up as another change in the history)');
            if (res) {
                this.document.uiState.drawingMode = DrawingMode.Hydraulics;
                await this.$store.dispatch('document/commit');
            }

        }
    }
</script>

<style lang="less">
    .calculationBtn {
        background-color: white;
    }

    .historySidePanel {
        position: fixed;
        left: 25px;
        top: 80px;
        width: 250px;
    }

    .history-slider {
        position: fixed;
        left: 300px;
        top: 80px;
        width: calc(100vw - 320px);
        //margin-right: 20px;
    }

    .history-debug {

        position: fixed;
        left: 300px;
        top: 200px;
        width: calc(100vw - 320px);
        //margin-right: 20px;
    }

</style>
