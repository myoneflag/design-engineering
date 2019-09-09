<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>Flow Source</h3>
            </b-col>
        </b-row>
        <PropertiesFieldBuilder
            :fields="fields"
            :reactive-data="reactiveData"
            :default-data="defaultData"
            :on-commit="onCommit"
            :on-change="onChange"
        />
    </b-container>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import PropertiesFieldBuilder from '@/components/editor/lib/PropertiesFieldBuilder.vue';
    import {fillDefaults, makeFlowSourceFields} from '@/store/document/entities/flow-source';
    import {DocumentState} from '@/store/document/types';

    @Component({
        components: {PropertiesFieldBuilder},
        props: {
            selectedEntity: Object,
            selectedDrawable: Object,
            onChange: Function,
        },
    })
    export default class FlowSourceProperties extends Vue {

        get fields() {
            return makeFlowSourceFields(
                ['Material A', 'Material B'],
                this.document.drawing.flowSystems,
            );
        }

        get reactiveData() {
            return this.$props.selectedEntity;
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get defaultData() {
            return fillDefaults(this.document, this.reactiveData);
        }

        onCommit() {
            this.$store.dispatch('document/commit');
        }
    }



</script>

<style lang="less">

    .sidebar-title {

        position: relative;
        font-size: 30px;
        z-index: 1;
        overflow: hidden;
        text-align: center;

        &:before, &:after {
            position: absolute;
            top: 51%;
            overflow: hidden;
            width: 50%;
            height: 1px;
            content: '\a0';
            background-color: lightgray;
        }

        &:before {
            margin-left: -50%;
            text-align: right;
        }
    }
</style>

