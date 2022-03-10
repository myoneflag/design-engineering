<template>
  <b-dropdown
    size="md"
    id="dropdown-system"
    :text="selectedSystem.name"
    variant="outline-dark"
    class="float-left"
    :style="'border-radius: 5px; background-color: ' + lighten(selectedSystem.color.hex, 50, 0.5)"
    :disabled="disabled"
  >
  <b-dropdown-group
      v-for="(system, index) in flowSystems"
      :key="system.uid"
      class="group-system"
  >
    <b-dropdown-form v-if="hideable">
      <b-check
        :disabled="isDisabled(system.uid)"
        :checked="!isHiddenSystem(system.uid)"
        @change="hideSystem(system.uid)"
      />
    </b-dropdown-form>
    <b-dropdown-item
      @click="selectSystem(index)"
      :disabled="isDisabled(system.uid)"
      style="min-width: 220px; padding-right: 0.5rem;"
    >
      <span :style="'float: left; width:20px; height:20px; margin-right:10px; background-color: ' + system.color.hex">
      </span>
      {{ system.name }}
    </b-dropdown-item>
  </b-dropdown-group>
  </b-dropdown>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { lighten } from "../../../src/lib/utils";
import { FlowSystemParameters, initialDrainageProperties } from "../../../../common/src/api/document/drawing";
import { InsulationJackets, InsulationMaterials, StandardFlowSystemUids } from "../../../../common/src/api/config";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { DocumentState } from '../../../src/store/document/types';
import { saveSystemPreference } from '../../../src/lib/filters/system';
import { MainEventBus } from '../../store/main-event-bus';

@Component({
  props: {
    disabled: Boolean,
    flowSystems: Array,
    disabledFlowSystems: Array,
    selectedSystemUid: String,
    hideable: Boolean,
  }
})
export default class FlowSystemPicker extends Vue {
  selectSystem(index: number) {
    this.$emit("selectSystem", index);
  }

  isHiddenSystem(systemUid: string): boolean {
    return this.document.uiState.systemFilter.hiddenSystemUids.includes(systemUid);
  }

  hideSystem(systemUid: string) {
    const hiddenSystemUids = this.document.uiState.systemFilter.hiddenSystemUids;
    if (this.isHiddenSystem(systemUid)) {
      this.document.uiState.systemFilter.hiddenSystemUids = hiddenSystemUids.filter((uid: string) => uid !== systemUid);
    } else {
      this.document.uiState.systemFilter.hiddenSystemUids = [...hiddenSystemUids, systemUid];
    }
    MainEventBus.$emit("redraw");
    saveSystemPreference(window, this.document.documentId, this.document.uiState.systemFilter.hiddenSystemUids);
  }

  lighten(col: string, amt: number, alpha: number) {
    return lighten(col, amt, alpha);
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get selectedSystem(): FlowSystemParameters {
    const result = this.$props.flowSystems.find((s: FlowSystemParameters) => s.uid === this.$props.selectedSystemUid);
    if (!!result) {
      return result;
    }
    return {
      color: { hex: "#eeeeee" },
      fluid: "",
      name: this.$props.selectedSystemUid,
      temperature: 0,
      uid: this.$props.selectedSystemUid,
      hasReturnSystem: false,
      returnIsInsulated: false,
      insulationMaterial: InsulationMaterials.calciumSilicate,
      insulationJacket: InsulationJackets.allServiceJacket,
      insulationThicknessMM: 0,
      returnMaxVelocityMS: 0,
      drainageProperties: cloneSimple(initialDrainageProperties),
      networks: {
        RISERS: {
          velocityMS: 0,
          spareCapacityPCT: 0,
          material: "",
          minimumPipeSize: 0
        },
        RETICULATIONS: {
          velocityMS: 0,
          spareCapacityPCT: 0,
          material: "",
          minimumPipeSize: 0
        },
        CONNECTIONS: {
          velocityMS: 0,
          spareCapacityPCT: 0,
          material: "",
          minimumPipeSize: 0
        }
      }
    };
  }

  isDisabled(uid: StandardFlowSystemUids) {
    return !!this.$props.disabledFlowSystems?.find((i: StandardFlowSystemUids) => i === uid);
  }
}
</script>

<style scoped lang="less">
.group-system > ul {
  display: flex;
  li {
    > form {
      padding-left: 1rem;
      padding-right: 0;
    }
    &:not(:first-of-type) {
      margin-left: -2rem;
      span {
        margin-left: 1rem;
      }
    }
  }
}
</style>