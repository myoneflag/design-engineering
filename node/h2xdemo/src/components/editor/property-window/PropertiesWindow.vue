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
                    :target-property="targetProperty[0]"
                    :on-delete="onDelete"
            />
            <ValveProperties
                    v-else-if="entity.type === ENTITY_NAMES.VALVE"
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

        </template>
        <template v-else>
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
    import Vue from "vue";
    import Component from "vue-class-component";
    import FloorPlanProperties from "@/components/editor/property-window/FloorPlanProperties.vue";
    import FlowSourceProperties from "@/components/editor/property-window/FlowSourceProperties.vue";
    import {DrawableEntity} from "@/store/document/types";
    import ValveProperties from "@/components/editor/property-window/ValveProperties.vue";
    import PipeProperties from "@/components/editor/property-window/PipeProperties.vue";
    import {EntityType} from "@/store/document/entities/types";
    import TMVProperties from "@/components/editor/property-window/TMVProperties.vue";
    import FixtureProperties from "@/components/editor/property-window/FixtureProperties.vue";
    import {MainEventBus} from "@/store/main-event-bus";
    import MultiFieldBuilder from "@/components/editor/lib/MultiFieldBuilder.vue";
    import BaseBackedObject from "@/htmlcanvas/lib/base-backed-object";
    import {AutoConnector} from "@/htmlcanvas/lib/black-magic/auto-connect";

    @Component({
        components: {
            MultiFieldBuilder,
            FixtureProperties,
            TMVProperties, PipeProperties, ValveProperties, FlowSourceProperties, FloorPlanProperties},
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
