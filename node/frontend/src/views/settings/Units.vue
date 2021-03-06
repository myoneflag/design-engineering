<template>
    <SettingsFieldBuilder
            ref="fields"
            :fields="fields"
            :reactiveData="units"
            :originalData="committedUnits"
            :onSave="save"
            :onBack="back"
    >
        <template v-slot:more-fields>
            <b-form-group
                id="input-group-currency"
                label="Currency"
                label-for="input-currency"
                label-cols="4"
            >
                <b-input-group>
                    <currency-selector/>
                </b-input-group>
            </b-form-group>
        </template>
    </SettingsFieldBuilder>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { DocumentState } from "../../../src/store/document/types";
    import SettingsFieldBuilder from "../../../src/components/editor/lib/SettingsFieldBuilder.vue";
    import {
        ENERGY_MEASUREMENT_CHOICES,
        LENGTH_MEASUREMENT_CHOICES,
        PRESSURE_MEASUREMENT_CHOICES,
        TEMPERATURE_MEASUREMENT_CHOICES, VELOCITY_MEASUREMENT_CHOICES, VOLUME_MEASUREMENT_CHOICES
    } from "../../../../common/src/api/document/drawing";
    import CurrencySelector from "../../components/molecules/CurrencySelector.vue";
    @Component({
        components: { CurrencySelector, SettingsFieldBuilder },
        beforeRouteLeave(to, from, next) {
            if ((this.$refs.fields as any).leave()) {
                next();
            } else {
                next(false);
            }
        }
    })
    export default class Units extends Vue {
        get fields(): any[] {
            return [
                ['lengthMeasurementSystem', 'Length Measurement System', 'choice', LENGTH_MEASUREMENT_CHOICES],
                ['pressureMeasurementSystem', 'Pressure Measurement System', 'choice', PRESSURE_MEASUREMENT_CHOICES],
                ['velocityMeasurementSystem', 'Velocity Measurement System', 'choice', VELOCITY_MEASUREMENT_CHOICES],
                ['temperatureMeasurementSystem', 'Temperature Measurement System', 'choice', TEMPERATURE_MEASUREMENT_CHOICES],
                ['volumeMeasurementSystem', 'Volume Measurement System', 'choice', VOLUME_MEASUREMENT_CHOICES],
                ['energyMeasurementSystem', 'Energy Measurement System', 'choice', ENERGY_MEASUREMENT_CHOICES],
            ];
        }

        get document(): DocumentState {
            return this.$store.getters["document/document"];
        }

        get units() {
            return this.document.drawing.metadata.units;
        }

        get committedUnits() {
            return this.document.committedDrawing.metadata.units;
        }

        save() {
            this.$store.dispatch("document/commit", {skipUndo: true}).then(() => {
                this.$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
            });
        }

        back() {
            this.$router.push({ name: "drawing" });
        }
    }
</script>

<style lang="less"></style>
