<template>
    <div class="propertiesWindow">
        <FloorPlanProperties
                :selected-entity="selectedEntity"
                :selected-object="selectedObject"
                :on-delete="onDelete"
                v-if="mode === 0"
        />
        <FlowSourceProperties
            v-else-if="entity.type === ENTITY_NAMES.FLOW_SOURCE"
            :selected-entity="entity"
            :selected-object="selectedObject"
            :on-change="onChange"
            :target-property="targetProperty"
            :on-delete="onDelete"
        />
        <ValveProperties
                v-else-if="entity.type === ENTITY_NAMES.VALVE"
                :selected-entity="entity"
                :selected-object="selectedObject"
                :on-change="onChange"
                :target-property="targetProperty"
                :on-delete="onDelete"
        />
        <PipeProperties
                v-else-if="entity.type === ENTITY_NAMES.PIPE"
                :selected-entity="entity"
                :selected-object="selectedObject"
                :on-change="onChange"
                :target-property="targetProperty"
                :on-delete="onDelete"
        />
        <TMVProperties
                v-else-if="entity.type === ENTITY_NAMES.TMV"
                :selected-entity="entity"
                :selected-object="selectedObject"
                :on-change="onChange"
                :target-property="targetProperty"
                :on-delete="onDelete"
        />
        <FixtureProperties
                v-else-if="entity.type === ENTITY_NAMES.FIXTURE"
                :selected-entity="entity"
                :selected-object="selectedObject"
                :on-change="onChange"
                :target-property="targetProperty"
                :on-delete="onDelete"
        />

        <!--Debug-->
        <b-row style="margin-top: 20px">

            <b-col>

                <b-button style="opacity: 0.2" v-b-toggle.collapse-1 variant="primary" size="sm">Debug Info <v-icon name="info" scale="0.8"/></b-button>
                <b-collapse id="collapse-1" class="mt-2">
                        <pre style="font-size: 12px; text-align: left">{{ JSON.stringify(entity, null, 2) }}</pre>
                        <b-button v-b-toggle.collapse-1-inner size="sm">Toggle Inner Collapse</b-button>
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
    import {DrawableEntity} from '@/store/document/types';
    import ValveProperties from '@/components/editor/property-window/ValveProperties.vue';
    import PipeProperties from '@/components/editor/property-window/PipeProperties.vue';
    import {EntityType} from '@/store/document/entities/types';
    import TMVProperties from '@/components/editor/property-window/TMVProperties.vue';
    import FixtureProperties from '@/components/editor/property-window/FixtureProperties.vue';
    import {MainEventBus} from '@/store/main-event-bus';

    @Component({
        components: {
            FixtureProperties,
            TMVProperties, PipeProperties, ValveProperties, FlowSourceProperties, FloorPlanProperties},
        props: {
            selectedEntity: Object,
            selectedObject: Object,
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

        // This is here to invoke type cohesion when working in the template.
        get entity(): DrawableEntity {
            return this.$props.selectedEntity;
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
