import {EntityType} from "../../../../src/store/document/entities/types";
<template>
    <div class="propertiesWindow">
        <template v-if="selectedObjects.length === 1">
            <FloorPlanProperties
                    :selected-entity="selectedEntities[0]"
                    :selected-object="selectedObjects[0]"
                    :on-delete="onDelete"
                    :on-change="onChange"
                    v-if="mode === 0"
            />
            <FlowSourceProperties
                    v-else-if="entity.type === ENTITY_NAMES.RISER"
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
                    v-else-if="entity.type === ENTITY_NAMES.BIG_VALVE"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
            >
                <div v-if="canAutoConnect">
                    <b-button variant="success" size="lg" @click="autoConnect">Auto Connect</b-button>
                </div>
            </TMVProperties>
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
                    :object-store="objectStore"
            />
            <LoadNodeProperties
                    v-else-if="entity.type === ENTITY_NAMES.LOAD_NODE"
                    :selected-entity="entity"
                    :selected-object="selectedObjects[0]"
                    :on-change="onChange"
                    :target-property="targetProperty"
                    :on-delete="onDelete"
                    :object-store="objectStore"
            />

        </template>
        <template v-else>
            <h3>{{selectedObjects.length + ' Objects'}}</h3>
            <div v-if="canAutoConnect">
                <b-button variant="success" size="lg" @click="autoConnect">Auto Connect</b-button>
            </div>
            <div v-if="hasPsdUnits">
                <b-row v-b-tooltip.hover="{title: psdName}">
                    <b-col>
                        <h6 v-for="suid in Object.keys(psdUnits)" :key="suid">
                            {{ systemPsdUnitName(suid) }}: {{ psdUnits[suid].units.toPrecision(2) }}
                        </h6>

                    </b-col>
                </b-row>
            </div>
            <MultiFieldBuilder

                    :selected-entities="selectedEntities"
                    :selected-objects="selectedObjects"
                    :on-delete="onDelete"
                    :on-change="onChange"
                    :object-store="objectStore"
            />
        </template>

        <!--Debug-->
        <b-row style="margin-top: 20px">

            <b-col>

                <b-button style="opacity: 0.2" v-b-toggle.collapse-1 variant="primary" size="sm">Debug Info <v-icon name="info" scale="0.8"/></b-button>

                <b-collapse id="collapse-1" class="mt-2">
                    <p>{{ selectedEntities.map((e) => e.uid) }}</p>
                        <pre style="font-size: 12px; text-align: left">
                            {{ JSON.stringify(selectedEntities, null, 2) }}

                            calculations: {{ selectedEntities.map((e) => getCalculation(e)) }}
                        </pre>
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
    import FloorPlanProperties from '../../../../src/components/editor/property-window/FloorPlanProperties.vue';
    import RiserProperties from './RiserProperties.vue';
    import {DocumentState, DrawableEntity} from "../../../../src/store/document/types";
    import FittingProperties from '../../../../src/components/editor/property-window/FittingProperties.vue';
    import PipeProperties from '../../../../src/components/editor/property-window/PipeProperties.vue';
    import {EntityType} from '../../../../src/store/document/entities/types';
    import BigValveProperties from './BigValveProperties.vue';
    import FixtureProperties from '../../../../src/components/editor/property-window/FixtureProperties.vue';
    import {MainEventBus} from '../../../../src/store/main-event-bus';
    import MultiFieldBuilder from '../../../../src/components/editor/lib/MultiFieldBuilder.vue';
    import BaseBackedObject from '../../../../src/htmlcanvas/lib/base-backed-object';
    import {AutoConnector} from '../../../../src/htmlcanvas/lib/black-magic/auto-connect';
    import DirectedValveProperties from '../../../../src/components/editor/property-window/DirectedValveProperties.vue';
    import {Catalog} from "../../../../src/store/catalog/types";
    import Fixture from "../../../../src/htmlcanvas/objects/fixture";
    import {countPsdUnits, getPsdUnitName, PsdUnitsByFlowSystem} from "../../../../src/calculations/utils";
    import {isGermanStandard} from "../../../../src/config";
    import {StandardFlowSystemUids} from "../../../../src/store/catalog";
    import {DrawableEntityConcrete} from "../../../store/document/entities/concrete-entity";
    import LoadNodeProperties from "./LoadNodeProperties.vue";
    import {GlobalStore} from "../../../htmlcanvas/lib/types";
    import {isCalculated} from "../../../store/document/calculations";

    @Component({
        components: {
            LoadNodeProperties,
            DirectedValveProperties,
            MultiFieldBuilder,
            FixtureProperties,
            TMVProperties: BigValveProperties, PipeProperties, ValveProperties: FittingProperties, FlowSourceProperties: RiserProperties, FloorPlanProperties},
        props: {
            selectedEntities: Array,
            selectedObjects: Array,
            targetProperty: String,
            mode: Number,
            objectStore: Map, // MAP. don't change it
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
            const selectedEntities: DrawableEntityConcrete[] = this.$props.selectedEntities;
            return countPsdUnits(selectedEntities, this.document, this.effectiveCatalog);
        }

        systemPsdUnitName(suid: string) {
            const system = this.document.drawing.metadata.flowSystems.find((s) => s.uid === suid)!;
            return system.name + ' ' + getPsdUnitName(this.document.drawing.metadata.calculationParams.psdMethod).name;
        }

        get psdName() {
            return this.effectiveCatalog.psdStandards[this.document.drawing.metadata.calculationParams.psdMethod].name;
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
            const neededTypes: string[] = [EntityType.FIXTURE, EntityType.BIG_VALVE];
            return selectedObjects.findIndex((o) => neededTypes.includes(o.type)) !== -1;
        }

        get ENTITY_NAMES() {
            return EntityType;
        }

        get StandardFlowSystemUids() {
            return StandardFlowSystemUids;
        }

        getCalculation(entity: DrawableEntityConcrete) {
            const g: GlobalStore = this.$props.objectStore;
            if (isCalculated(entity)) {
                return g.getOrCreateCalculation(entity);
            } else {
                return "Not calculated";
            }
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
