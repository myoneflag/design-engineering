<template>
    <div class="propertiesWindow">
        <FloorPlanProperties :selected-object="selectedObject"
            v-if="objectType === 'floor-plan'"
        />
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";
    import FloorPlanProperties from '@/components/canvas/FloorPlanProperties.vue';

    @Component({
        components: {FloorPlanProperties},
        props: {
            selectedObject: Object,
            objectType: String,
        }
    })
    export default class PropertiesWindow extends Vue {

    }
</script>

<style lang="less">
    .propertiesWindow {
        position: fixed;
        top: 180px;
        right: 20px;
        min-width: 300px;
        min-height: 100px;
        background: white;
        border: gray solid 1px;
        border-radius: 5px;
        padding: 20px;
    }
</style>
