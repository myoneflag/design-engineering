<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>TMV</h3>
            </b-col>
        </b-row>
        <slot>

        </slot>
        <PropertiesFieldBuilder
                :fields="fields"
                :reactive-data="reactiveData"
                :default-data="defaultData"
                :on-commit="onCommit"
                :on-change="onChange"
                :target="targetProperty"
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
    import PropertiesFieldBuilder from '../../../../src/components/editor/lib/PropertiesFieldBuilder.vue';
    import {fillRiserDefaults, makeRiserFields} from '../../../store/document/entities/riser-entity';
    import {DocumentState} from '../../../../src/store/document/types';
    import {fillTMVFields, makeTMVFields} from '../../../store/document/entities/tmv/tmv-entity';
    import {Catalog} from '../../../store/catalog/types';

    @Component({
        components: {PropertiesFieldBuilder},
        props: {
            selectedEntity: Object,
            selectedObject: Object,
            targetProperty: String,
            onDelete: Function,
            onChange: Function,
        },
    })
    export default class TMVProperties extends Vue {

        get fields() {
            return makeTMVFields();
        }

        get reactiveData() {
            return this.$props.selectedEntity;
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get defaultCatalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        get defaultData() {
            return fillTMVFields(this.document, this.defaultCatalog, this.reactiveData);
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

