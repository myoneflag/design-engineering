<template>
  <b-container style="text-align: initial; max-width: 400px">
    <b-list-group class="px-3">
      <b-list-group-item
        v-for="(node, key) in nodes"
        :key="key"
        button
        @click="(e) => handleViewNode(node.id ? node.id : node.uid)"
      >
        {{ node.name }}
      </b-list-group-item>
    </b-list-group>
    <b-button variant="success" class="mt-4" block v-b-modal.form>New Fixture Group</b-button>

    <b-modal
      id="form"
      centered
      hide-header
      hide-footer
      no-close-on-backdrop
      no-close-on-esc
      no-fade
      @hidden="resetForm"
    >
      <b-form-group label="Name" label-for="name" label-cols-lg="4">
        <b-form-input :disabled="submitting" id="name" v-model="reactiveForm.name"></b-form-input>
      </b-form-group>
      <b-form-group label="Min Pressure" label-for="minPressure" label-cols-lg="4">
        <b-input-group :append="pressureUnits">
          <b-form-input
            :disabled="submitting"
            id="minPressure"
            v-model.number="minPressureReactive"
            type="number"
          ></b-form-input>
        </b-input-group>
      </b-form-group>
      <b-form-group label="Max Pressure" label-for="maxPressure" label-cols-lg="4">
        <b-input-group :append="pressureUnits">
          <b-form-input
            :disabled="submitting"
            id="maxPressure"
            v-model.number="maxPressureReactive"
            type="number"
          ></b-form-input>
        </b-input-group>
      </b-form-group>
      <b-form-group label="Available Fixtures" :disabled="submitting">
        <b-row>
          <b-col sm="6" v-for="fixture in availableFixtures" :key="fixture.uid">
            <b-form-group :id="fixture.uid" :label="fixture.name" :label-for="fixture.name">
              <b-form-input
                type="number"
                min="0"
                :id="fixture.name"
                :value="getFixtureInputValue(fixture.uid)"
                @input="($event) => setFixtureInputValue(fixture.uid, $event)"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
      </b-form-group>
      <b-form-group label="Is this a dwelling?" label-cols-lg="4" :disabled="submitting">
        <b-form-radio-group v-model="reactiveForm.dwelling" class="mt-2">
          <b-form-radio :value="true">Yes</b-form-radio>
          <b-form-radio :value="false">No</b-form-radio>
        </b-form-radio-group>
      </b-form-group>
      <div class="mt-4 text-right clearfix">
        <b-button
          :disabled="submitting"
          v-if="typeof viewNode === 'number'"
          variant="outline-danger"
          class="float-left"
          @click="handleDelete"
        >
          <b-icon icon="trash" aria-label="Help"></b-icon>
        </b-button>
        <b-button :disabled="isUnchanged || submitting" variant="success" @click="handleSave">{{
          (viewNode && "Update") || "Create"
        }}</b-button>
        <b-button :disabled="submitting" @click="$bvModal.hide('form')" class="ml-2">Cancel</b-button>
      </div>
    </b-modal>
  </b-container>
</template>

<script lang="tsx">
import Vue from "vue";
import Component from "vue-class-component";
import * as _ from "lodash";
import { DocumentState } from "../../store/document/types";
import { User } from "../../../../common/src/models/User";
import { NodeProps } from "../../../../common/src/models/CustomEntity";
import { FixtureSpec } from "../../../../common/src/api/catalog/types";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { add, remove, update } from "../../api/custom-entity";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { drawingContainsCustomNode } from "../../../../common/src/api/document/entities/load-node-entity";
import { convertMeasurementSystem, convertMeasurementToMetric, Units } from "../../../../common/src/lib/measurements";
import { setPropertyByString } from "../../lib/utils";

function initialForm(): NodeProps {
  return {
    name: "",
    maxPressure: null,
    minPressure: null,
    fixtures: [],
    dwelling: "",
    type: EntityType.LOAD_NODE,
  };
}

@Component
export default class Nodes extends Vue {
  viewNode: string | number = "";
  submitting: boolean = false;
  originalForm = initialForm();
  reactiveForm = cloneSimple(this.originalForm);
  reactiveNodes = cloneSimple(this.nodes);

  get profile(): User {
    return this.$store.getters["profile/profile"];
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get nodes(): NodeProps[] {
    return this.$store.getters["customEntity/nodes"];
  }

  get availableFixtures(): FixtureSpec[] {
    return this.document.drawing.metadata.availableFixtures.map(
      (i) => this.$store.getters.effectiveCatalog.fixtures[i]
    );
  }

  get isUnchanged(): boolean {
    return _.isEqual(this.originalForm, this.reactiveForm);
  }

  get minPressureReactive() {
    if (this.reactiveForm.minPressure !== null) {
      const [_, converted] = convertMeasurementSystem(
        this.document.drawing.metadata.units,
        Units.KiloPascals,
        this.reactiveForm.minPressure
      );
      return converted as number;
    }
    return null;
  }

  set minPressureReactive(value: number | null) {
    if (value === null) {
      this.reactiveForm.minPressure = null;
    } else {
      const [_, converted] = convertMeasurementToMetric(this.pressureUnits, value);
      this.reactiveForm.minPressure = converted as number;
    }
  }

  get maxPressureReactive() {
    if (this.reactiveForm.maxPressure !== null) {
      const [_, converted] = convertMeasurementSystem(
        this.document.drawing.metadata.units,
        Units.KiloPascals,
        this.reactiveForm.maxPressure
      );
      return converted as number;
    }
    return null;
  }

  set maxPressureReactive(value: number | null) {
    if (value === null) {
      this.reactiveForm.maxPressure = null;
    } else {
      const [_, converted] = convertMeasurementToMetric(this.pressureUnits, value);
      this.reactiveForm.maxPressure = converted as number;
    }
  }

  get pressureUnits() {
    const [units] = convertMeasurementSystem(this.document.drawing.metadata.units, Units.KiloPascals, null);
    return units;
  }

  setReactiveForm(prop: string, value: any) {
    return setPropertyByString(this.reactiveForm, prop, value);
  }

  handleViewNode(key: number | string) {
    this.viewNode = key;
    this.originalForm = this.nodes.find((node) => node.id === key || node.uid === key)!;
    this.reactiveForm = cloneSimple(this.originalForm);
    this.$bvModal.show("form");
  }

  getFixtureInputValue(uid: string) {
    return this.reactiveForm.fixtures.filter((fixture) => fixture === uid).length;
  }

  setFixtureInputValue(fixtureUid: string, value: number) {
    const filteredFixture = this.reactiveForm.fixtures.filter((fixture) => fixture !== fixtureUid);
    const addedFixtures = Array(+value).fill(fixtureUid);

    this.setReactiveForm("fixtures", [...filteredFixture, ...addedFixtures]);
  }

  resetForm() {
    this.originalForm = initialForm();
    this.reactiveForm = cloneSimple(this.originalForm);
    this.viewNode = "";
  }

  async handleDelete() {
    const nodeId = this.viewNode as number;
    if (drawingContainsCustomNode(this.document.drawing, nodeId)) {
      this.$bvModal.msgBoxOk("This node is in use in the project and cannot be deleted.");
    } else {
      this.submitting = true;
      await remove(nodeId, { documentId: this.document.documentId, entity: this.reactiveForm }).then((res) => {
        if (res.success) {
          this.$store.dispatch("customEntity/setNodes", res.data);
        }
        console.log(res.data);
      });
      this.submitting = false;
      this.$bvModal.hide("form");
    }
  }

  async handleSave() {
    this.submitting = true;

    if (typeof this.viewNode === "number") {
      await update(this.viewNode, { documentId: this.document.documentId, entity: this.reactiveForm }).then((res) => {
        if (res.success) {
          this.$store.dispatch("customEntity/setNodes", res.data);
        }
      });
    } else {
      await add({ documentId: this.document.documentId, entity: this.reactiveForm }).then((res) => {
        if (res.success) {
          this.$store.dispatch("customEntity/setNodes", res.data);
        }
      });
    }

    this.submitting = false;
    this.$bvModal.hide("form");
  }
}
</script>
