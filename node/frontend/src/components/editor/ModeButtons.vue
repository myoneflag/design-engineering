<template>
    <div>
        <b-row style="position:absolute; left:20px; top:80px;">
            <b-col>
                <b-button-group>
                    <b-button
                        variant="outline-dark"
                        class="modebtn background btn-sm"
                        :class="{ onboarding: checkOnboardingClass(2) }"
                        :pressed="mode === 0"
                        @click="toggleFloorPlan"
                    ><v-icon name="ruler-combined" scale="2" /><br />Floor Plan</b-button>
                    <b-button
                        variant="outline-dark"
                        class="modebtn pipes btn-sm"
                        :class="{ onboarding: checkOnboardingClass(3) }"
                        :pressed="mode === 1"
                        @click="togglePlumbing"
                    ><v-icon name="wave-square" scale="2.5" /><br />Plumbing</b-button>
                    <b-button
                        variant="outline-dark"
                        class="modebtn results btn-sm"
                        :class="{ onboarding: checkOnboardingClass(4) }"
                        :pressed="mode === 2"
                        @click="toggleResults"
                    ><v-icon name="calculator" scale="2" /><br />Results</b-button>
                </b-button-group>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Mousetrap from 'mousetrap';
import { DocumentState } from "../../store/document/types";
import OnboardingState, { ONBOARDING_SCREEN } from "../../store/onboarding/types";

@Component({
    props: {
        mode: Number
    }
})
export default class ModeButtons extends Vue {
    mounted() {
        const { floorPlan, plumbing, results } = this.hotKeySetting;

        Mousetrap.bind(floorPlan, this.toggleFloorPlan);
        Mousetrap.bind(plumbing, this.togglePlumbing);
        Mousetrap.bind(results, this.toggleResults);
    }
    
    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }
    
    get hotKeySetting(): { [key: string]: string } {
        return this.$store.getters["hotKey/setting"];
    }

    isBrandNew() {
        return this.$store.getters["document/isBrandNew"];
    }

    get onboarding(): OnboardingState {
        return this.$store.getters["onboarding/onboarding"];
    }

    toggleFloorPlan() {
        this.$emit('update:mode', 0);
    }

    togglePlumbing() {
        this.$emit('update:mode', 1);
    }

    toggleResults() {
        this.$emit('update:mode', 2);
    }

    checkOnboardingClass(step: number) {
        return step === this.onboarding.currentStep && this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT;
    }
}
</script>

<style lang="less">
.modebtn {
    height: 70px;
    width: 80px;
    font-size: 12px;
    background-color: white;
}

.numberCircle {
    border-radius: 50%;
    margin-left: 20px;
    margin-right: 20px;
    width: 40px;
    height: 40px;
    padding: 8px;
    background: #fff;
    border: 2px solid #666;
    color: #666;
    text-align: center;
    font: 20px Arial, sans-serif;
}
/*
    .background {
        background-image: url("https://image.freepik.com/free-vector/blueprint-house-plan-drawing-figure-jotting_70347-1372.jpg");
        background-size: cover;
    }
    .pipes {
        background-image: url("https://st4.depositphotos.com/17253970/20674/v/1600/depositphotos_206740610-stock-illustration-water-pipe-color-illustration-vector.jpg");
        background-size: contain;
    }
    .results {
        background-image: url("https://cdn4.iconfinder.com/data/icons/seo-round-color-shapes/355572/34-512.png");
        background-size: contain;
    }*/
</style>
