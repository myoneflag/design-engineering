<template>
    <b-container>
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

@Component({
    components: { FixturesTable, InsulationTable, PlantsTable, PipesTable, FittingsTable, ValvesTable, NodesTable, EquipmentTable},
    props: {
        schema: Object
    }
})
export default class CatalogView extends Vue {
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
}
</script>
<style lang="less"></style>
