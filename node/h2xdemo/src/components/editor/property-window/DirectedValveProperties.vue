<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{ selectedObject.friendlyTypeName(catalog) }}</h3>
            </b-col>
        </b-row>
        <b-row style="margin-top: 10px;">
            <b-col>
                <b-button variant="primary" @click="flip" :disabled="selectedEntity.connections.length === 0">
                    Flip Direction
                </b-button>
            </b-col>
        </b-row>
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
    import PropertiesFieldBuilder from '@/components/editor/lib/PropertiesFieldBuilder.vue';
    import {DocumentState} from '@/store/document/types';
    import FittingEntity, {fillValveDefaultFields, makeValveFields} from '../../../store/document/entities/fitting-entity';
    import {Catalog, ValveSpec} from '@/store/catalog/types';
    import * as _ from 'lodash';
    import DirectedValveEntity, {
        fillDirectedValveFields,
        makeDirectedValveFields,
    } from "../../../store/document/entities/directed-valves/directed-valve-entity";
    import DirectedValve from '@/htmlcanvas/objects/directed-valve';

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
    export default class DirectedValveProperties extends Vue {

        get fields() {
            return makeDirectedValveFields(
                this.document.drawing.flowSystems,
                (this.$props.selectedEntity as DirectedValveEntity).valve,
            );
        }

        get reactiveData(): DirectedValveEntity {
            return this.$props.selectedEntity;
        }

        get catalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get defaultData(): DirectedValveEntity {
            return fillDirectedValveFields(this.document, this.reactiveData);
        }

        onCommit() {
            this.$store.dispatch('document/commit');
        }

        flip() {
            (this.$props.selectedObject as DirectedValve).flip();
            this.onCommit();
        }
    }



</script>

<style lang="less">

</style>

