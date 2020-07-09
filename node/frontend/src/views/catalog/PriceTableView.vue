<template>
    <b-container>
        <b-row>
            <b-container class="priceTableContent">
                <template v-for="[title, component] in sections">
                    <b-row :key="title" style="margin-top: 25px; margin-bottom: 25px;">
                        <b-col cols="12">
                            <h4 style="text-align: left">
                                <h3 style="display: inline">{{ title }}</h3>
                                <span>
                            <b-button
                                    v-b-toggle="'collapse' + title"
                                    coll
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
                            <b-collapse :id="'collapse' + title">
                                <component :is="component"/>
                            </b-collapse>
                        </b-col>
                    </b-row>
                </template>
            </b-container>
        </b-row>
        <b-row style="margin-top: 15px">
            <b-col cols="8"> </b-col>
            <b-col>
                <b-button variant="success" style="margin-right: 20px" @click="save" v-if="!isUnchanged">
                    Save
                </b-button>
                <b-button variant="secondary" @click="cancel">
                    {{ isUnchanged ? "Back to Drawing" : "Revert" }}
                </b-button>
            </b-col>
        </b-row>
    </b-container>
</template>
<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FixturesTable from "./FixturesTable.vue";
import InsulationTable from "./InsulationTable.vue";
import PlantsTable from "./PlantsTable.vue";
import PipesTable from "./PipesTable.vue";
import FittingsTable from "./FittingsTable.vue";
import ValvesTable from "./ValvesTable.vue";
import NodesTable from "./NodesTable.vue";
import EquipmentTable from "./EquipmentTable.vue";
import {DocumentState} from "../../store/document/types";
import * as _ from 'lodash';
import {cloneSimple} from "../../../../common/src/lib/utils";

@Component({
    components: { FixturesTable, InsulationTable, PlantsTable, PipesTable, FittingsTable, ValvesTable, NodesTable, EquipmentTable},
    props: {
        schema: Object
    }
})
export default class CatalogView extends Vue {
    committedSinceLastChange = true;

    get sections() {
        return [
            ["Pipes", "PipesTable"],
            ["Fixtures", "FixturesTable"],
            ["Fittings", "FittingsTable"],
            ["Valves", "ValvesTable"],
            ["Equipment", "EquipmentTable"],
            ["Insulation", "InsulationTable"],
            ["Plants", "PlantsTable"],
            ["Nodes", "NodesTable"],
        ]
    }

    get document(): DocumentState {
        return this.$store.getters['document/document'];
    }

    get isUnchanged() {
        if (!this.committedSinceLastChange) {
            return false;
        }
        const res = _.isEqual(this.document.drawing.metadata.priceTable, this.document.committedDrawing.metadata.priceTable);
        if (!res) {
            this.committedSinceLastChange = false;
        }
        return res;
    }

    save() {
        this.$store.dispatch('document/commit');
        this.committedSinceLastChange = true;
    }

    cancel() {
        if (this.isUnchanged) {
            // go back to drawing
            this.$router.push({ name: "drawing" });
        } else {
            // revert
            this.document.drawing.metadata.priceTable = cloneSimple(this.document.committedDrawing.metadata.priceTable);
            this.committedSinceLastChange = true;
        }
    }
}
</script>
<style lang="less">
    .priceTableContent {
        overflow-y: auto;
        overflow-x: hidden;
        height: calc(100vh - 270px);
    }
</style>
