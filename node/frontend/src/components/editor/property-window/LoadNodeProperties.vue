<template>
  <b-container>
    <b-row>
      <b-col>
        <h3>{{ title }}</h3>
        <h4 v-if="reactiveData.name">({{ reactiveData.name }})</h4>
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
import LoadNodeEntity, {
  makeLoadNodesFields,
  NodeType
} from "../../../../../common/src/api/document/entities/load-node-entity";
import { fillDefaultLoadNodeFields } from "../../../store/document/entities/fillDefaultLoadNodeFields";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import { determineConnectableSystemUid } from "../../../store/document/entities/lib";

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
    const systemUid = determineConnectableSystemUid(this.$props.selectedObject.globalStore, this.$props.selectedEntity);
    return makeLoadNodesFields(
      this.document.drawing,
      this.$props.selectedEntity,
      this.catalog,
      this.document.locale,
      systemUid || null
    );
  }

  get reactiveData(): LoadNodeEntity {
    return this.$props.selectedEntity;
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get catalog(): Catalog {
    return this.$store.getters["catalog/default"];
  }

  get nodes() {
    return this.$store.getters["customEntity/nodes"];
  }

  get defaultData(): LoadNodeEntity {
    return fillDefaultLoadNodeFields(
      this.document,
      this.$props.selectedObject.globalStore,
      this.reactiveData,
      this.catalog,
      this.nodes
    );
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
