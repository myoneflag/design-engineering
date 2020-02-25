<template>
    <div>
        <SettingsFieldBuilder
            ref="fields"
            :fields="fields"
            :reactiveData="selectedSystem"
            :originalData="committedSelectedSystem"
            :onSave="save"
            :onBack="back"
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
                <b-col> </b-col>
                <b-col>
                    <b-button variant="light" @click="addNewSystem" class="float-left">
                        <v-icon name="plus" /> Add New System
                    </b-button>
                    <b-button variant="light" @click="deleteSystem" class="float-left">
                        <v-icon name="trash-alt" /> Delete
                    </b-button>
                </b-col>
            </b-row>
        </SettingsFieldBuilder>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DocumentState, initialDocumentState } from "../../../src/store/document/types";
import SettingsFieldBuilder from "../../../src/components/editor/lib/SettingsFieldBuilder.vue";
import uuid from "uuid";
import FlowSystemPicker from "../../../src/components/editor/FlowSystemPicker.vue";
import * as _ from "lodash";
import { initialDrawing } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";

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

    get fields(): any[][] {
        const fields = [
            ["name", "System Name:", "text"],
            ["fluid", "Fluid:", "choice", this.$store.getters["catalog/defaultFluidChoices"]],
            ["temperature", "Entry temperature: (°C)", "range", 10, 100],
            ["color", "Colour:", "color"],
            ["", "Network Properties", "title3"]
        ];

        for (const netKey of Object.keys(this.selectedSystem.networks)) {
            fields.push(
                [netKey, _.startCase(netKey.toLowerCase()), "title4"],
                ["networks." + netKey + ".velocityMS", "Velocity: (m/s)", "number"],
                [
                    "networks." + netKey + ".material",
                    "Material:",
                    "choice",
                    this.$store.getters["catalog/defaultPipeMaterialChoices"]
                ],
                ["networks." + netKey + ".spareCapacityPCT", "Spare Capacity: %", "range", 0, 100]
            );
        }

        return fields;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get flowSystems() {
        return this.document.drawing.metadata.flowSystems;
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
        if (window.confirm("Are you sure you want to delete " + this.selectedSystem.name + "?")) {
            this.document.drawing.metadata.flowSystems.splice(this.selectedSystemId, 1);
            this.selectedSystemId = 1;
            this.$store.dispatch("document/commit");
        }
    }

    get selectedSystem() {
        return this.document.drawing.metadata.flowSystems[this.selectedSystemId];
    }

    get committedSelectedSystem() {
        return this.document.committedDrawing.metadata.flowSystems[this.selectedSystemId];
    }

    addNewSystem() {
        if ((this.$refs.fields as any).leave()) {
            this.document.drawing.metadata.flowSystems.push({
                name: "New Flow System",
                temperature: 60,
                color: { hex: "#FCDC00" },
                uid: uuid(),
                fluid: "water",
                networks: cloneSimple(initialDrawing.metadata.flowSystems[0].networks)
            });
            this.$store.dispatch("document/commit").then(() => {
                this.selectedSystemId = this.document.drawing.metadata.flowSystems.length - 1;
            });
        } else {
            // nup
        }
    }

    save() {
        this.$store.dispatch("document/commit", false).then(() => {
            (this as any).$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
        });
    }

    back() {
        this.$router.push({ name: "drawing" });
    }
}
</script>

<style lang="less"></style>
