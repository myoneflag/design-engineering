<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{name}}</h3>
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
        <b-row >
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
import {
    fillFlowSourceDefaults,
    makeFlowSourceFields
} from "../../../../../common/src/api/document/entities/flow-source-entity";
import {getEntityName} from "../../../../../common/src/api/document/entities/types";
import { isDrainage, StandardFlowSystemUids } from "../../../../../common/src/api/config";
import { SupportedLocales } from "../../../../../common/src/api/locale";

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
export default class FlowSourceProperties extends Vue {
    get fields() {
        return  makeFlowSourceFields(
            this.document.drawing.metadata.flowSystems,
            this.$props.selectedEntity,
            this.document.locale
        );
    }

    get name() {
        return getEntityName(this.$props.selectedEntity);
    }
    get StandardFlowSystemUids(){
        return StandardFlowSystemUids;
    }
    get SupportedLocales(){
        return SupportedLocales;
    }
    get reactiveData() {
        return this.$props.selectedEntity;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultData() {
        return fillFlowSourceDefaults(this.document.drawing, this.reactiveData);
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
