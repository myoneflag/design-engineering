<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>Pipe</h3>
            </b-col>
        </b-row>
        <PropertiesFieldBuilder
                :fields="fields"
                :reactive-data="reactiveData"
                :default-data="defaultData"
                :on-commit="onCommit"
                :on-change="onChange"
        />
        <b-row>
            <b-col>
                <b-button size="sm" variant="danger" @click="onDelete">
                    Delete
                </b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import PropertiesFieldBuilder from '@/components/editor/lib/PropertiesFieldBuilder.vue';
    import {DocumentState} from '@/store/document/types';
    import PipeEntity, {fillPipeDefaultFields, makePipeFields} from '../../../store/document/entities/pipeEntity';

    @Component({
        components: {PropertiesFieldBuilder},
        props: {
            selectedEntity: Object,
            selectedObject: Object,
            onDelete: Function,
            onChange: Function,
        },
    })
    export default class PipeProperties extends Vue {

        get fields() {
            return makePipeFields(
                // TODO: Database
                ['Material A', 'Material B', 'I need to make a database'],
                this.document.drawing.flowSystems,
            );
        }

        get reactiveData(): PipeEntity {
            return this.$props.selectedEntity;
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get defaultData(): PipeEntity {
            return fillPipeDefaultFields(this.document, this.$props.selectedObject.computedLengthM, this.reactiveData);
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

