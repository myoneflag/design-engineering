<template>
  <b-container>
    <b-row>
      <b-col>
        <h3>{{ name }} ({{ selectedEntity.name }})</h3>
      </b-col>
    </b-row>

    <PropertiesFieldBuilder
      :fields="fields"
      :reactive-data="reactiveData"
      :default-data="defaultData"
      :on-commit="onCommit"
      :on-change="onChange"
    >
      <template v-for="slot in ['plant.capacity', 'plant.rheemPeakHourCapacity']" v-slot:[slot]="{ field }">
        <div :key="slot" class="field-slot">
          <b-dropdown
            v-if="slot === 'plant.capacity'"
            class="float-left"
            size="sm"
            id="dropdown-1"
            :text="choiceName(getPropertyByString(defaultData, field.property), field.params.choices)"
            variant="outline-secondary"
            :disabled="isDisabled(field)"
          >
            <b-dropdown-item
              v-for="(choice, index) in field.params.choices"
              @click="setPropertyByString(reactiveData, field.property, choice.key)"
              :key="index"
              size="sm"
            >
              {{ choice.name }}
            </b-dropdown-item>
          </b-dropdown>

          <b-input-group v-if="slot === 'plant.rheemPeakHourCapacity'" size="sm" append="L">
            <b-form-input
              :id="'input-' + field.property"
              :min="field.params.min"
              :max="field.params.max || undefined"
              type="number"
              :placeholder="'Enter ' + field.title"
              :disabled="readonly"
              :value="getPropertyByString(defaultData, field.property)"
              @input="setPropertyByString(reactiveData, field.property, $event)"
            ></b-form-input>
          </b-input-group>

          <span
            class="d-inline-flex circle-border border border-primary rounded-circle text-primary"
            style="margin: 4px 6px; padding: 4px"
            v-b-modal="slot"
          >
            <v-icon name="info" style="width: 12px; height: 12px"></v-icon>
          </span>
        </div>
      </template>
    </PropertiesFieldBuilder>

    <b-row>
      <b-col>
        <b-button size="sm" variant="danger" @click="onDelete"> Delete </b-button>
      </b-col>
    </b-row>

    <b-modal id="plant.capacity" centered title="Size Guide" hide-footer>
      <img src="@/assets/Grease_Interceptor_Trap_Size_Guide.png" />
    </b-modal>

    <b-modal id="plant.rheemPeakHourCapacity" centered title="Size Guide" hide-footer>
      <img src="@/assets/Hot_Water_Plant_Size_Guide.png" />
    </b-modal>
  </b-container>
</template>

<script lang="ts">
import uuid from "uuid";
import Vue from "vue";
import Component from "vue-class-component";
import { Watch, Prop } from "vue-property-decorator";
import PropertiesFieldBuilder from "../../../components/editor/lib/PropertiesFieldBuilder.vue";
import { DocumentState } from "../../../store/document/types";
import { DrawingMode } from "../../../htmlcanvas/types";
import { DrawingContext } from "../../../htmlcanvas/lib/types";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
import BaseBackedObject from "../../../htmlcanvas/lib/base-backed-object";
import PlantEntity, {
  fillPlantDefaults,
  makePlantEntityFields,
} from "../../../../../common/src/api/document/entities/plants/plant-entity";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import { Choice } from "../../../../../common/src/lib/utils";
import { getEntityName, EntityType } from "../../../../../common/src/api/document/entities/types";
import { PropertyField } from "../../../../../common/src/api/document/entities/property-field";
import {
  DrainageGreaseInterceptorTrap,
  RheemVariantValues,
  ReturnSystemPlant,
} from "../../../../../common/src/api/document/entities/plants/plant-types";
import PipeEntity from "../../../../../common/src/api/document/entities/pipe-entity";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import { SystemNodeEntity } from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { getPropertyByString, setPropertyByString } from "../../../lib/utils";
import { checkEntityUpdates } from "../../../api/upgrader";

@Component({
  components: { PropertiesFieldBuilder },
})
export default class PlantProperties extends Vue {
  getPropertyByString = getPropertyByString;
  setPropertyByString = setPropertyByString;

  @Prop()
  drawingContext: DrawingContext;

  @Prop()
  selectedEntity: PlantEntity;

  @Prop()
  selectedObject: BaseBackedObject;

  @Prop()
  onDelete: () => void;

  @Prop()
  onChange: () => void;

  get globalStore(): GlobalStore {
    return this.$props.selectedObject.globalStore;
  }

  get readonly() {
    return this.document.uiState.viewOnly;
  }

  get fields() {
    return makePlantEntityFields(
      this.defaultCatalog,
      this.document.drawing,
      this.$props.selectedEntity,
      this.document.drawing.metadata.flowSystems
    );
  }

  get name() {
    return getEntityName(this.$props.selectedEntity, this.document.drawing);
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get defaultCatalog(): Catalog {
    return this.$store.getters["catalog/default"];
  }

  get reactiveData(): PlantEntity {
    return this.$props.selectedEntity;
  }

  get defaultData(): PlantEntity {
    return fillPlantDefaults(this.$props.selectedEntity, this.document.drawing, this.defaultCatalog);
  }

  mounted() {
    // Check for update before applying some changes
    // This should be called inside builder component but lets keep this here for now
    checkEntityUpdates(this.reactiveData) && this.onCommit();
  }

  onCommit() {
    this.$store.dispatch("document/validateAndCommit");
  }

  choiceName(key: string, choices: Choice[]): string {
    const result = choices.find((c) => c.key === key);
    if (result) {
      return result.name;
    }
    return key + " (not found...)";
  }

  isDisabled(field: PropertyField) {
    return (
      this.readonly ||
      field.readonly ||
      !field.requiresInput ||
      ((field.isCalculated || field.hasDefault) &&
        getPropertyByString(this.reactiveData, field.property, true) === null)
    );
  }

  @Watch("reactiveData.plant.location")
  @Watch("reactiveData.plant.position")
  @Watch("reactiveData.plant.capacity")
  handleGreaseInterceptorTrapSizeUpdate() {
    const plant = this.defaultData.plant as DrainageGreaseInterceptorTrap;
    const manufacturer = this.document.drawing.metadata.catalog.greaseInterceptorTrap![0].manufacturer;
    const size =
      this.defaultCatalog.greaseInterceptorTrap!.size[manufacturer][plant.location!]?.[plant.position!]?.[
        plant.capacity!
      ];

    if (!!size) {
      setPropertyByString(this.reactiveData, "plant.lengthMM", size.lengthMM);
      setPropertyByString(this.reactiveData, "widthMM", size.widthMM);
      this.onCommit();
    }
  }

  @Watch("reactiveData.plant.rheemVariant")
  handleRheemVariantUpdate(newVal: RheemVariantValues, oldVal: RheemVariantValues) {
    if (oldVal === RheemVariantValues.tankpak) {
      this.clearTankpakValues();
    } else if (oldVal === RheemVariantValues.electric) {
      this.clearElectricValues();
    } else if (oldVal === RheemVariantValues.heatPump) {
      this.clearHeatPumpValues();
    }

    if ([RheemVariantValues.electric, RheemVariantValues.heatPump].includes(newVal)) {
      this.disconnectGasPipe();
    }

    this.onCommit();
  }

  private disconnectGasPipe() {
    const gasNodeUid = (this.reactiveData.plant as ReturnSystemPlant).gasNodeUid;
    const cons = this.globalStore.getConnections(gasNodeUid);

    if (cons.length > 0) {
      const gasNode = this.globalStore.get(gasNodeUid)?.entity as SystemNodeEntity;
      const gasPipe = this.globalStore.get(cons[0])?.entity as PipeEntity;
      const { center } = this.reactiveData;

      const fitting: FittingEntity = {
        uid: uuid(),
        type: EntityType.FITTING,
        systemUid: gasPipe.systemUid,
        color: gasPipe.color,
        center: {
          x: center.x - Math.abs(gasNode.center.x) - 200,
          y: center.y + Math.abs(gasNode.center.y),
        },
        parentUid: null,
        calculationHeightM: null,
      };

      this.$store.dispatch("document/addEntity", fitting);

      this.$store.dispatch("document/updatePipeEndpoints", {
        entity: gasPipe,
        endpoints: [
          gasPipe.endpointUid[0] === gasNodeUid ? fitting.uid : gasPipe.endpointUid[0],
          gasPipe.endpointUid[1] === gasNodeUid ? fitting.uid : gasPipe.endpointUid[1],
        ],
      });
    }
  }

  private clearTankpakValues() {
    setPropertyByString(this.reactiveData, "plant.rheemPeakHourCapacity", null);
  }

  private clearElectricValues() {
    setPropertyByString(this.reactiveData, "plant.rheemPeakHourCapacity", null);
    setPropertyByString(this.reactiveData, "plant.rheemMinimumInitialDelivery", null);
  }

  private clearHeatPumpValues() {
    setPropertyByString(this.reactiveData, "plant.rheemPeakHourCapacity", null);
    setPropertyByString(this.reactiveData, "plant.rheemkWRating", null);
    setPropertyByString(this.reactiveData, "plant.rheemStorageTankSize", null);
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

.modal-dialog {
  max-width: max-content;
}

.field-slot {
  display: flex;
}
</style>
