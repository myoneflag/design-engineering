<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{name}} ({{ selectedEntity.name }})</h3>
            </b-col>
        </b-row>
        <slot> </slot>
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
import { fillRiserDefaults, makeRiserFields } from "../../../../../common/src/api/document/entities/riser-entity";
import { DocumentState } from "../../../../src/store/document/types";
import {
    fillFixtureFields,
    makeFixtureFields
} from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { fillPlantDefaults, makePlantEntityFields } from "../../../../../common/src/api/document/entities/plants/plant-entity";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import {getEntityName} from "../../../../../common/src/api/document/entities/types";

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
export default class PlantProperties extends Vue {
    get fields() {
        return makePlantEntityFields(this.$props.selectedEntity, this.document.drawing.metadata.flowSystems);
    }

    get name() {
        return getEntityName(this.$props.selectedEntity);
    }

    get reactiveData() {
        return this.$props.selectedEntity;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultCatalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get defaultData() {
        return fillPlantDefaults(this.$props.selectedEntity, this.document.drawing);
    }

    async onCommit() {
        await this.$store.dispatch("document/validateAndCommit");
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
