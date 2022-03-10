<template>
  <div class="warningPanel">
    <b-row>
      <b-col>
        <b-form-checkbox style="white-space: nowrap;" v-model="document.uiState.warningFilter.showWarningsToPDF"
          >Display Warnings</b-form-checkbox
        >
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-checkbox style="white-space: nowrap;" v-model="document.uiState.warningFilter.showHiddenWarnings"
          >Show Hidden Warnings</b-form-checkbox
        >
      </b-col>
    </b-row>
    <b-row class="mt-4">
      <b-col cols="12" v-for="(level, index) in treeWarningsData" :key="index">
        <template v-if="getLevel(level.levelUid)">
          <div class="warning-level w-100 my-3">
            <p
              :aria-expanded="level.visible ? 'true' : 'false'"
              :aria-controls="level.levelUid"
              @click="toggleLevel(level.levelUid)"
              class="m-0 pr-3 level-text"
              :class="{ actived: document.uiState.levelUid === level.levelUid }"
            >
              <v-icon :name="level.visible ? 'caret-down' : 'caret-right'" scale="1" class="mr-2" />
              {{ getLevel(level.levelUid).abbreviation }} ({{ level.count }})
            </p>
          </div>
          <b-collapse :id="level.levelUid" :visible="level.visible" class="mt-2 w-100">
            <b-table
              :items="level.data"
              :fields="fields"
              responsive="lg"
              borderless
              small
              hover
              :busy="false"
              thead-class="d-none"
              class="level-table"
            >
              <template #cell(show_details)="row">
                <v-icon
                  v-if="row.item.children.length"
                  :name="row.detailsShowing ? 'minus-square' : 'plus-square'"
                  scale="1"
                  role="button"
                  @click.native="toggleType(row, level.levelUid)"
                  class="ml-2"
                />
              </template>
              <template #cell(label)="data">
                <label
                  v-if="data.item.children.length"
                  class="warning-label text-capitalize mb-0"
                >{{ data.value || "Unknown Warning Type" }}</label>
                <label
                  v-else
                  class="warning-label text-capitalize mb-0"
                  role="button"
                  @click="handleClickWarningTitle(data.item)"
                  v-b-popover.hover.top="'Click to View in the Result Mode'"
                >{{ data.value || "Unknown Title" }}</label>
              </template>
              <template #cell(action)="data">
                <b-row align-h="end">
                  <b-col cols="auto" v-if="data.item.children.length">
                    <v-icon
                      :name="data.item.hidden ? 'eye' : 'eye-slash'"
                      class="mr-2"
                      scale="1"
                      role="button"
                      @click.native="
                        toggleGroupWarning(
                          data.item.children.map((e) => e.uid),
                          data.item.hidden
                        )
                      "
                      v-b-popover.hover.top="`Click to ${data.item.hidden ? 'Show' : 'Hide'} the Warnings`"
                    />
                    <a v-if="data.item.helpLink" :href="data.item.helpLink" target="_blank" class="help-link">
                      <v-icon
                        name="info-circle"
                        class="mr-2"
                        scale="1"
                        :id="'help_link_' + data.item.uid"
                      />
                    </a>
                    <v-icon
                      v-else
                      name="info-circle"
                      class="mr-2"
                      scale="1"
                      :id="'help_link_' + data.item.uid"
                    />
                  </b-col>
                  <b-col cols="auto" v-else>
                    <v-icon
                      name="edit"
                      class="mr-2"
                      scale="1"
                      role="button" 
                      @click.native="editEntity(data.item)"
                      v-b-popover.hover.top="'Click to Edit in the Plumbing Mode'"
                    />
                    <v-icon
                      :name="isHiddenWarning(data.item.uid) ? 'eye' : 'eye-slash'"
                      class="mr-2"
                      scale="1"
                      role="button"
                      @click.native="toggleWarning(data.item.uid)"
                      v-b-popover.hover.top="`Click to ${isHiddenWarning(data.item.uid) ? 'Show' : 'Hide'} the Warning`"
                    />
                    <a v-if="data.item.helpLink" :href="data.item.helpLink" target="_blank" class="help-link">
                      <v-icon
                        name="info-circle"
                        class="mr-2"
                        scale="1"
                        :id="'help_link_' + data.item.uid"
                      />
                    </a>
                    <v-icon
                      v-else
                      name="info-circle"
                      class="mr-2"
                      scale="1"
                      :id="'help_link_' + data.item.uid"
                    />
                  </b-col>
                  <b-popover v-if="data.item.description" :target="'help_link_' + data.item.uid" triggers="hover" placement="topright">
                    <div v-html="data.item.description" />
                    <template v-if="data.item.helpLink">
                      More details <a :href="data.item.helpLink" target="_blank">here</a>
                    </template>
                  </b-popover>
                </b-row>
              </template>

              <template #row-details="row">
                <b-table
                  v-if="row.item.children.length"
                  :items="row.item.children"
                  :fields="fields"
                  responsive="lg"
                  borderless
                  small
                  hover
                  :busy="false"
                  thead-class="d-none"
                  class="type-table mb-0"
                >
                  <template #cell(show_details)>└</template>
                  <template #cell(label)="data">
                    <label
                      class="warning-label text-capitalize mb-0"
                      role="button"
                      @click="handleClickWarningTitle(data.item)"
                      v-b-popover.hover.top="'Click to View in the Result Mode'"
                    >{{ data.value }}</label>
                  </template>
                  <template #cell(action)="data">
                    <b-row align-h="end">
                      <b-col cols="auto">
                        <v-icon
                          name="edit"
                          class="mr-2"
                          scale="1"
                          role="button"
                          @click.native="editEntity(data.item)"
                          v-b-popover.hover.top="'Click to Edit in the Plumbing Mode'"
                        />
                        <v-icon
                          :name="isHiddenWarning(data.item.uid) ? 'eye' : 'eye-slash'"
                          class="mr-2rem"
                          scale="1"
                          role="button"
                          @click.native="toggleWarning(data.item.uid)"
                          v-b-popover.hover.top="`Click to ${isHiddenWarning(data.item.uid) ? 'Show' : 'Hide'} the Warning`"
                        />
                      </b-col>
                    </b-row>
                  </template>
                </b-table>
              </template>
            </b-table>
          </b-collapse>
        </template>
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import { globalStore } from "../../store/document/mutations";
import { DocumentState } from "../../store/document/types";
import { Level } from "../../../../common/src/api/document/drawing";
import { isCalculated } from "../../store/document/calculations";
import { WarningUi, getTreeDataOfWarnings, WarningDetails, Warning } from "../../store/document/calculations/warnings";
import { DrawingMode } from '../../htmlcanvas/types';
import * as _ from "lodash";

@Component({
  components: {},
  props: {
    objects: Array,
    onChange: Function,
    canvasContext: Object
  }
})
export default class Warnings extends Vue {
  fields: Array<string> = ["show_details", "label", "action"];

  mounted() {
    this.$watch(
      () => this.document.uiState.warningFilter.showHiddenWarnings,
      () => this.$props.onChange()
    );
    this.$watch(
      () => this.document.uiState.warningFilter.showWarningsToPDF,
      () => this.$props.onChange()
    );
  }

  get globalStore(): GlobalStore {
    return globalStore;
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get sortedLevels(): Level[] {
    return this.$store.getters["document/sortedLevels"];
  }

  get treeWarningsData(): any[] {
    return getTreeDataOfWarnings(this.document.documentId, this.warnings, this.document.uiState.warningFilter, this.document.uiState.pressureOrDrainage);
  }

  get warnings(): WarningUi[] {
    let allWarnings: WarningUi[] = [];

    for (const o of this.globalStore.values()) {
      if (isCalculated(o.entity)) {
        const calculation = this.globalStore.getCalculation(o.entity);
        allWarnings = [
          ...allWarnings,
          ...(calculation?.warnings?.map((w) => ({
            ...w,
            entityUid: o.entity.uid,
            levelUid: this.globalStore.levelOfEntity.get(o.entity.uid)!
          })) || [])
        ];
      }
    }

    return allWarnings;
  }

  get WarningDetails() {
    return WarningDetails;
  }

  get Warning() {
    return Warning;
  }

  getLevel(levelUid: string | null): Level {
    return this.sortedLevels.find((e) => e.uid === levelUid)!;
  }

  isHiddenWarning(warningUid: string): boolean {
    return this.document.uiState.warningFilter.hiddenUids.includes(warningUid);
  }

  toggleLevel(levelUid: string) {
    let collapsedLevelType = this.document.uiState.warningFilter.collapsedLevelType;
    let targetLevelProperty = collapsedLevelType.find((e) => e.levelUid === levelUid);
    if (targetLevelProperty) {
      targetLevelProperty.visible = !targetLevelProperty.visible;
    } else {
      collapsedLevelType.push({
        levelUid,
        visible: true,
        types: []
      });
    }

    Vue.set(this.document.uiState.warningFilter, "collapsedLevelType", collapsedLevelType);
    Vue.set(this.document.uiState.warningFilter, "activeEntityUid", "");
    Vue.set(this.document.uiState, "selectedUids", []);
  }

  toggleType(row: any, levelUid: string) {
    let collapsedLevelType = this.document.uiState.warningFilter.collapsedLevelType;
    collapsedLevelType = collapsedLevelType.map((e) => {
      if (e.levelUid === levelUid) {
        if (row.detailsShowing) {
          return {
            ...e,
            types: e.types.filter((e) => e !== row.item.type)!
          };
        } else {
          return {
            ...e,
            types: [...e.types, row.item.type]
          };
        }
      } else {
        return e;
      }
    });

    Vue.set(this.document.uiState.warningFilter, "collapsedLevelType", collapsedLevelType);
    Vue.set(this.document.uiState.warningFilter, "activeEntityUid", "");
    Vue.set(this.document.uiState, "selectedUids", []);
  }

  toggleWarning(uid: string, shouldChange: boolean = true) {
    let hiddenUids = this.document.uiState.warningFilter.hiddenUids;
    if (hiddenUids.includes(uid)) {
      hiddenUids = hiddenUids.filter((e) => e !== uid);
    } else {
      hiddenUids.push(uid);
    }

    Vue.set(this.document.uiState.warningFilter, "hiddenUids", hiddenUids);

    if (shouldChange) {
      this.$props.onChange();
    }
  }

  toggleGroupWarning(uids: Array<string>, hidden: boolean, shouldChange: boolean = true) {
    let hiddenUids = this.document.uiState.warningFilter.hiddenUids;
    if (!hidden) {
      hiddenUids = _.uniq([...hiddenUids, ...uids]);
    } else {
      hiddenUids = hiddenUids.filter((e) => !uids.includes(e));
    }

    Vue.set(this.document.uiState.warningFilter, "hiddenUids", hiddenUids);

    if (shouldChange) {
      this.$props.onChange();
    }
  }

  /** Handle Click edit icon of Warning Popup */
  editEntity(warning: WarningUi) {
    Vue.set(this.document.uiState, "drawingMode", DrawingMode.Hydraulics);
    this.$emit("level-changed", warning.levelUid);
    this.$store.dispatch("document/setCurrentLevelUid", warning.levelUid);
    Vue.set(this.document.uiState, "pressureOrDrainage", warning.warningLayout || "pressure");
    Vue.set(this.document.uiState.warningFilter, "editEntityUid", warning.entityUid);
  }

  /** Handle Click text of Warning Popup */
  handleClickWarningTitle(warning: WarningUi) {
    this.$emit("level-changed", warning.levelUid);
    this.$store.dispatch("document/setCurrentLevelUid", warning.levelUid);
    Vue.set(this.document.uiState, "pressureOrDrainage", warning.warningLayout || "pressure");
    Vue.set(this.document.uiState.warningFilter, "activeEntityUid", warning.entityUid);
  }
}
</script>

<style lang="less" scoped>
.warningPanel {
  position: fixed;
  top: 15%;
  right: 20px;
  min-width: 500px;
  max-width: 500px;
  min-height: 100px;
  background: white;
  border: gray solid 1px;
  border-radius: 5px;
  padding: 20px;

  max-height: -webkit-calc(125vh - 30px);
  overflow-y: auto;
  overflow-x: hidden;
  text-align: left;

  font-size: 14px;
}

.warning-level {
  cursor: pointer;
  outline: none;
  border: 1px solid rgb(206, 206, 206);
  height: 0;
  position: relative;
  & .level-text {
    position: absolute;
    top: 0;
    left: 0;
    background: white;
    transform: translateY(-50%);
    outline: none;
    text-transform: uppercase;
    &.actived {
      color: #007bff;
    }
  }
}

.level-table /deep/ table > tbody > tr {
  font-size: 13px;
  &.table-hidden {
    opacity: 0.5;
  }
  &.table-active-hidden {
    opacity: 0.5;
    & label {
      color: #007bff;
    }
  }
  &.table-active {
    & label {
      color: #007bff;
    }
  }
  &.b-table-details {
    outline: none;
    & td {
      padding-right: 0.14rem;
    }
  }
  & > td {
    &:first-of-type {
      width: 32px;
    }
    &:nth-of-type(2) {
      padding-right: 0;
    }
    &:nth-of-type(3) {
      padding-left: 0;
    }
    & .mr-2rem {
      margin-right: 2rem !important;
    }
    & .warning-label {
      max-width: 325px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow-x: hidden;
    }
  }
}

.type-table /deep/ table > tbody > tr {
  font-size: 13px;
  &.table-hidden {
    opacity: 0.5;
  }
  &.table-active-hidden {
    opacity: 0.5;
    & label {
      color: #007bff;
    }
  }
  &.table-active {
    & label {
      color: #007bff;
    }
  }
  & > td {
    &:first-of-type {
      text-align: right;
      width: 40px;
    }
    & .warning-label {
      max-width: 315px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow-x: hidden;
    }
  }
}

.fa-icon {
  pointer-events: all;
}

a.help-link {
  color: inherit;
}
</style>
