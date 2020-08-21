<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <b-container style="margin-top: 50px">
            <b-row>
                <b-col>
                    <h3>Project Settings</h3>
                </b-col>
            </b-row>
            <b-row style="padding-top: 20px">
                <b-col cols="2">
                    <b-nav vertical pills style="top: 0;">
                        <b-nav-item :to="{ name: 'settings/general' }" active-class="active"
                            :class="{onboarding: onboarding.currentStep === 1}"
                        >General</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/units' }" active-class="active"
                            :class="{onboarding: onboarding.currentStep === 2}"
                        >Units</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/catalog' }" active-class="active"
                            :class="{onboarding: onboarding.currentStep === 3}"
                        >Catalog</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/budget' }" active-class="active">Budget</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/fixtures' }" active-class="active"
                            :class="{onboarding: onboarding.currentStep === 4}"
                        >Fixtures</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/flow-systems' }" active-class="active"
                            :class="{onboarding: onboarding.currentStep === 5}"
                        >Flow Systems</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/calculations' }" active-class="active"
                                    :class="{onboarding: onboarding.currentStep === 6}"
                            >Calculations</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/document' }" active-class="active"
                                    :class="{onboarding: onboarding.currentStep === 7}"
                        >Document</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/hot-keys' }" active-class="active">Hot Keys</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/debug' }" active-class="active" style="opacity: 0.1"
                            >Debug</b-nav-item>
                    </b-nav>
                </b-col>
                <b-col cols="10">
                    <div style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 200px)">
                        <router-view> </router-view>
                    </div>
                </b-col>
            </b-row>
        </b-container>
        <Onboarding :screen="onboardingScreen"></Onboarding>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import DrawingNavBar from "../../components/DrawingNavBar.vue";
import Onboarding from "../../components/Onboarding.vue";
import OnboardingState, { ONBOARDING_SCREEN } from "../../store/onboarding/types";

@Component({
    components: { DrawingNavBar, Onboarding }
})
export default class ProjectSettings extends Vue {
    get onboarding(): OnboardingState {
        return this.$store.getters["onboarding/onboarding"];
    }

    get onboardingScreen() {
        return ONBOARDING_SCREEN.DOCUMENT_SETTING;
    }
}
</script>
