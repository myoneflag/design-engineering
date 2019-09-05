<template>
    <FieldBuilder
            ref="fields"
            :fields="fields"
            :reactiveData="calculationParams"
            :originalData="committedCalculationParams"
            :onSave="save"
            :onBack="back"
    />
</template>

<script lang="ts">

    import Vue from 'vue'
    import Component from "vue-class-component";
    import {DocumentState} from '@/store/document/types';
    import * as _ from 'lodash';
    import FieldBuilder from '@/views/settings/FieldBuilder.vue';
    import {PIPE_SIZING_METHODS, PSD_METHODS, RING_MAIN_CALCULATION_METHODS} from "@/config";

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
    export default class Calculations extends Vue {


        get fields(): Array<Array<any>> {
            return [
                ["psdMethod", "PSD Calculation Method:", "choice", PSD_METHODS],
                ["pipeSizingMethod", "Pipe Sizing Method:", "choice", PIPE_SIZING_METHODS],
                ["ringMainCalculationMethod", "Ring Main Calculation Method:", "choice", RING_MAIN_CALCULATION_METHODS],
            ]
        }

        get document(): DocumentState {
            console.log("Refreshing document");
            return this.$store.getters["document/document"];
        }

        get calculationParams() {
            return this.document.drawing.calculationParams;
        }

        get committedCalculationParams() {
            return this.document.committedDrawing.calculationParams;
        }

        save() {
            this.$store.dispatch('document/commit').then(() => {
                this.$bvToast.toast("Saved successfully!", {variant: "success", title: "Success"});
            });
        }

        back() {
            this.$router.push({ name: 'document'});
        }
    }

</script>

<style lang="less">

</style>
