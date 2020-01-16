<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{ title }}</h3>
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
import BigValveEntity, {
    BigValveType,
    fillDefaultBigValveFields,
    makeBigValveFields
} from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { Catalog } from "../../../../../common/src/api/catalog/types";

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
export default class BigValveProperties extends Vue {
    get fields() {
        return makeBigValveFields(this.reactiveData);
    }

    get title() {
        switch (this.reactiveData.valve.type) {
            case BigValveType.TMV:
                return "TMV";
            case BigValveType.TEMPERING:
                return "Tempering Valve";
            case BigValveType.RPZD_HOT_COLD:
                return "RPZD Hot/Cold Valve";
        }
    }

    get reactiveData(): BigValveEntity {
        return this.$props.selectedEntity;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultCatalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get defaultData() {
        return fillDefaultBigValveFields(this.defaultCatalog, this.reactiveData);
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
