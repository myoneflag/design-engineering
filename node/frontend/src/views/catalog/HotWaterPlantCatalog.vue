<template>
  <div>
    <b-row v-if="inCatalogScreen('hotWaterPlant-circulatingPumps')" style="margin-top: 25px; margin-bottom: 25px;">
      <b-col cols="12">
        <h4 style="text-align: left">
          <router-link :to="{ name: 'settings/catalog', params: { prop: 'hotWaterPlant-circulatingPumps' } }">
            Heated Water Circulating Pumps
          </router-link>
          <span v-if="!$route.params.prop">
            <b-button
              v-b-toggle="'collapse-hotWaterPlant-circulatingPumps'"
              class="float-right"
              size="sm"
              variant="primary"
            >
              Show / Hide
            </b-button>
          </span>
        </h4>
      </b-col>

      <b-col cols="12">
        <b-collapse id="collapse-hotWaterPlant-circulatingPumps" v-if="!$route.params.prop">
          <b-form-group :label-cols="3" label="Manufacturer" class="manufacturer-field mt-4">
            <b-button
              v-for="manufacturer in manufacturers.circulatingPumps"
              :key="manufacturer.name + '-circulatingPumps'"
              size="sm"
              :class="'manufacturer-item-btn'"
              :variant="
                (isSelectedManufacturer('circulatingPumps', manufacturer.uid) && 'primary') || 'outline-primary'
              "
              @click="(e) => handleManufacturerClick('circulatingPumps', manufacturer.uid)"
            >
              {{ manufacturer.name }}
            </b-button>
          </b-form-group>

          <b-table
            v-if="isGrundfosManufacturer"
            striped
            responsive
            selectable
            select-mode="single"
            :items="grundfosItems"
            :fields="['grundfos_settings']"
            @row-selected="(d) => onRowClick('hotWaterPlant-circulatingPumps', d)"
          >
          </b-table>
        </b-collapse>
        <template v-else>
          <div class="catalog-container">
            <b-form-group label="Manufacturer" v-slot="{ ariaDescribedby }">
              <b-form-radio-group
                buttons
                name="manufacturer"
                button-variant="outline-primary"
                :aria-describedby="ariaDescribedby"
                :options="manufacturers.circulatingPumps.map((i) => ({ text: i.name, value: i.uid }))"
                v-model="form.manufacturer"
                @change="(v) => handleManufacturerClick('circulatingPumps', v)"
              ></b-form-radio-group>
            </b-form-group>

            <template v-if="isGrundfosManufacturer">
              <b-form-group label="Grundfos Settings" v-slot="{ ariaDescribedby }">
                <b-form-radio-group
                  stacked
                  buttons
                  name="setting"
                  button-variant="outline-primary"
                  :aria-describedby="ariaDescribedby"
                  :options="grundfosItems.map((i) => ({ text: i.grundfos_settings, value: i._key }))"
                  v-model="form.setting"
                  @change="handleSelectSettingClick"
                ></b-form-radio-group>
              </b-form-group>

              <b-table
                small
                striped
                responsive
                fixed
                :items="getGrundfosSettingTable(this.form.setting)"
                :fields="[
                  { key: 'q', label: 'Q (l/s)' },
                  { key: 'h', label: 'H (k Pa)' }
                ]"
                class="text-center"
                style="margin-top: 25px; margin-bottom: 0px;"
              ></b-table>
            </template>
          </div>
        </template>
      </b-col>
    </b-row>
    <b-row v-if="inCatalogScreen('hotWaterPlant')" style="margin-top: 25px; margin-bottom: 25px;">
      <b-col cols="12">
        <h4 style="text-align: left">
          <router-link :to="{ name: 'settings/catalog', params: { prop: 'hotWaterPlant' } }">
            Heated Water Plant
          </router-link>
          <span v-if="!$route.params.prop">
            <b-button v-b-toggle="'collapse-hotWaterPlant'" class="float-right" size="sm" variant="primary">
              Show / Hide
            </b-button>
          </span>
        </h4>
      </b-col>

      <b-col cols="12">
        <b-collapse id="collapse-hotWaterPlant" v-if="!$route.params.prop">
          <b-form-group :label-cols="3" label="Manufacturer" class="manufacturer-field mt-4">
            <b-button
              v-for="manufacturer in manufacturers.hotWaterPlant"
              :key="manufacturer.name"
              size="sm"
              :class="'manufacturer-item-btn'"
              :variant="(isSelectedManufacturer('hotWaterPlant', manufacturer.uid) && 'primary') || 'outline-primary'"
              @click="(e) => handleManufacturerClick('hotWaterPlant', manufacturer.uid)"
            >
              {{ manufacturer.name }}
            </b-button>
          </b-form-group>

          <b-table
            v-if="isRheemManufacturer"
            striped
            responsive
            selectable
            select-mode="single"
            :items="rheemItems"
            :fields="['rheem_variants']"
            @row-selected="(d) => onRowClick('hotWaterPlant', d)"
          >
          </b-table>
        </b-collapse>
        <template v-else>
          <div class="catalog-container">
            <b-form-group label="Manufacturer" v-slot="{ ariaDescribedby }">
              <b-form-radio-group
                buttons
                name="manufacturer"
                button-variant="outline-primary"
                :aria-describedby="ariaDescribedby"
                :options="manufacturers.hotWaterPlant.map((i) => ({ text: i.name, value: i.uid }))"
                v-model="form.manufacturer"
                @change="(v) => handleManufacturerClick('hotWaterPlant', v)"
              ></b-form-radio-group>
            </b-form-group>

            <template v-if="isRheemManufacturer">
              <b-form-group label="Rheem Variants" v-slot="{ ariaDescribedby }">
                <b-form-radio-group
                  buttons
                  name="variant"
                  button-variant="outline-primary"
                  :aria-describedby="ariaDescribedby"
                  :options="rheemItems.map((i) => ({ text: i.rheem_variants, value: i._key }))"
                  v-model="form.variant"
                  @change="handleSelectVariantClick"
                ></b-form-radio-group>
              </b-form-group>

              <b-table
                small
                striped
                responsive
                sticky-header="600px"
                :items="getRheemVariantTable(this.form.variant)"
                :fields="rheemFields"
                class="text-nowrap"
                style="margin-top: 25px; margin-bottom: 0px;"
              ></b-table>
              <br />
              <br />

              <template v-if="form.variant === 'heatPump'">
                <h4 class="text-primary">Storage Tanks</h4>
                <b-table
                  small
                  striped
                  responsive
                  :items="getStorageTanksTable()"
                  :fields="storageTanksFields"
                  class="text-nowrap"
                  style="margin-top: 25px; margin-bottom: 0px;"
                ></b-table>
              </template>
            </template>
          </div>
        </template>
      </b-col>
    </b-row>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { RawLocation } from "vue-router";
import { HotWaterPlant } from "../../../../common/src/api/catalog/types";
import {
  HotWaterPlantCatalogList,
  CirculatingPumpsManufacturers,
  HotWaterPlantGrundfosSettingsName,
  HotWaterPlantManufacturers,
  RheemVariantValues
} from "../../../../common/src/api/document/entities/plants/plant-types";
import { flatten } from "../../../../common/src/lib/utils";
import { DocumentState } from "../../store/document/types";

type CatalogScreen = "hotWaterPlant" | "hotWaterPlant-circulatingPumps";

type ManufacturerProps = {
  uid: CirculatingPumpsManufacturers | HotWaterPlantManufacturers;
  name: string;
  abbreviation: string;
  priceTableName: keyof typeof HotWaterPlantCatalogList;
  returns?: boolean;
};

type O<P> = {
  [K in keyof P]: ManufacturerProps[];
};

type Manufacturers = O<typeof HotWaterPlantCatalogList>;

type Form = {
  manufacturer: CirculatingPumpsManufacturers | HotWaterPlantManufacturers;
  setting: keyof typeof HotWaterPlantGrundfosSettingsName;
  variant: keyof typeof RheemVariantValues;
};

@Component
export default class HotWaterPlantCatalog extends Vue {
  form: Form = {
    manufacturer: "generic",
    setting: "20-60-1",
    variant: "continuousFlow"
  };

  readonly storageTanksFields = [
    { key: "model", label: "Model" },
    { key: "capacity", label: "Capacity (L)" },
    { key: "widthMM", label: "Width (mm)" },
    { key: "depthMM", label: "Depth (mm)" }
  ];

  mounted() {
    this.resolveForm();
  }

  get catalog(): HotWaterPlant {
    return this.$store.getters["catalog/default"].hotWaterPlant;
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get paths(): Array<{ text: string; to: RawLocation }> {
    const props: string[] = [];
    if (this.$route.params.prop) {
      props.push(...this.$route.params.prop.split("."));
    }
    const retVal: Array<{ text: string; to: RawLocation }> = [{ text: "database", to: { name: "settings/catalog" } }];
    let curPath = "";
    for (const prop of props) {
      if (curPath.length) {
        curPath += ".";
      }
      curPath += prop;
      retVal.push({ text: prop, to: { name: "settings/catalog", params: { prop: curPath } } });
    }
    return retVal;
  }

  get manufacturers(): Manufacturers {
    return {
      hotWaterPlant: (this.catalog.manufacturer.filter((i) => !i.returns) as unknown) as ManufacturerProps[],
      circulatingPumps: (this.catalog.manufacturer.filter((i) => i.returns) as unknown) as ManufacturerProps[]
    };
  }

  get selectedManufacturers() {
    return {
      hotWaterPlant: this.document.drawing.metadata.catalog.hotWaterPlant.find((i) => i.uid === "hotWaterPlant"),
      hotWaterPlantCirculatingPumps: this.document.drawing.metadata.catalog.hotWaterPlant.find(
        (i) => i.uid === "circulatingPumps"
      )
    };
  }

  get grundfosItems() {
    return Object.keys(this.catalog.grundfosPressureDrop).map((i) => ({
      _key: i as keyof typeof HotWaterPlantGrundfosSettingsName,
      grundfos_settings: HotWaterPlantGrundfosSettingsName[i as keyof typeof HotWaterPlantGrundfosSettingsName]
    }));
  }

  get rheemItems() {
    return Object.keys(this.catalog.size.rheem!).map((i) => ({
      _key: i as keyof typeof HotWaterPlantGrundfosSettingsName,
      rheem_variants: this.catalog.rheemVariants.find((v) => v.uid === i)!.name
    }));
  }

  get rheemFields() {
    let fields = [
      { key: "heaters", label: "Heaters", stickyColumn: true },
      { key: "widthMM", label: "Width (mm)" },
      { key: "depthMM", label: "Depth (mm)" },
      { key: "flowRate.25", label: "1st Hour Delivery @ 25°C Rise (L)" },
      { key: "flowRate.30", label: "1st Hour Delivery @ 30°C Rise (L)" },
      { key: "flowRate.35", label: "1st Hour Delivery @ 35°C Rise (L)" },
      { key: "flowRate.40", label: "1st Hour Delivery @ 40°C Rise (L)" },
      { key: "flowRate.45", label: "1st Hour Delivery @ 45°C Rise (L)" },
      { key: "flowRate.50", label: "1st Hour Delivery @ 50°C Rise (L)" },
      { key: "flowRate.55", label: "1st Hour Delivery @ 55°C Rise (L)" },
      { key: "flowRate.60", label: "1st Hour Delivery @ 60°C Rise (L)" },
      { key: "flowRate.65", label: "1st Hour Delivery @ 65°C Rise (L)" },
      { key: "flowRate.70", label: "1st Hour Delivery @ 70°C Rise (L)" },
      { key: "gas.requirement", label: "Gas Requirements (mj/hr)" },
      { key: "gas.pressure", label: "Gas Inlet Pressure (kPa)" }
    ];

    if (this.form.variant === "continuousFlow") {
      fields.splice(
        3,
        10,
        ...[
          { key: "flowRate.25", label: "Flow Rate @ 25°C Rise (L/sec)" },
          { key: "flowRate.30", label: "Flow Rate @ 30°C Rise (L/sec)" },
          { key: "flowRate.35", label: "Flow Rate @ 35°C Rise (L/sec)" },
          { key: "flowRate.40", label: "Flow Rate @ 40°C Rise (L/sec)" },
          { key: "flowRate.45", label: "Flow Rate @ 45°C Rise (L/sec)" },
          { key: "flowRate.50", label: "Flow Rate @ 50°C Rise (L/sec)" },
          { key: "flowRate.55", label: "Flow Rate @ 55°C Rise (L/sec)" },
          { key: "flowRate.60", label: "Flow Rate @ 60°C Rise (L/sec)" },
          { key: "flowRate.65", label: "Flow Rate @ 65°C Rise (L/sec)" },
          { key: "flowRate.70", label: "Flow Rate @ 70°C Rise (L/sec)" }
        ]
      );
    } else if (this.form.variant === "tankpak") {
      fields.splice(
        1,
        0,
        ...[
          { key: "tanks_325", label: "325L Tanks" },
          { key: "tanks_410", label: "410L Tanks" }
        ]
      );
    } else if (this.form.variant === "electric") {
      fields.splice(
        0,
        1,
        { key: "model", label: "Model", stickyColumn: true },
        { key: "minimumInitialDelivery", label: "Minimum Initial Delivery (L)" }
      );
      fields.splice(4, 0, { key: "flowRate.20", label: "1st Hour Delivery @ 20°C Rise (L)" });
      fields = fields.filter(
        (i) => !["flowRate.25", "flowRate.35", "flowRate.45", "flowRate.55", "flowRate.65"].includes(i.key)
      );
    } else if (this.form.variant === "heatPump") {
      fields.splice(
        0,
        1,
        { key: "model", label: "Model", stickyColumn: true },
        { key: "roomTemperature", label: "Ambient Temperature (degC)" }
      );
      fields.splice(
        4,
        10,
        ...[
          { key: "flowRate.20", label: "Recovery Rate @ 20°C Rise (L/hour)" },
          { key: "flowRate.25", label: "Recovery Rate @ 25°C Rise (L/hour)" },
          { key: "flowRate.30", label: "Recovery Rate @ 30°C Rise (L/hour)" },
          { key: "flowRate.35", label: "Recovery Rate @ 35°C Rise (L/hour)" },
          { key: "flowRate.40", label: "Recovery Rate @ 40°C Rise (L/hour)" },
          { key: "flowRate.45", label: "Recovery Rate @ 45°C Rise (L/hour)" },
          { key: "flowRate.50", label: "Recovery Rate @ 50°C Rise (L/hour)" },
          { key: "flowRate.55", label: "Recovery Rate @ 55°C Rise (L/hour)" }
        ]
      );
    }

    return fields;
  }

  get isGrundfosManufacturer() {
    return (
      (this.document.drawing.metadata.catalog.hotWaterPlant.find(
        (i) => i.uid === HotWaterPlantCatalogList["circulatingPumps"]
      )?.manufacturer as CirculatingPumpsManufacturers) === "grundfos"
    );
  }

  get isRheemManufacturer() {
    return (
      (this.document.drawing.metadata.catalog.hotWaterPlant.find(
        (i) => i.uid === HotWaterPlantCatalogList["hotWaterPlant"]
      )?.manufacturer as HotWaterPlantManufacturers) === "rheem"
    );
  }

  @Watch("paths")
  resolveForm() {
    if (this.inCatalogScreen("hotWaterPlant-circulatingPumps")) {
      this.form.manufacturer =
        (this.selectedManufacturers.hotWaterPlantCirculatingPumps?.manufacturer as CirculatingPumpsManufacturers) ||
        "generic";
      this.form.setting = (this.paths[2]?.text as keyof typeof HotWaterPlantGrundfosSettingsName) || "20-60-1";
    } else {
      this.form.manufacturer =
        (this.selectedManufacturers.hotWaterPlant?.manufacturer as HotWaterPlantManufacturers) || "generic";
      this.form.variant = (this.paths[2]?.text as keyof typeof RheemVariantValues) || "continuousFlow";
    }
  }

  inCatalogScreen(catalogScreen: CatalogScreen) {
    return this.paths[1]?.text === catalogScreen || this.paths.length === 1;
  }

  navigateLink(prop = "hotWaterPlant") {
    return {
      name: "settings/catalog",
      params: {
        prop
      }
    };
  }

  isSelectedManufacturer(
    catalog: keyof typeof HotWaterPlantCatalogList,
    manufacturer: CirculatingPumpsManufacturers | HotWaterPlantManufacturers
  ) {
    return (
      this.document.drawing.metadata.catalog.hotWaterPlant.find((i) => i.uid === catalog)!.manufacturer === manufacturer
    );
  }

  handleManufacturerClick(
    catalog: keyof typeof HotWaterPlantCatalogList,
    manufacturer: CirculatingPumpsManufacturers | HotWaterPlantManufacturers
  ) {
    this.document.drawing.metadata.catalog.hotWaterPlant.find((i) => i.uid === catalog)!.manufacturer = manufacturer;

    this.$store.dispatch("document/commit", { skipUndo: true }).then(() => {
      this.$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
    });
  }

  onRowClick(prop: string, params: Array<{ _key: keyof typeof HotWaterPlantGrundfosSettingsName }>) {
    this.form.setting = params[0]._key;
    this.$router.push(this.navigateLink(prop + "." + params[0]._key));
  }

  handleSelectSettingClick(setting: keyof typeof HotWaterPlantGrundfosSettingsName) {
    this.$router.push(this.navigateLink("hotWaterPlant-circulatingPumps" + "." + setting));
  }

  handleSelectVariantClick(variant: keyof typeof RheemVariantValues) {
    this.$router.push(this.navigateLink("hotWaterPlant" + "." + variant));
  }

  getGrundfosSettingTable(setting: keyof typeof HotWaterPlantGrundfosSettingsName) {
    return Object.entries(this.catalog.grundfosPressureDrop[setting] || {}).map(([q, h]) => ({
      q,
      h
    }));
  }

  getRheemVariantTable(variant: keyof typeof RheemVariantValues) {
    let data = Object.values(this.catalog.size.rheem![variant]!).map((size) => flatten(size));

    if (variant === RheemVariantValues.tankpak) {
      data = data.map((obj: any) => ({
        ...obj,
        tanks_325: obj.tanksCategoryL === "325" ? obj.tanks : "",
        tanks_410: obj.tanksCategoryL === "410" ? obj.tanks : ""
      }));
    }

    return data.sort((a: any, b: any) => {
      if (a["flowRate.30"] < b["flowRate.30"]) {
        return -1;
      }
      if (a["flowRate.30"] > b["flowRate.30"]) {
        return 1;
      }
      return 0;
    });
  }

  getStorageTanksTable() {
    return Object.values(this.catalog.storageTanks);
  }
}
</script>
<style lang="less" scoped>
.manufacturer-item-btn {
  display: block;
  width: 100%;
  margin-bottom: 6px;
}

.manufacturer-field .col {
  text-align: left;
}

.catalog-container {
  text-align: initial;
  margin-top: 25px;
}
</style>