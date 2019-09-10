<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{ selectedObject.friendlyTypeName }}</h3>
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
    import ValveEntity, {fillValveDefaultFields, makeValveFields} from '../../../store/document/entities/valveEntity';

    @Component({
        components: {PropertiesFieldBuilder},
        props: {
            selectedEntity: Object,
            selectedObject: Object,
            onDelete: Function,
            onChange: Function,
        },
    })
    export default class ValveProperties extends Vue {

        get fields() {
            return makeValveFields(
                // TODO: Database
                ['fitting', 'rcpd', 'pressure', 'I need to make a database'],
                this.document.drawing.flowSystems,
            );
        }

        get reactiveData(): ValveEntity {
            return this.$props.selectedEntity;
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get defaultData(): ValveEntity {
            return fillValveDefaultFields(this.document, this.reactiveData);
        }

        onCommit() {
            this.$store.dispatch('document/commit');
        }
    }



</script>

<style lang="less">

</style>

