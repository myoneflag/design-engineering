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
    fillValveDefaultFields,
    makeValveFields
} from "../../../store/document/entities/fitting-entity";
import { Catalog, ValveSpec } from "../../../../src/store/catalog/types";
import * as _ from "lodash";

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
export default class FittingProperties extends Vue {
    get fields() {
        return makeValveFields(
            this.$store.getters["catalog/defaultValveChoices"],
            this.document.drawing.metadata.flowSystems
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
        return fillValveDefaultFields(this.document, this.reactiveData);
    }

    async onCommit() {
        await this.$store.dispatch("document/commit");
    }
}
</script>

<style lang="less"></style>
