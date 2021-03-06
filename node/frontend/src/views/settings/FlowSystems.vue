<template>
  <div>
    <SettingsFieldBuilder
      ref="fields"
      :fields="fields"
      :reactiveData="selectedSystem"
      :originalData="committedSelectedSystem"
      :onSave="save"
      :onBack="back"
      :onChangeFluid="handleFluidChange"
    >
      <b-row style="padding-bottom: 10px; padding-top: 20px;">
        <b-col>
          <h4 class="float-right">Settings for:</h4>
        </b-col>
        <b-col>
          <FlowSystemPicker
            :selected-system-uid="selectedSystem.uid"
            :flow-systems="flowSystems"
            @selectSystem="selectSystem"
          />
        </b-col>
      </b-row>
      <b-row style="padding-bottom: 20px">
        <b-col></b-col>
        <b-col>
          <b-button variant="light" @click="addNewSystem" class="float-left">
            <v-icon name="plus" />
            Add New System
          </b-button>
          <b-button variant="light" @click="deleteSystem" class="float-left">
            <v-icon name="trash-alt" />
            Delete
          </b-button>
        </b-col>
      </b-row>
    </SettingsFieldBuilder>
  </div>
</template>

<script lang="ts">
import * as _ from "lodash";
import uuid from "uuid";
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { DocumentState } from "../../../src/store/document/types";
import SettingsFieldBuilder from "../../../src/components/editor/lib/SettingsFieldBuilder.vue";
import FlowSystemPicker from "../../../src/components/editor/FlowSystemPicker.vue";
import { FlowSystemParameters, initialDrawing, NetworkType } from "../../../../common/src/api/document/drawing";
import { Choice, arrayToMap, mapToArray } from "../../../../common/src/lib/utils";
import {
  assertUnreachable,
  getInsulationThicknessMMKEMBLA,
  INSULATION_JACKET_CHOICES,
  INSULATION_MATERIAL_CHOICES,
  isDrainage,
  isGas
} from "../../../../common/src/api/config";
import { convertMeasurementSystem, Units } from "../../../../common/src/lib/measurements";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { getNextPipeSize, setPropertyByString } from "../../lib/utils";
import {
  getDrainageMaterials,
  getWaterDrainageMaterials
} from "../../../../common/src/api/document/entities/pipe-entity";
import { evaluatePolynomial } from "../../../../common/src/lib/polynomials";
import { THERMAL_CONDUCTIVITY } from "../../../../common/src/api/constants/air-properties";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import { globalStore } from "../../store/document/mutations";

@Component({
  components: { SettingsFieldBuilder, FlowSystemPicker },
  beforeRouteLeave(to, from, next) {
    if ((this.$refs.fields as any).leave()) {
      next();
    } else {
      next(false);
    }
  }
})
export default class FlowSystems extends Vue {
  selectedSystemId: number = 0;

  get globalStore(): GlobalStore {
    return globalStore;
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get catalog(): Catalog {
    return this.$store.getters["catalog/default"];
  }

  get flowSystems() {
    return this.document.drawing.metadata.flowSystems;
  }

  get selectedSystem() {
    return this.document.drawing.metadata.flowSystems[this.selectedSystemId];
  }

  get fields() {
    const selectedIsGas = isGas(
      this.selectedSystem.uid,
      this.catalog.fluids,
      this.document.drawing.metadata.flowSystems
    );

    const fields: any[][] = [["name", "System Name", "text"]];

    if (!this.committedSelectedSystem) {
      fields.push(["fluid", "Fluid", "choice", this.$store.getters["catalog/defaultFluidChoices"]]);
    }

    if (!selectedIsGas) {
      fields.push(["temperature", "Temperature", "range", 10, 100, null, Units.Celsius]);
    }

    fields.push(["color", "Colour", "color"]);

    if (this.selectedIsDrainage) {
      fields.push(["drainageProperties.ventColor", "Vent colour", "color"]);
    }

    if (!selectedIsGas && !this.selectedIsDrainage) {
      fields.push(["hasReturnSystem", "Has Return System", "yesno"]);
    }

    if (this.selectedSystem.hasReturnSystem && !selectedIsGas && !this.selectedIsDrainage) {
      fields.push(["returnIsInsulated", "Return Is Insulated", "yesno"]);

      if (this.selectedSystem.returnIsInsulated) {
        fields.push([
          "insulationMaterial",
          "Insulation Material",
          "choice",
          this.getInsulationMaterialChoicesWithThermalConductivity(this.selectedSystem.temperature, this.document)
        ]);

        if (this.selectedSystem.insulationMaterial !== "mmKemblaInsulation") {
          fields.push(["insulationJacket", "Insulation Jacket", "choice", INSULATION_JACKET_CHOICES]);
        }

        fields.push(["returnMaxVelocityMS", "Max. Velocity of Return", "number", Units.MetersPerSecond]);

        if (this.selectedSystem.insulationMaterial === "mmKemblaInsulation") {
          fields.push([
            "insulationThicknessMM",
            "Insulation Thickness",
            "select",
            Units.Millimeters,
            getInsulationThicknessMMKEMBLA(this.document.drawing.metadata.units)
          ]);
        } else {
          fields.push(["insulationThicknessMM", "Insulation Thickness", "number", Units.Millimeters]);
        }
      }
    }

    if (this.selectedIsDrainage) {
      for (const netKey of Object.keys(this.selectedSystem.networks) as NetworkType[]) {
        let drainageTitle = "";
        switch (netKey) {
          case NetworkType.RISERS:
            drainageTitle = "Stacks";
            break;
          case NetworkType.RETICULATIONS:
            drainageTitle = "Pipes";
            break;
          case NetworkType.CONNECTIONS:
            drainageTitle = "Vents";
            break;
          default:
            assertUnreachable(netKey);
        }

        fields.push(
          [netKey, drainageTitle, "title4"],
          ["networks." + netKey + ".material", "Material", "choice", this.drainageMaterials]
        );
      }

      fields.push(["", "Drainage Properties", "title4"]);

      fields.push(
        [
          "drainageProperties.horizontalPipeSizing",
          "Horizontal Pipe Sizing",
          "array-table",
          [
            { name: "Min Units", key: "minUnits", units: Units.None },
            { name: "Max Units", key: "maxUnits", units: Units.None },
            {
              name: "Size",
              key: "sizeMM",
              units: Units.Millimeters,
              type: "select",
              options: this.networkPipeSizesToSelectOptions[this.reticulationsMaterial]
            },
            { name: "grade %", key: "gradePCT", units: Units.None }
          ]
        ],
        [
          "drainageProperties.maxUnventedLengthM",
          "Max. Unvented Length",
          "optional-numeric-table",
          this.selectedSystem.drainageProperties.availablePipeSizesMM,
          "Pipe Size",
          "Unlimited",
          Units.Millimeters,
          Units.Meters
        ],

        [
          "drainageProperties.maxUnventedCapacityWCs",
          "Max. Unvented Capacity (WC's)",
          "optional-numeric-table",
          this.selectedSystem.drainageProperties.availablePipeSizesMM,
          "Pipe Size",
          "Unlimited",
          Units.Millimeters,
          Units.None
        ],

        [
          "drainageProperties.ventSizing",
          "Vent Sizing",
          "array-table",
          [
            { name: "Min Units", key: "minUnits", units: Units.None },
            { name: "Max Units", key: "maxUnits", units: Units.None },
            {
              name: "Size",
              key: "sizeMM",
              units: Units.Millimeters,
              type: "select",
              options: this.networkPipeSizesToSelectOptions[this.connectionsMaterial]
            }
          ]
        ],

        ["drainageProperties.stackSizeDiminish", "Does the stack diminish in size?", "yesno"],

        [
          "drainageProperties.stackPipeSizing",
          "Stack Pipe Sizing",
          "array-table",
          [
            { name: "Min Units", key: "minUnits", units: Units.None },
            { name: "Max Units", key: "maxUnits", units: Units.None },
            {
              name: "Size",
              key: "sizeMM",
              units: Units.Millimeters,
              type: "select",
              options: this.networkPipeSizesToSelectOptions[this.risersMaterial]
            },
            {
              name: "Maximum Fixture/discharge Units Per Level",
              key: "maximumUnitsPerLevel",
              units: Units.None
            }
          ]
        ],

        ["drainageProperties.stackDedicatedVent", "Does the stack have a dedicated vent?", "yesno"],

        [
          "drainageProperties.stackVentPipeSizing",
          "Stack Vent Sizing",
          "array-table",
          [
            { name: "Min Units", key: "minUnits", units: Units.None },
            { name: "Max Units", key: "maxUnits", units: Units.None },
            {
              name: "Size",
              key: "sizeMM",
              units: Units.Millimeters,
              type: "select",
              options: this.networkPipeSizesToSelectOptions[this.connectionsMaterial]
            }
          ]
        ]
      );
    } else {
      fields.push(["", "Network Properties", "title3"]);

      const pipeSizes: { [key: string]: Array<{ key: number; name: string }> } = {};
      Object.entries(this.catalog.pipes).map(([key, pipeProp]) => {
        pipeSizes[key] = Object.keys(pipeProp.pipesBySize.generic).map((x) => {
          const [units, value] = convertMeasurementSystem(
            this.document.drawing.metadata.units,
            Units.PipeDiameterMM,
            x
          );
          return {
            key: +x,
            name: value + units
          };
        });
      });

      for (const netKey of Object.keys(this.selectedSystem.networks)) {
        if (netKey === NetworkType.CONNECTIONS && selectedIsGas) {
          continue;
        }

        fields.push(
          [netKey, _.startCase(netKey.toLowerCase()), "title4"],
          ["networks." + netKey + ".velocityMS", "Velocity", "number", Units.MetersPerSecond],
          ["networks." + netKey + ".material", "Material", "choice", this.waterMaterials],
          [
            "networks." + netKey + ".minimumPipeSize",
            "Minimum Pipe Size",
            "choice",
            pipeSizes[this.selectedSystem.networks[netKey as NetworkType].material],
            this.selectedSystem.networks[netKey as NetworkType].material
          ],
          ["networks." + netKey + ".spareCapacityPCT", "Spare Capacity (%)", "range", 0, 100]
        );
      }
    }

    return fields;
  }

  get selectedIsDrainage() {
    return isDrainage(this.selectedSystem.uid, this.document.drawing.metadata.flowSystems);
  }

  get drainageMaterials(): Choice[] {
    const choices: Choice[] = this.$store.getters["catalog/defaultPipeMaterialChoices"];
    return getDrainageMaterials(choices);
  }

  get waterMaterials(): Choice[] {
    const choices: Choice[] = this.$store.getters["catalog/defaultPipeMaterialChoices"];
    return getWaterDrainageMaterials(choices);
  }

  get pipeSizes() {
    const pipeSizes: { [key: string]: Array<{ key: number; name: string }> } = {};

    Object.entries(this.catalog.pipes).map(([key, pipeProp]) => {
      const manufacturer =
        this.document.drawing.metadata.catalog.pipes.find((pipe) => pipe.uid === pipeProp.uid)?.manufacturer ||
        "generic";
      pipeSizes[key] = Object.keys(pipeProp.pipesBySize[manufacturer])
        .filter((x) => {
          if (this.selectedSystemId === 5) {
            return +x >= 25;
          }

          return true;
        })
        .map((x) => ({
          key: +x,
          name: x + "mm"
        }));
    });

    return pipeSizes;
  }

  get connectionsMaterial() {
    return this.selectedSystem.networks.CONNECTIONS.material;
  }

  get reticulationsMaterial() {
    return this.selectedSystem.networks.RETICULATIONS.material;
  }

  get risersMaterial() {
    return this.selectedSystem.networks.RISERS.material;
  }

  get networkPipeSizesToSelectOptions() {
    const selectOptionMapping = (size: { key: string | number }) => {
      const newMeasurement = convertMeasurementSystem(
        this.document.drawing.metadata.units,
        Units.PipeDiameterMM,
        size.key
      );
      return {
        value: size.key,
        text: newMeasurement[1] + "" + newMeasurement[0]
      };
    };
    return {
      [this.connectionsMaterial]: this.pipeSizes[this.connectionsMaterial].map(selectOptionMapping),
      [this.reticulationsMaterial]: this.pipeSizes[this.reticulationsMaterial].map(selectOptionMapping),
      [this.risersMaterial]: this.pipeSizes[this.risersMaterial].map(selectOptionMapping)
    };
  }

  get committedSelectedSystem() {
    return this.document.committedDrawing.metadata.flowSystems[this.selectedSystemId];
  }

  getInsulationMaterialChoicesWithThermalConductivity(tempC: number, doc: DocumentState) {
    return INSULATION_MATERIAL_CHOICES.map((c) => {
      const watts = evaluatePolynomial(THERMAL_CONDUCTIVITY[c.key as string], tempC + 273.15).toFixed(3);
      const [units, tempConverted] = convertMeasurementSystem(doc.drawing.metadata.units, Units.Celsius, tempC);
      return {
        key: c.key,
        name: c.name + " (" + watts + " W/m.K @ " + (tempConverted as number).toFixed(3) + " " + units + ")"
      };
    });
  }

  @Watch("selectedSystem.networks.RISERS.material")
  handleRisersMaterialChange(val: string, oldVal: string) {
    setPropertyByString(this.selectedSystem, "networks.RISERS.minimumPipeSize", this.pipeSizes[val][0].key);

    const selectedMaterialPipeSizes = this.pipeSizes[val];
    const lastPipeSize = selectedMaterialPipeSizes[selectedMaterialPipeSizes.length - 1].key;
    // adjust property values that relies on this property
    // drainageProperties.stackPipeSizing
    this.selectedSystem.drainageProperties.stackPipeSizing.forEach((sPSizeItem, index) => {
      if (this.pipeSizes[val].findIndex((pSizeItem) => pSizeItem.key === sPSizeItem.sizeMM) === -1) {
        // Getting next/above current size if not exist is safe
        const newSize = getNextPipeSize(
          sPSizeItem.sizeMM,
          this.pipeSizes[val].map((size) => size.key)
        );
        setPropertyByString(
          this.selectedSystem,
          `drainageProperties.stackPipeSizing.${index}.sizeMM`,
          newSize || lastPipeSize // select last size from the list if no higher
        );
      }
    });
  }

  @Watch("selectedSystem.networks.RETICULATIONS.material")
  handleReticulationsMaterialChange(val: string, oldVal: string) {
    setPropertyByString(this.selectedSystem, "networks.RETICULATIONS.minimumPipeSize", this.pipeSizes[val][0].key);

    const selectedMaterialPipeSizes = this.pipeSizes[val];
    const lastPipeSize = selectedMaterialPipeSizes[selectedMaterialPipeSizes.length - 1].key;
    // adjust property values that relies on this property
    // drainageProperties.horizontalPipeSizing
    this.selectedSystem.drainageProperties.horizontalPipeSizing.forEach((sPSizeItem, index) => {
      if (this.pipeSizes[val].findIndex((pSizeItem) => pSizeItem.key === sPSizeItem.sizeMM) === -1) {
        // Getting next/above current size if not exist is safe
        const newSize = getNextPipeSize(
          sPSizeItem.sizeMM,
          this.pipeSizes[val].map((size) => size.key)
        );
        setPropertyByString(
          this.selectedSystem,
          `drainageProperties.horizontalPipeSizing.${index}.sizeMM`,
          newSize || lastPipeSize // select last size from the list if no higher
        );
      }
    });
  }

  @Watch("selectedSystem.networks.CONNECTIONS.material")
  handleConnectionsMaterialChange(val: string, oldVal: string) {
    setPropertyByString(this.selectedSystem, "networks.CONNECTIONS.minimumPipeSize", this.pipeSizes[val][0].key);

    const selectedMaterialPipeSizes = this.pipeSizes[val];
    const lastPipeSize = selectedMaterialPipeSizes[selectedMaterialPipeSizes.length - 1].key;
    // adjust property values that relies on this property
    // drainageProperties.ventSizing
    this.selectedSystem.drainageProperties.ventSizing.forEach((sPSizeItem, index) => {
      if (selectedMaterialPipeSizes.findIndex((pSizeItem) => pSizeItem.key === sPSizeItem.sizeMM) === -1) {
        // Getting next/above current size if not exist is safe
        const newSize = getNextPipeSize(
          sPSizeItem.sizeMM,
          selectedMaterialPipeSizes.map((size) => size.key)
        );
        setPropertyByString(
          this.selectedSystem,
          `drainageProperties.ventSizing.${index}.sizeMM`,
          newSize || lastPipeSize // select last size from the list if no higher
        );
      }
    });

    // drainageProperties.stackVentPipeSizing
    this.selectedSystem.drainageProperties.stackVentPipeSizing.forEach((sPSizeItem, index) => {
      if (this.pipeSizes[val].findIndex((pSizeItem) => pSizeItem.key === sPSizeItem.sizeMM) === -1) {
        // Getting next/above current size if not exist is safe
        const newSize = getNextPipeSize(
          sPSizeItem.sizeMM,
          this.pipeSizes[val].map((size) => size.key)
        );
        setPropertyByString(
          this.selectedSystem,
          `drainageProperties.stackVentPipeSizing.${index}.sizeMM`,
          newSize || lastPipeSize // select last size from the list if no higher
        );
      }
    });
  }

  handleFluidChange() {
    this.resolveSystem(this.selectedSystem.uid, this.selectedSystem.fluid);
  }

  addNewSystem() {
    this.resolveSystem(uuid());

    this.selectedSystemId = this.flowSystems.length - 1;
  }

  selectSystem(value: number) {
    if (value === this.selectedSystemId) {
      return;
    }
    if ((this.$refs.fields as any).leave()) {
      this.selectedSystemId = value;
    } else {
      // nup
    }
  }

  deleteSystem() {
    const flowSystem = this.document.drawing.metadata.flowSystems.find((item: FlowSystemParameters) => {
      return item.name === this.selectedSystem.name;
    });

    const GlobalStoreObjects = Array.from(this.globalStore.values());
    const foundedObj = GlobalStoreObjects.find((item: any) => {
      return (
        item &&
        item.entity &&
        item.entity.systemUid &&
        flowSystem &&
        flowSystem.uid &&
        item.entity.systemUid == flowSystem.uid
      );
    });
    if (foundedObj) {
      this.$bvToast.toast(
        `Please remove all pipework and associated fittings from the project before deleting the flow system`,
        {
          title: `Flow system is in use`,
          variant: "danger"
        }
      );
    } else {
      if (window.confirm("Are you sure you want to delete " + this.selectedSystem.name + "?")) {
        this.document.drawing.metadata.flowSystems.splice(this.selectedSystemId, 1);
        this.selectedSystemId = 0;
        this.$store.dispatch("document/commit");
      }
    }
  }

  resolveSystem(uid: string, fluid = "water") {
    const defaultFlowSystemsMap = arrayToMap(initialDrawing(this.document.locale).metadata.flowSystems, "uid");
    const flowSystemsMap = arrayToMap(this.document.drawing.metadata.flowSystems, "uid");

    let defaultProps;
    if (fluid === "water") {
      defaultProps = defaultFlowSystemsMap.get("cold-water")!;
    }

    if (fluid === "naturalGas" || fluid === "LPG") {
      defaultProps = defaultFlowSystemsMap.get("gas")!;
      defaultProps.fluid = fluid;
    }

    if (fluid === "sewage") {
      defaultProps = defaultFlowSystemsMap.get("sewer-drainage")!;
    }

    if (!!defaultProps) {
      flowSystemsMap.set(uid, {
        ...defaultProps,
        uid,
        name: flowSystemsMap.get(uid)?.name || "New Flow System"
      });

      this.document.drawing.metadata.flowSystems = mapToArray(flowSystemsMap);
    }
  }

  save() {
    this.$store.dispatch("document/commit", { skipUndo: true }).then(() => {
      (this as any).$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
    });
  }

  back() {
    this.$router.push({ name: "drawing" });
  }
}
</script>

<style lang="less"></style>
