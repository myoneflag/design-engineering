<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>Floor Plan</h3>
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col>
                Scale: {{ selectedObject.scale }}
            </b-col>
        </b-row>


        <b-row style="margin-top: 10px">
            <b-col>
                Paper: {{ selectedObject.paperSize.name }}
            </b-col>
        </b-row>
        <b-row style="margin-top: 10px">
            <b-col>
                Rotation: {{ selectedObject.rotation }}
            </b-col>
        </b-row>

        <hr/>
        <b-row style="margin-top: 10px">
            <b-col cols="6">
                <b-button class="rotateBtn" variant="success" @click="rotateLeft" size="large"><v-icon name="undo" scale="2"/></b-button>
            </b-col>
            <b-col cols="6">
                <b-button class="rotateBtn" variant="success" @click="rotateRight" size="large"><v-icon name="redo" scale="2"/></b-button>
            </b-col>
        </b-row>

        <hr/>
        <b-row style="margin-top: 10px">
            <b-col>
                <b-button variant="danger" @click="onDeleteClick" size="sm">Delete</b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";

    @Component({
        props: {
            selectedObject: Object,
        },
    })
    export default class FloorPlanProperties extends Vue {
        onDeleteClick() {
            this.$store.dispatch('document/deleteBackground', this.$props.selectedObject);
        }

        rotateLeft() {
            this.$store.dispatch('document/rotateBackground', {background: this.$props.selectedObject, degrees: -45});
        }

        rotateRight() {
            this.$store.dispatch('document/rotateBackground', {background: this.$props.selectedObject, degrees: 45});
        }
    }



</script>

<style>
    .rotateBtn {
        width: 100%;
    }
</style>

