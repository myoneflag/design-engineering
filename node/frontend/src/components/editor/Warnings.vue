<template>
  <div class="warningPanel">
    <b-row>
      <b-col>
        <b-form-checkbox style="white-space: nowrap;" v-model="showWarnings">Display Warnings</b-form-checkbox>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-checkbox
          style="white-space: nowrap;"
          v-model="showHiddenWarnings"
        >Show Hidden warnings</b-form-checkbox>
      </b-col>
    </b-row>
    <b-row class="mt-4">
      <b-col cols="12" v-for="(level, index) in treeData" :key="index">
        <div class="warning-level w-100 my-3">
          <p v-b-toggle="level.name" class="m-0 pr-3 level-text">
            <v-icon :name="level.visible ? 'caret-down' : 'caret-right'" scale="1" class="mr-2" />
            {{ level.name }} ({{ level.count }})
          </p>
        </div>
        <b-collapse :id="level.name" v-model="level.visible" class="mt-2 w-100">
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
                @click.native="row.toggleDetails"
                class="ml-2"
              />
            </template>
            <template #cell(label)="data">
              <label class="warning-label mb-0">{{ data.value }}</label>
            </template>
            <template #cell(action)="data">
              <b-row align-h="end">
                <b-col cols="auto" v-if="data.item.children.length">
                  <v-icon
                    :name="data.item.hidden ? 'eye' : 'eye-slash'"
                    class="mr-2rem"
                    scale="1"
                    @click.native="
                      toggleGroupWarning(data.item.children.map((e) => e.id), data.item.hidden)
                    "
                  />
                </b-col>
                <b-col cols="auto" v-else>
                  <v-icon name="edit" class="mr-2" scale="1" @click.native="showModal(data.item)" />
                  <v-icon
                    name="expand"
                    class="mr-2"
                    scale="1"
                    @click.native="showModal(data.item)"
                  />
                  <v-icon
                    :name="hiddenIds.includes(data.item.id) ? 'eye' : 'eye-slash'"
                    class="mr-2"
                    scale="1"
                    @click.native="toggleWarning(data.item.id)"
                  />
                  <v-icon
                    name="info-circle"
                    class="mr-2"
                    scale="1"
                    v-b-popover.hover.topright="data.item.description"
                    @click.native="goToHelpLink(data.item.helpLink)"
                  />
                </b-col>
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
                  <label class="warning-label mb-0">{{ data.value }}</label>
                </template>
                <template #cell(action)="data">
                  <b-row align-h="end">
                    <b-col cols="auto">
                      <v-icon
                        name="edit"
                        class="mr-2"
                        scale="1"
                        @click.native="showModal(data.item)"
                      />
                      <v-icon
                        name="expand"
                        class="mr-2"
                        scale="1"
                        @click.native="showModal(data.item)"
                      />
                      <v-icon
                        :name="hiddenIds.includes(data.item.id) ? 'eye' : 'eye-slash'"
                        class="mr-2"
                        scale="1"
                        @click.native="toggleWarning(data.item.id)"
                      />
                      <v-icon
                        name="info-circle"
                        class="mr-2"
                        scale="1"
                        v-b-popover.hover.topright="data.item.description"
                        @click.native="goToHelpLink(data.item.helpLink)"
                      />
                    </b-col>
                  </b-row>
                </template>
              </b-table>
            </template>
          </b-table>
        </b-collapse>
      </b-col>
    </b-row>
    <b-modal
      v-if="modalData"
      v-model="modalShow"
      centered
      :title="modalData.warning"
      ok-only
      button-size="sm"
    >
      <b-row>
        <b-col>Level:</b-col>
        <b-col cols="9" class="text-uppercase">{{ modalData.level }}</b-col>
      </b-row>
      <b-row>
        <b-col>Type:</b-col>
        <b-col cols="9">{{ modalData.type }}</b-col>
      </b-row>
      <b-row>
        <b-col>Warning:</b-col>
        <b-col cols="9">{{ modalData.warning }}</b-col>
      </b-row>
      <b-row>
        <b-col>Mode:</b-col>
        <b-col cols="9" class="text-capitalize">{{ modalData.mode }}</b-col>
      </b-row>
      <b-row>
        <b-col>Entity ID:</b-col>
        <b-col cols="9">{{ modalData.entity }}</b-col>
      </b-row>
      <b-row>
        <b-col>Help Link:</b-col>
        <b-col cols="9">
          <a :href="modalData.helpLink" target="_blank">{{ modalData.helpLink }}</a>
        </b-col>
      </b-row>
      <b-row>
        <b-col>Description:</b-col>
        <b-col cols="9">{{ modalData.description }}</b-col>
      </b-row>
      <b-row>
        <b-col>Deep link:</b-col>
        <b-col cols="9">/DOCID/design#l=g3&m=p&eid=123asdf&f</b-col>
      </b-row>
    </b-modal>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import { globalStore } from "../../store/document/mutations";
import { WarningType } from "../../lib/types";
import { getTreeDataOfWarnings } from "../../lib/utils";
import * as _ from "lodash";

@Component({
  components: {},
  props: {
    objects: Array,
    onChange: Function,
    canvasContext: Object
  }
})
export default class Warning extends Vue {
  showWarnings: boolean = true;
  showHiddenWarnings: boolean = false;
  hiddenIds: Array<string> = ["1", "2"];
  fields: Array<string> = ["show_details", "label", "action"];
  modalData: WarningType | null = null;
  modalShow: boolean = false;

  get globalStore(): GlobalStore {
    return globalStore;
  }

  get treeData(): any {
    return getTreeDataOfWarnings(this.warnings, this.showHiddenWarnings, this.hiddenIds);
  }

  get warnings(): WarningType[] {
    return [
      {
        id: "1",
        level: "g",
        warning: "Pressure at upstream",
        type: "Connect Fixture",
        description: "Pressure at upstream source/regulator needs to be higher than downstream regulator/appliance.",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "2",
        level: "g",
        warning: "Pressure upstream",
        type: "Connect Fixture",
        description: "Pressure at upstream source/regulator needs to be higher than downstream.",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "3",
        level: "g",
        warning: "Pressure at",
        type: "Connect Fixture",
        description: "Pressure at upstream needs to be higher than downstream regulator/appliance.",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "4",
        level: "g",
        warning: "Pressure at downstream",
        type: "Insoeficient presure",
        description: "Needs to be higher than downstream regulator/appliance.",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "5",
        level: "l1",
        warning: "Pressure at upstream",
        type: "Incorrect presure",
        description: "Max Flow Rate ${converted}${units} exceeded",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "6",
        level: "l1",
        warning: "Pressure at upstream",
        type: "Incorrect presure",
        description: "Max Flow Rate ${converted}${units} exceeded.",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "7",
        level: "l1",
        warning: "Pressure at upstream",
        type: "Incorrect terminal",
        description: "Max Flow Rate ${converted}${units} exceeded.",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "8",
        level: "l2",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "9",
        level: "l2",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "10",
        level: "l2",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "11",
        level: "l2",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "12",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "13",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "14",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "15",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "16",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect Issue",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "17",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "18",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      },
      {
        id: "19",
        level: "l3",
        warning: "Connect the fixture to a flow system",
        type: "Connect",
        description: "Connect the fixture to a flow system, Connect the fixture to a flow system",
        mode: "pressure",
        helpLink: "https://icons.getbootstrap.com/icons/info-circle/",
        entity: "1234asdf"
      }
    ];
  }

  goToHelpLink(helpLink: string) {
    window.open(helpLink);
  }

  toggleWarning(id: string) {
    if (this.hiddenIds.includes(id)) {
      this.hiddenIds = this.hiddenIds.filter((e) => e !== id);
    } else {
      this.hiddenIds.push(id);
    }
  }

  toggleGroupWarning(ids: Array<string>, hidden: boolean) {
    if (!hidden) {
      this.hiddenIds = _.uniq([...this.hiddenIds, ...ids]);
    } else {
      this.hiddenIds = this.hiddenIds.filter((e) => !ids.includes(e));
    }
  }

  showModal(data: WarningType) {
    this.modalData = data;
    this.modalShow = true;
  }
}
</script>

<style lang="less" scoped>
.warningPanel {
  position: fixed;
  top: 15%;
  right: 20px;
  min-width: 400px;
  max-width: 400px;
  min-height: 100px;
  background: white;
  border: gray solid 1px;
  border-radius: 5px;
  padding: 20px;

  max-height: -webkit-calc(100vh - 30px);
  overflow-y: auto;
  overflow-x: hidden;
  text-align: left;
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
  }
}

.level-table /deep/ table > tbody > tr {
  &.table-hidden {
    opacity: 0.4;
  }
  & > td:first-of-type {
    width: 32px;
  }
  &.b-table-details {
    outline: none;
    & td {
      padding-right: 0.14rem;
    }
  }
  & > td {
    & .mr-2rem {
      margin-right: 2rem !important;
    }
    & .warning-label {
      max-width: 172px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow-x: hidden;
    }
  }
}

.type-table /deep/ table > tbody > tr {
  &.table-hidden {
    opacity: 0.4;
  }
  & > td:first-of-type {
    text-align: right;
    width: 40px;
  }
}

.fa-icon {
  pointer-events: all;
  cursor: pointer;
}
</style>
