<template>

    <b-button-group class="pressure-drainage-selector">
        <b-button
                :pressed="document.uiState.pressureOrDrainage === 'pressure'"
                @click="onPressureClick"
                class="pressure-drainage-btn"
                variant="outline-dark"
        >
            Pressure
        </b-button>
        <b-button
                :pressed="document.uiState.pressureOrDrainage === 'drainage'"
                @click="onDrainageClick"
                class="pressure-drainage-btn"
                variant="outline-dark"
        >
            Drainage
        </b-button>
    </b-button-group>
</template>

<script lang="ts">

    import Component from "vue-class-component";
    import Vue from 'vue';
    import {DocumentState} from "../../store/document/types";
    import {MainEventBus} from "../../store/main-event-bus";

    @Component({
        components: {},
        props: {
        }
    })
    export default class PressureDrainageSelector extends Vue {
        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        onDrainageClick() {
            this.document.uiState.pressureOrDrainage = 'drainage';
            MainEventBus.$emit('redraw');
        }

        onPressureClick() {
            this.document.uiState.pressureOrDrainage = 'pressure';
            MainEventBus.$emit('redraw');
        }
    }

</script>

<style>
    .pressure-drainage-selector {
        position:absolute;
        right:50px;
        top:80px;
    }

    .pressure-drainage-btn {
        background-color: white;
    }

</style>