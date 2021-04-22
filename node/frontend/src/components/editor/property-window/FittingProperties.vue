<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{ selectedObject.friendlyTypeName }}</h3>
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
import FittingEntity, {
    makeValveFields
} from "../../../../../common/src/api/document/entities/fitting-entity";
import * as _ from "lodash";
import { Catalog, ValveSpec } from "../../../../../common/src/api/catalog/types";
import {fillValveDefaultFields} from "../../../store/document/entities/fillDefaultEntityFields";

@Component({
    components: { PropertiesFieldBuilder },
    props: {
        selectedEntity: Object,
        selectedObject: Object,
        targetProperty: String,
        objectStore: Map,
        onDelete: Function,
        onChange: Function
    }
})
export default class FittingProperties extends Vue {
    get fields() {
        return makeValveFields(
            this.document.drawing.metadata.flowSystems,
        );
    }

    get reactiveData(): FittingEntity {
        return this.$props.selectedEntity;
    }

    get catalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultData(): FittingEntity {
        return fillValveDefaultFields(this.document.drawing, this.reactiveData, this.$props.objectStore);
    }

    async onCommit() {
        await this.$store.dispatch("document/validateAndCommit");
    }
}
</script>

<style lang="less"></style>
