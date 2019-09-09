<template>
    <div class="propertiesWindow">
        <FloorPlanProperties :selected-entity="selectedEntity"
                             :selected-object="selectedObject"
                             v-if="objectType === 'floor-plan'"
        />
        <FlowSourceProperties
            v-else-if="entity.type === ENTITY_NAMES.FLOW_SOURCE"
            :selected-entity="entity"
            :selected-object="selectedObject"
            :on-change="onChange"
        />-
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import FloorPlanProperties from '@/components/editor/property-window/FloorPlanProperties.vue';
    import FlowSourceProperties from '@/components/editor/property-window/FlowSourceProperties.vue';
    import {DrawableEntity} from '@/store/document/types';
    import {ENTITY_NAMES} from '@/store/document/entities';

    @Component({
        components: {FlowSourceProperties, FloorPlanProperties},
        props: {
            selectedEntity: Object,
            selectedObject: Object,
            objectType: String,
            onChange: Function,
        },
    })
    export default class PropertiesWindow extends Vue {


        // This is here to invoke type cohesion when working in the template.
        get entity(): DrawableEntity {
            return this.$props.selectedEntity;
        }

        get ENTITY_NAMES() {
            return ENTITY_NAMES;
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
