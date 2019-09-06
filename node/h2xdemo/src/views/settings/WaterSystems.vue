<template>
    <div>

        <b-row style="padding-bottom: 10px; padding-top: 20px;">
            <b-col>
                <h4 class="float-right">Settings for:</h4>
            </b-col>
            <b-col>
                <b-dropdown size="md" id="dropdown-1" :text="selectedSystem.name" variant="outline-light" class="float-left" :style="'border-radius: 5px; background-color: ' + selectedSystem.color.hex">
                    <b-dropdown-item
                            v-for="(system, index) in waterSystems"
                            @click="selectSystem(index)"
                            :key="system.uid"
                            style="padding-right: 25px"
                    >
                        <span :style="'float: left; width:20px; height:20px; margin-right:10px; background-color: ' + system.color.hex">
                        </span>
                        {{system.name}}
                    </b-dropdown-item>
                </b-dropdown>
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

        <FieldBuilder
                ref="fields"
                :fields="fields"
                :reactiveData="selectedSystem"
                :originalData="committedSelectedSystem"
                :onSave="save"
                :onBack="back"
        >
        </FieldBuilder>
    </div>
</template>

<script lang="ts">

    import Vue from 'vue'
    import Component from "vue-class-component";
    import {DocumentState} from '@/store/document/types';
    import FieldBuilder from '@/views/settings/FieldBuilder.vue';
    import uuid from 'uuid';

    @Component({
        components: {FieldBuilder},
        beforeRouteLeave(to, from, next) {
            if ((this.$refs.fields as any).leave()) {
                next();
            } else {
                next(false);
            }
        }

    })
    export default class WaterSystems extends Vue {

        mounted() {
            console.log(this.document.drawing.waterSystems == this.document.committedDrawing.waterSystems);
            console.log(this.document.drawing.waterSystems[0] == this.document.committedDrawing.waterSystems[0]);
        }

        get fields(): Array<Array<any>> {
            return [
                ["name", "System Name:", "text"],
                ["velocity", "Velocity: (m/s)", "number"],
                ["temperature", "Entry temperature: (c)", "range", 10, 100],
                ["spareCapacity", "Spare Capacity: %", "range", 0, 100],
                ["material", "Material:", "choice", ["Material A", "Material B", "I need a database right now"]],
                ["color", "Colour:", "color"],
            ]
        }

        selectedSystemId: number = 0;

        get document(): DocumentState {
            console.log("Refreshing document");
            return this.$store.getters["document/document"];
        }

        get waterSystems() {
            return this.document.drawing.waterSystems;
        }

        selectSystem(value: number) {
            if (value == this.selectedSystemId) {
                return;
            }
            if ((this.$refs.fields as any).leave()) {
                this.selectedSystemId = value;
            } else {
                // nup
            }
        }
        deleteSystem() {
            if (window.confirm("Are you sure you want to delete " + this.selectedSystem.name + "?")) {
                this.document.drawing.waterSystems.splice(this.selectedSystemId, 1);
                this.selectedSystemId = 1;
                this.$store.dispatch('document/commit');
            }
        }

        get selectedSystem() {
            return this.document.drawing.waterSystems[this.selectedSystemId];
        }

        get committedSelectedSystem() {
            return this.document.committedDrawing.waterSystems[this.selectedSystemId];
        }

        addNewSystem() {
            if ((this.$refs.fields as any).leave()) {
                this.document.drawing.waterSystems.push({
                    name: 'New Water System',
                    velocity: 2.5,
                    temperature: 60,
                    spareCapacity: 20,
                    material: 'Material A',
                    color: {hex: '#FCDC00'},
                    uid: uuid(),
                });
                this.$store.dispatch('document/commit');
                this.selectedSystemId = this.document.drawing.waterSystems.length-1;
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
