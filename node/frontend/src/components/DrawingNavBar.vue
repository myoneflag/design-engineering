<template>
    <b-navbar type="light">
        <b-navbar-nav>
            <b-nav-item :to="{ name: 'home' }" active-class="active" exact :disabled="disabled">Home</b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav style="padding-left: 20px">
            <span v-if="titleEditing && !loading && !disabled">
                <b-input
                    v-model="document.drawing.metadata.generalInfo.title"
                    v-autowidth="{ maxWidth: '960px', minWidth: '20px', comfortZone: 0 }"
                    v-on:blur="commit"
                    @keyup.enter="commit"
                    @focus="$event.target.select()"
                    size="md"
                />
            </span>

            <b-navbar-brand
                :to="{ name: 'drawing' }"
                v-else
                @dblclick="titleEditing = !disabled"
                :disabled="disabled"
                v-b-tooltip.hover
                :title="document.drawing.metadata.generalInfo.title"
            >
                {{ shortTitle }}
            </b-navbar-brand>
            <b-navbar-brand v-if="currentLevel" @dblclick="titleEditing = true" :to="{ name: 'drawing' }">
                - {{ currentLevel.name }}
            </b-navbar-brand>

            <b-nav-item 
                :to="{ name: 'settings/general' }" 
                active-class="active" 
                exact 
                :disabled="loading || disabled" 
                v-if="profile"
                :class="{ onboarding: checkOnboardingClass(DocumentStep.Settings) }"
            >
                <span>
                    <v-icon name="cog"></v-icon>
                </span>
                Settings
            </b-nav-item>

            <b-nav-item :to="{ name: 'calculation-overview' }" active-class="active" exact :disabled="loading || disabled" v-if="profile">
                <span>
                    <v-icon name="info"></v-icon>
                </span>
                Calculation Info
            </b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav class="ml-auto" id="view-only-label">
            <b-button
                v-if="profile"
                :variant="document.uiState.drawingMode === DrawingMode.History ? 'light' : 'light'"
                :pressed="document.uiState.drawingMode === DrawingMode.History"
                :disabled="historyLoading || disabled"
                size="sm"
                class="my-2 my-sm-0"
                @click="historyClick"
                style="margin-right: 10px"
            >
                <b-spinner v-if="historyLoading" style="width: 1em; height: 1em;"></b-spinner>
                <v-icon name="history" v-else />
                History
            </b-button>

            <b-button
                v-if="document.uiState.viewOnly"
                variant="danger"
                :disabled="viewOnlyDisabled"
                @click="viewOnlyClick"
            >
                <v-icon name="eye" />
                View Only
                <b-tooltip v-if="document.uiState.viewOnlyReason" target="view-only-label">
                    {{ document.uiState.viewOnlyReason }}
                </b-tooltip>
            </b-button>
            <b-nav-text v-else-if="isSyncing">
                <b-spinner style="width: 1.0rem; height: 1.0rem;"></b-spinner>
                Saving...
            </b-nav-text>
            <b-nav-text v-else>
                <v-icon name="check" />
                Saved
            </b-nav-text>

            <b-nav-text>
                &nbsp; &nbsp; &nbsp;
            </b-nav-text>

            <ProfileMenuItem v-if="profile" :disabled="disabled"/>
            <b-nav-item v-else :to="{ name: 'login' }" id="login">Login</b-nav-item>
        </b-navbar-nav>
    </b-navbar>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
import Mousetrap from 'mousetrap';
import { DocumentState } from "../store/document/types";
import { State } from "vuex-class";
import Component from "vue-class-component";
import ProfileMenuItem from "../../src/components/ProfileMenuItem.vue";
import { AccessLevel, User } from "../../../common/src/models/User";
import { Level } from "../../../common/src/api/document/drawing";
import { getDocumentOperations } from "../api/document";
import { DrawingMode } from "../htmlcanvas/types";
import { Operation } from "../../../common/src/models/Operation";
import OnboardingState, { ONBOARDING_SCREEN } from "../store/onboarding/types";
import { DocumentStep } from "../store/onboarding/steps";

@Component({
    components: { ProfileMenuItem },
    props: {
        loading: Boolean,
        disabled: Boolean,
    }
})
export default class DrawingNavBar extends Vue {
    @State("document") documentState!: DocumentState;

    titleEditing = false;
    historyLoading = false;

    mounted() {
        const { settings } = this.hotKeySetting;
        if (settings) {
            Mousetrap.bind(settings, this.toggleSettings);
        }
        
    }

    get hotKeySetting(): { [key: string]: string } {
        return this.$store.getters["hotKey/setting"];
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get shortTitle() {
        let title = this.document.drawing.metadata.generalInfo.title;
        if (title.length > 50) {
            title = title.slice(0, 40) + "..." + title.slice(title.length - 7, title.length);
        }
        return title;
    }

    get currentLevel(): Level | null {
        if (this.document.uiState.levelUid === null) {
            return null;
        }
        return this.document.drawing.levels[this.document.uiState.levelUid];
    }

    get isSyncing(): boolean {
        return this.$store.getters["document/isSyncing"];
    }

    viewOnlyClick() {
        if (this.profile?.accessLevel <= AccessLevel.ADMIN) {
            if (
                this.document.uiState.viewOnlyReason ===
                "Superusers view documents in View Only mode by default (click to edit)"
            ) {
                this.document.uiState.viewOnly = false;
                this.document.uiState.viewOnlyReason = null;
            }
        }
    }

    get viewOnlyDisabled() {
        if (this.profile?.accessLevel <= AccessLevel.ADMIN) {
            if (
                this.document.uiState.viewOnlyReason ===
                "Superusers view documents in View Only mode by default (click to edit)"
            ) {
                return false;
            }
        }
        return true;
    }

    get discreteHistory(): Operation[][] {
        return this.$store.getters["document/discreteHistory"];
    }

    get onboarding(): OnboardingState {
        return this.$store.getters["onboarding/onboarding"];
    }

    async historyClick() {
        if (this.historyLoading) {
            return;
        }

        if (this.document.uiState.drawingMode === DrawingMode.History) {
            await this.$store.dispatch("document/revertFull");
            this.document.uiState.drawingMode = DrawingMode.Hydraulics;
            return;
        }

        this.historyLoading = true;
        try {
            const after = this.document.fullHistory.length
                ? this.document.fullHistory[this.document.fullHistory.length - 1].orderIndex
                : -1;
            const ops = await getDocumentOperations(this.document.documentId, after);
            if (ops.success) {
                this.document.fullHistory.push(...ops.data);
                this.document.uiState.historyIndex = -1;

                await this.$store.dispatch("document/resetDrawing");

                this.document.uiState.drawingMode = DrawingMode.History;
            } else {
                this.$bvToast.toast(ops.message, {
                    variant: "danger",
                    title: "Couldn't Load Document History"
                });
            }
        } finally {
            this.historyLoading = false;
        }
    }

    commit() {
        this.titleEditing = false;
        this.$store.dispatch("document/commit");
    }

    get DrawingMode() {
        return DrawingMode;
    }

    get DocumentStep() {
        return DocumentStep;
    }

    toggleSettings() {
        this.$router.push({name: 'settings/general'});
    }

    checkOnboardingClass(step: number) {
        return step === this.onboarding.currentStep && this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT;
    }
}
</script>

<style lang="less">
.navbar {
    padding: 10px;
    background-color: #ffffff;
    border-bottom: 1px solid lightgray;
}

#login a {
    color: #007bff;
}
</style>
