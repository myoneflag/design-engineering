import {ValveType} from "../../../../src/store/document/entities/directed-valves/valve-types";
<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{ selectedObject.friendlyTypeName(catalog) }}</h3>
            </b-col>
        </b-row>
        <b-row style="margin-top: 10px;">
            <b-col>
                <b-button
                    variant="primary"
                    @click="flip"
                    :disabled="objectStore.getConnections(selectedObject.uid).length === 0"
                >
                    Flip Direction
                </b-button>
            </b-col>
        </b-row>
        <b-row style="margin-top: 10px;" v-if="selectedEntity.valve.type === ValveType.ISOLATION_VALVE">
            <b-col>
                <b-button variant="success" @click="openCloseIsolation">
                    {{ selectedEntity.valve.isClosed ? "Click to Open" : "Click to Close" }}
                </b-button>
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
import { Catalog } from "../../../../src/store/catalog/types";
import DirectedValveEntity, {
    fillDirectedValveFields,
    makeDirectedValveFields
} from "../../../store/document/entities/directed-valves/directed-valve-entity";
import DirectedValve from "../../../../src/htmlcanvas/objects/directed-valve";
import { ValveType } from "../../../../src/store/document/entities/directed-valves/valve-types";

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
export default class DirectedValveProperties extends Vue {
    get fields() {
        return makeDirectedValveFields(
            this.document.drawing.metadata.flowSystems,
            (this.$props.selectedEntity as DirectedValveEntity).valve
        );
    }

    get reactiveData(): DirectedValveEntity {
        return this.$props.selectedEntity;
    }

    get catalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultData(): DirectedValveEntity {
        return fillDirectedValveFields(this.document, this.$props.objectStore, this.reactiveData);
    }

    get ValveType() {
        return ValveType;
    }
    async onCommit() {
        await this.$store.dispatch("document/commit");
    }

    flip() {
        (this.$props.selectedObject as DirectedValve).flip();
        this.onCommit();
    }

    openCloseIsolation() {
        if (this.$props.selectedEntity.valve.type === ValveType.ISOLATION_VALVE) {
            this.$props.selectedEntity.valve.isClosed = !this.$props.selectedEntity.valve.isClosed;
            this.$props.onChange();
            this.onCommit();
        }
    }
}
</script>

<style lang="less"></style>
