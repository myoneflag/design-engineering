<template>
    <div>

        <b-row style="padding-bottom: 10px; padding-top: 20px;">
            <b-col>
                <h4 class="float-right">Settings for:</h4>
            </b-col>
            <b-col>
                <FlowSystemPicker
                    :selected-system="selectedSystem"
                    :flow-systems="flowSystems"
                    @selectSystem="selectSystem"
                />
            </b-col>
        </b-row>
        <b-row style="padding-bottom: 20px">
            <b-col>
            </b-col>
            <b-col>
                <b-button variant="light" @click="addNewSystem" class="float-left">
                    <v-icon name="plus"/> Add New System
                </b-button>
                <b-button variant="light" @click="deleteSystem" class="float-left">
                    <v-icon name="trash-alt"/> Delete
                </b-button>
            </b-col>
        </b-row>

        <SettingsFieldBuilder
                ref="fields"
                :fields="fields"
                :reactiveData="selectedSystem"
                :originalData="committedSelectedSystem"
                :onSave="save"
                :onBack="back"
        >
        </SettingsFieldBuilder>
    </div>
</template>

<script lang="ts">

    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {DocumentState} from '@/store/document/types';
    import SettingsFieldBuilder from '@/components/editor/lib/SettingsFieldBuilder.vue';
    import uuid from 'uuid';
    import FlowSystemPicker from '@/components/editor/FlowSystemPicker.vue';

    @Component({
        components: {SettingsFieldBuilder, FlowSystemPicker},
        beforeRouteLeave(to, from, next) {
            if ((this.$refs.fields as any).leave()) {
                next();
            } else {
                next(false);
            }
        },
    })
    export default class FlowSystems extends Vue {

        selectedSystemId: number = 0;

        get fields(): any[][] {
            return [
                ['name', 'System Name:', 'text'],
                ['velocity', 'Velocity: (m/s)', 'number'],
                ['temperature', 'Entry temperature: (c)', 'range', 10, 100],
                ['spareCapacity', 'Spare Capacity: %', 'range', 0, 100],
                ['material', 'Material:', 'choice', ['Material A', 'Material B', 'I need a database right now']],
                ['color', 'Colour:', 'color'],
            ];
        }


        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get flowSystems() {
            return this.document.drawing.flowSystems;
        }

        selectSystem(value: number) {
            if (value === this.selectedSystemId) {
                return;
            }
            if ((this.$refs.fields as any).leave()) {
                this.selectedSystemId = value;
            } else {
                // nup
            }
        }

        deleteSystem() {
            if (window.confirm('Are you sure you want to delete ' + this.selectedSystem.name + '?')) {
                this.document.drawing.flowSystems.splice(this.selectedSystemId, 1);
                this.selectedSystemId = 1;
                this.$store.dispatch('document/commit');
            }
        }

        get selectedSystem() {
            return this.document.drawing.flowSystems[this.selectedSystemId];
        }

        get committedSelectedSystem() {
            return this.document.committedDrawing.flowSystems[this.selectedSystemId];
        }

        addNewSystem() {
            if ((this.$refs.fields as any).leave()) {
                this.document.drawing.flowSystems.push({
                    name: 'New Flow System',
                    velocity: 2.5,
                    temperature: 60,
                    spareCapacity: 20,
                    material: 'Material A',
                    color: {hex: '#FCDC00'},
                    uid: uuid(),
                });
                this.$store.dispatch('document/commit');
                this.selectedSystemId = this.document.drawing.flowSystems.length - 1;
            } else {
                // nup
            }
        }

        save() {
            this.$store.dispatch('document/commit').then(() => {
                this.$bvToast.toast('Saved successfully!', {variant: 'success', title: 'Success'});
            });
        }

        back() {
            this.$router.push({ name: 'document'});
        }
    }

</script>

<style lang="less">

</style>
