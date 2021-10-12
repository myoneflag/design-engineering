<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>Pipe</h3>
            </b-col>
        </b-row>
        <PropertiesFieldBuilder
            :fields="fields"
            :reactive-data="reactiveData"
            :default-data="defaultData"
            :on-commit="onCommit"
            :on-change="onChange"
            :target="targetProperty"
        />
        <b-row>
            <b-col>
                <b-button size="sm" variant="danger" @click="onDelete">
                    Delete
                </b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import PropertiesFieldBuilder from "../../../../src/components/editor/lib/PropertiesFieldBuilder.vue";
import { DocumentState } from "../../../../src/store/document/types";
import PipeEntity, {
    fillPipeDefaultFields,
    makePipeFields
} from "../../../../../common/src/api/document/entities/pipe-entity";
import { globalStore } from "../../../store/document/mutations";
import { getFloorHeight } from "../../../htmlcanvas/lib/utils";


@Component({
    components: { PropertiesFieldBuilder },
    props: {
        selectedEntity: Object,
        selectedObject: Object,
        targetProperty: String,
        onDelete: Function,
        onChange: Function
    }
})
export default class PipeProperties extends Vue {
    get fields() {
        return makePipeFields(
            this.$props.selectedEntity,
            this.$store.getters["catalog/default"],
            this.document.drawing,
            getFloorHeight(globalStore, this.document, this.$props.selectedEntity),
        );
    }

    get reactiveData(): PipeEntity {
        return this.$props.selectedEntity;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultData(): PipeEntity {
        return fillPipeDefaultFields(
            this.document.drawing,
            this.$props.selectedObject.computedLengthM,
            this.reactiveData
        );
    }

    onCommit() {
        this.$store.dispatch("document/validateAndCommit");
    }
}
</script>

<style lang="less">
.sidebar-title {
    position: relative;
    font-size: 30px;
    z-index: 1;
    overflow: hidden;
    text-align: center;

    &:before,
    &:after {
        position: absolute;
        top: 51%;
        overflow: hidden;
        width: 50%;
        height: 1px;
        content: "\a0";
        background-color: lightgray;
    }

    &:before {
        margin-left: -50%;
        text-align: right;
    }
}
</style>
