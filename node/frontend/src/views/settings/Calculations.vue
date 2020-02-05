import {SupportedPsdStandards} from "../../config"; import {SupportedPsdStandards} from "../../config";
<template>
    <SettingsFieldBuilder
        ref="fields"
        :fields="fields"
        :reactiveData="reactiveData"
        :originalData="committedCalculationParams"
        :onSave="save"
        :onBack="back"
    />
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DocumentState } from "../../../src/store/document/types";
import SettingsFieldBuilder from "../../../src/components/editor/lib/SettingsFieldBuilder.vue";
import {
    getDwellingMethods,
    isSupportedDwellingStandard
} from "../../../src/config";
import {
    assertUnreachable, COMPONENT_PRESSURE_LOSS_METHODS, ComponentPressureLossMethod,
    getPsdMethods,
    isSupportedPsdStandard, PIPE_SIZING_METHODS, SupportedDwellingStandards,
    SupportedPsdStandards
} from "../../../../common/src/api/config";

@Component({
    components: { SettingsFieldBuilder },
    beforeRouteLeave(to, from, next) {
        if ((this.$refs.fields as any).leave()) {
            next();
        } else {
            next(false);
        }
    }
})
export default class Calculations extends Vue {
    get fields(): any[][] {
        const result: any[][] = [];

        result.push([
            "psdDwellingMethod",
            "Peak Flow Rate Calculation Method:",
            "choice",
            [
                ...getPsdMethods(this.$store.getters["catalog/default"]),
                ...getDwellingMethods(this.$store.getters["catalog/default"])
            ]
        ]);

        if (this.calculationParams.dwellingMethod !== null) {
            result.push([
                "psdMethod",
                "Peak Flow Rate Inside Dwellings:",
                "choice",
                [...getPsdMethods(this.$store.getters["catalog/default"])]
            ]);
        }

        result.push(
            ["pipeSizingMethod", "Pipe Sizing Method:", "choice", PIPE_SIZING_METHODS],
            ["componentPressureLossMethod", "Pressure Loss Method:", "choice", COMPONENT_PRESSURE_LOSS_METHODS]
        );

        switch (this.document.drawing.metadata.calculationParams.componentPressureLossMethod) {
            case ComponentPressureLossMethod.INDIVIDUALLY:
                break;
            case ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE:
                result.push(["pipePressureLossAddOnPCT", "Length on top of Pipe for Pressure Loss Calculations (%)", "range", 0, 100]);
                break;
            default:
                assertUnreachable(this.document.drawing.metadata.calculationParams.componentPressureLossMethod);
        }

        result.push(
            // ['ringMainCalculationMethod', 'Ring Main Calculation Method:', 'choice', RING_MAIN_CALCULATION_METHODS],
            ["ceilingPipeHeightM", "Default Pipe Height Above Floor (m):", "number"],
            ["roomTemperatureC", "Room Temperature (°C):", "range", 10, 40],
            ["gravitationalAcceleration", "Gravitational Acceleration (m/s^2):", "range", 9.77, 9.84, 0.001]
        );

        return result;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get calculationParams() {
        return this.document.drawing.metadata.calculationParams;
    }

    get committedCalculationParams() {
        return this.document.committedDrawing.metadata.calculationParams;
    }

    get reactiveData() {
        // do a little MacGyver to get the PSD and Dwelling method that way :/
        return new Proxy(this.calculationParams, {
            get(target, name) {
                if (name === "psdDwellingMethod") {
                    if (target.dwellingMethod !== null) {
                        return target.dwellingMethod;
                    } else {
                        return target.psdMethod;
                    }
                } else {
                    return (target as any)[name];
                }
            },
            set(target, name, value) {
                if (name === "psdDwellingMethod") {
                    if (isSupportedDwellingStandard(value)) {
                        switch (value) {
                            case SupportedDwellingStandards.as35002018Dwellings:
                                target.psdMethod = SupportedPsdStandards.as35002018LoadingUnits;
                                break;
                            case SupportedDwellingStandards.barriesBookDwellings:
                                target.psdMethod = SupportedPsdStandards.barriesBookLoadingUnits;
                                break;
                            default:
                                assertUnreachable(value);
                        }
                        target.dwellingMethod = value;
                    } else {
                        if (!isSupportedPsdStandard(value)) {
                            throw new Error("Invalid value to set psdDwellingMethod");
                        }
                        target.dwellingMethod = null;
                        target.psdMethod = value;
                    }
                } else {
                    (target as any)[name] = value;
                }
                return true;
            }
        });
    }

    save() {
        this.$store.dispatch("document/commit", false).then(() => {
            this.$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
        });
    }

    back() {
        this.$router.push({ name: "drawing" });
    }
}
</script>

<style lang="less"></style>
