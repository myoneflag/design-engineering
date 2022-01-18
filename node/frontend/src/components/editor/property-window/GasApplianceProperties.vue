<template>
  <b-container>
    <b-row>
      <b-col>
        <h3>Gas Appliance ({{ reactiveData.name }})</h3>
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
import { DocumentState } from "../../../../src/store/document/types";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import {
  fillGasApplianceFields,
  makeGasApplianceFields
} from "../../../../../common/src/api/document/entities/gas-appliance";

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
export default class GasApplianceProperties extends Vue {
  get fields() {
    return makeGasApplianceFields(this.document.drawing, this.$props.selectedEntity);
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
    return fillGasApplianceFields(
      this.reactiveData,
      this.document.entityDependencies.get(this.$props.selectedEntity.uid)
    );
  }

  onCommit() {
    this.$store.dispatch("document/validateAndCommit");
  }
}
</script>

<style lang="less" scoped>
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
