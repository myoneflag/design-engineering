<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{ title }}</h3>
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
import PipeEntity, { fillPipeDefaultFields, makePipeFields } from "../../../store/document/entities/pipe-entity";
import LoadNodeEntity, {
    fillDefaultLoadNodeFields,
    makeLoadNodesFields,
    NodeType
} from "../../../store/document/entities/load-node-entity";
import LoadNode from "../../../htmlcanvas/objects/load-node";

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
export default class LoadNodeProperties extends Vue {
    get fields() {
        return makeLoadNodesFields(this.document.drawing.metadata.flowSystems, this.$props.selectedEntity);
    }

    get reactiveData(): LoadNodeEntity {
        return this.$props.selectedEntity;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultData(): LoadNodeEntity {
        return fillDefaultLoadNodeFields(this.document, this.$props.selectedObject.objectStore, this.reactiveData);
    }

    onCommit() {
        this.$store.dispatch("document/commit");
    }

    get title() {
        const entity: LoadNodeEntity = this.$props.selectedEntity;
        switch (entity.node.type) {
            case NodeType.LOAD_NODE:
                return "Loading Node";
            case NodeType.DWELLING:
                return "Dwelling Node";
        }
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
