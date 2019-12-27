<template>
    <SettingsFieldBuilder
            ref="fields"
            :fields="fields"
            :reactiveData="calculationParams"
            :originalData="committedCalculationParams"
            :onSave="save"
            :onBack="back"
    />
</template>

<script lang="ts">

    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {DocumentState} from '../../../src/store/document/types';
    import SettingsFieldBuilder from '../../../src/components/editor/lib/SettingsFieldBuilder.vue';
    import {
        PIPE_SIZING_METHODS,
        RING_MAIN_CALCULATION_METHODS,
        getPsdMethods,
        getDwellingMethods
    } from '../../../src/config';

    @Component({
        components: {SettingsFieldBuilder},
        beforeRouteLeave(to, from, next) {
            if ((this.$refs.fields as any).leave()) {
                next();
            } else {
                next(false);
            }
        },
    })
    export default class Calculations extends Vue {


        get fields(): any[][] {
            return [
                ['psdMethod', 'PSD Calculation Method:', 'choice', getPsdMethods(this.$store.getters['catalog/default'])],
                [
                    'dwellingMethod',
                    'Dwelling Calculation Method:',
                    'choice',
                    getDwellingMethods(this.$store.getters['catalog/default']),
                ],


                ['pipeSizingMethod', 'Pipe Sizing Method:', 'choice', PIPE_SIZING_METHODS],
                //['ringMainCalculationMethod', 'Ring Main Calculation Method:', 'choice', RING_MAIN_CALCULATION_METHODS],
                ['ceilingPipeHeightM', 'Default Pipe Height Above Floor (m):', 'number'],
                ['roomTemperatureC', 'Room Temperature (C):', 'range', 10, 40],
                ['gravitationalAcceleration', 'Gravitational Acceleration (m/s^2):', 'range', 9.77, 9.84, 0.001],
            ];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get calculationParams() {
            return this.document.drawing.metadata.calculationParams;
        }

        get committedCalculationParams() {
            return this.document.committedDrawing.metadata.calculationParams;
        }

        save() {
            this.$store.dispatch('document/commit').then(() => {
                this.$bvToast.toast('Saved successfully!', {variant: 'success', title: 'Success'});
            });
        }

        back() {
            this.$router.push({ name: 'drawing'});
        }
    }

</script>

<style lang="less">

</style>
