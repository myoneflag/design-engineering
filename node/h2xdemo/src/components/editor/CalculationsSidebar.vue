import {EntityType} from "@/store/document/entities/types";
<template>
    <b-container class="calculationSidePanel">
        <b-row>
            <b-col>
                <b-button-group>
                    <b-button variant="outline-dark"
                              class="calculationBtn"
                              @click="filterShown = !filterShown"
                              :pressed="filterShown"
                    >
                        Filters <v-icon  name="caret-down" scale="1"/>
                    </b-button>

                    <b-dropdown variant="outline-dark" size="sm" class="calculationBtn" text="Export">
                        <b-dropdown-item variant="outline-dark" size="sm" :disabled="true">PDF (Coming soon)</b-dropdown-item>
                        <b-dropdown-item variant="outline-dark" size="sm" :disabled="true">DWG (Coming soon)</b-dropdown-item>
                    </b-dropdown>
                </b-button-group>
            </b-col>
        </b-row>
        <b-row v-if="filterShown">
            <b-col>
                <div class="filterPanel">
                    <div v-for="(objectFilters, type) in filters">
                        <template v-if="Object.keys(objectFilters.filters).length">
                            <h4>{{ objectFilters.name }}</h4>
                            <b-check v-for="(filter, prop) in objectFilters.filters" :checked="filter.value" @input="onCheck(type, prop, $event)">
                                {{ filter.name }}
                            </b-check>
                        </template>
                    </div>
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import FloorPlanProperties from '@/components/editor/property-window/FloorPlanProperties.vue';
    import FlowSourceProperties from '@/components/editor/property-window/FlowSourceProperties.vue';
    import {
        CalculationFilter,
        CalculationFilters,
        DocumentState,
        DrawableEntity,
    } from "@/store/document/types";
    import FittingProperties from '@/components/editor/property-window/FittingProperties.vue';
    import PipeProperties from '@/components/editor/property-window/PipeProperties.vue';
    import {EntityType, getEntityName} from "@/store/document/entities/types";
    import TMVProperties from '@/components/editor/property-window/TMVProperties.vue';
    import FixtureProperties from '@/components/editor/property-window/FixtureProperties.vue';
    import {MainEventBus} from '@/store/main-event-bus';
    import MultiFieldBuilder from '@/components/editor/lib/MultiFieldBuilder.vue';
    import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
    import {AutoConnector} from '@/htmlcanvas/lib/black-magic/auto-connect';
    import DirectedValveProperties from '@/components/editor/property-window/DirectedValveProperties.vue';
    import {Catalog} from "@/store/catalog/types";
    import Fixture from "@/htmlcanvas/objects/fixture";
    import {countPsdUnits, getFields, PsdUnitsByFlowSystem} from "@/calculations/utils";
    import {isGermanStandard} from "@/config";
    import {StandardFlowSystemUids} from "@/store/catalog";
    import {makeDirectedValveCalculationFields} from "@/store/document/calculations/directed-valve-calculation";

    @Component({
        components: {},
        props: {
            objects: Array,
            onChange: Function,
        },
    })
    export default class CalculationsSidebar extends Vue {
        filterShown = true;

        mounted() {
            this.stageNewFilters();
        }

        get filters(): CalculationFilters {
            const build: CalculationFilters = {};

            const objects = this.$props.objects as BaseBackedObject[];

            objects.forEach((o) => {
                const fields = getFields(o.entity, this.document);
                if (!(o.entity.type in build)) {
                    Vue.set(build, o.entity.type, {name: getEntityName(o.entity.type), filters: {}});
                }

                fields.forEach((f) => {
                    if (!(f.property in build[o.entity.type])) {
                        Vue.set(build[o.entity.type].filters, f.property, {
                            name: f.title,
                            value: true,
                        });
                    }
                })
            });

            const existing = this.document.uiState.calculationFilters as CalculationFilters;
            for (const eType in existing) {

                if (eType in build && existing.hasOwnProperty(eType)) {
                    for (const prop in existing[eType].filters) {
                        if (prop in build[eType].filters) {
                            build[eType].filters[prop].value = existing[eType].filters[prop].value;
                        }
                    }
                }
            }

            return build;
        }

        stageNewFilters() {
            for (const eType in this.filters) {
                // noinspection JSUnfilteredForInLoop
                if (this.filters.hasOwnProperty(eType)) {
                    for (const prop in this.filters[eType].filters) {
                        // noinspection JSUnfilteredForInLoop
                        this.onCheck(eType, prop, this.filters[eType].filters[prop].value, false);
                    }
                }
            }
            this.$props.onChange();
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        onCheck(eType: string, prop: string, value: boolean, shouldChange: boolean = true) {
            if (!(eType in this.document.uiState.calculationFilters)) {
                Vue.set(this.document.uiState.calculationFilters, eType, {
                    name: this.filters[eType].name,
                    filters: {},
                });
            }

            if (!(prop in this.document.uiState.calculationFilters[eType].filters)) {
                Vue.set(this.document.uiState.calculationFilters[eType].filters, prop, {
                    name: this.filters[eType].filters[prop].name,
                    value,
                });
            }
            this.document.uiState.calculationFilters[eType].filters[prop].value = value;
            if (shouldChange) {
                this.$props.onChange();
            }
        }
    }
</script>

<style lang="less">
    .calculationBtn {
        background-color:white;
    }

    .calculationSidePanel {
        position: fixed;
        right: 20px;
        min-height: 100px;
        top: 80px;
        width: 300px;
    }

    .filterPanel {
        position: fixed;
        top: 15%;
        right: 20px;
        min-width: 300px;
        max-width: 300px;
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
</style>
