import {EntityType} from "@/store/document/entities/types";
<template>
    <div class="propertiesWindow">
        <template v-if="selectedObjects.length === 1">
            <FloorPlanProperties
                    :selected-entity="selectedEntities[0]"
                    :selected-object="selectedObjects[0]"
                    :on-delete="onDelete"
                    v-if="mode === 0"
            />
            <FlowSourceProperties
                    v-else-if="entity.type === ENTITY_NAMES.FLOW_SOURCE"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
            />
            <ValveProperties
                    v-else-if="entity.type === ENTITY_NAMES.FITTING"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
            />
            <PipeProperties
                    v-else-if="entity.type === ENTITY_NAMES.PIPE"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
            />
            <TMVProperties
                    v-else-if="entity.type === ENTITY_NAMES.TMV"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
            />
            <FixtureProperties
                    v-else-if="entity.type === ENTITY_NAMES.FIXTURE"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
            />
            <DirectedValveProperties
                    v-else-if="entity.type === ENTITY_NAMES.DIRECTED_VALVE"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
            />

        </template>
        <template v-else>
            <h3>{{selectedObjects.length + ' Objects'}}</h3>
            <div v-if="hasPsdUnits">
                <b-row>
                    <b-col>
                        <h6>{{ coldPsdUnitsName }}: {{ psdUnits[StandardFlowSystemUids.ColdWater].units }}</h6>
                        <h6>{{ hotPsdUnitsName }}: {{ psdUnits[StandardFlowSystemUids.HotWater].units }}</h6>
                        <h6>Using: {{psdName}}</h6>
                    </b-col>
                </b-row>
            </div>
            <div
                v-if="canAutoConnect"
            >
                <b-button variant="success" size="lg" @click="autoConnect">Auto Connect</b-button>
            </div>
            <MultiFieldBuilder
                    v-else
                    :selected-entities="selectedEntities"
                    :selected-objects="selectedObjects"
                    :on-delete="onDelete"
                    :on-change="onChange"
            />
        </template>

        <!--Debug-->
        <b-row style="margin-top: 20px">

            <b-col>

                <b-button style="opacity: 0.2" v-b-toggle.collapse-1 variant="primary" size="sm">Debug Info <v-icon name="info" scale="0.8"/></b-button>
                <p>{{ selectedEntities.map((e) => e.uid) }}</p>
                <b-collapse id="collapse-1" class="mt-2">
                        <pre style="font-size: 12px; text-align: left">{{ JSON.stringify(selectedEntities, null, 2) }}</pre>
                        <b-collapse id="collapse-1-inner" class="mt-2">
                            <b-card>Hello!</b-card>
                        </b-collapse>
                </b-collapse>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import FloorPlanProperties from '@/components/editor/property-window/FloorPlanProperties.vue';
    import FlowSourceProperties from '@/components/editor/property-window/FlowSourceProperties.vue';
    import {DocumentState, DrawableEntity} from "@/store/document/types";
    import FittingProperties from '@/components/editor/property-window/FittingProperties.vue';
    import PipeProperties from '@/components/editor/property-window/PipeProperties.vue';
    import {EntityType} from '@/store/document/entities/types';
    import TMVProperties from '@/components/editor/property-window/TMVProperties.vue';
    import FixtureProperties from '@/components/editor/property-window/FixtureProperties.vue';
    import {MainEventBus} from '@/store/main-event-bus';
    import MultiFieldBuilder from '@/components/editor/lib/MultiFieldBuilder.vue';
    import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
    import {AutoConnector} from '@/htmlcanvas/lib/black-magic/auto-connect';
    import DirectedValveProperties from '@/components/editor/property-window/DirectedValveProperties.vue';
    import {Catalog} from "@/store/catalog/types";
    import Fixture from "@/htmlcanvas/objects/fixture";
    import {countPsdUnits, PsdUnitsByFlowSystem} from "@/calculations/utils";
    import {isGermanStandard} from "@/config";
    import {StandardFlowSystemUids} from "@/store/catalog";

    @Component({
        components: {
            DirectedValveProperties,
            MultiFieldBuilder,
            FixtureProperties,
            TMVProperties, PipeProperties, ValveProperties: FittingProperties, FlowSourceProperties, FloorPlanProperties},
        props: {
            selectedEntities: Array,
            selectedObjects: Array,
            targetProperty: String,
            mode: Number,
            onChange: Function,
            onDelete: Function,
        },
    })
    export default class PropertiesWindow extends Vue {

        mounted() {
            MainEventBus.$on('delete-pressed', this.$props.onDelete);
        }

        destroyed() {
            MainEventBus.$off('delete-pressed', this.$props.onDelete);
        }

        autoConnect() {
            MainEventBus.$emit('auto-connect');
        }


        get psdUnits(): PsdUnitsByFlowSystem | null {
            const selectedObjects: BaseBackedObject[] = this.$props.selectedObjects;
            return countPsdUnits(selectedObjects, this.document, this.effectiveCatalog);
        }

        get coldPsdUnitsName() {
            if (isGermanStandard(this.document.drawing.calculationParams.psdMethod)) {
                return "Cold Design Flow Rate (L/s)";
            } else {
                return "Cold Loading Units";
            }
        }

        get hotPsdUnitsName() {
            if (isGermanStandard(this.document.drawing.calculationParams.psdMethod)) {
                return "Hot Design Flow Rate (L/s)";
            } else {
                return "Hot Loading Units";
            }
        }

        get psdName() {
            return this.effectiveCatalog.psdStandards[this.document.drawing.calculationParams.psdMethod].name;
        }

        get hasPsdUnits(): boolean {
            return this.psdUnits !== null;
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get effectiveCatalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        // This is here to invoke type cohesion when working in the template.
        get entity(): DrawableEntity {
            return this.$props.selectedEntities[0];
        }

        //
        get canAutoConnect(): boolean {
            // must contain a fixture
            const selectedObjects: BaseBackedObject[] = this.$props.selectedObjects;
            return selectedObjects.findIndex((o) => o.type === EntityType.FIXTURE) !== -1;
        }

        get ENTITY_NAMES() {
            return EntityType;
        }

        get StandardFlowSystemUids() {
            return StandardFlowSystemUids;
        }
    }
</script>

<style lang="less">
    .propertiesWindow {
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
    }
</style>
