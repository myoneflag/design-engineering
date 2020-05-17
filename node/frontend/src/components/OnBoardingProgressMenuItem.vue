<template>
    <b-nav-item id="on-boarding-progress-popover" @click="nextOnBoardingStep">
        {{ currentProgress.level.name }}
        <b-badge variant="primary"> {{ currentProgress.overallLevelProgress }}%</b-badge>

        <b-popover target="on-boarding-progress-popover" triggers="hover" placement="bottom">
            <table>
                <tr>
                    <th>
                       Requirement
                    </th>
                    <th>
                        Progress
                    </th>
                    <th>
                        Action
                    </th>
                </tr>
                <tr v-if="currentProgress.videosTotal">
                    <td>
                        Watch the {{ currentProgress.level.name }} Videos
                    </td>
                    <td>
                        <v-icon name="check" variant="success" v-if="currentProgress.videosComplete"/>
                        <p v-else>{{ currentProgress.videosWatched }}/{{ currentProgress.videosTotal }}</p>
                    </td>
                    <td>
                        <p v-if="currentProgress.videosComplete">All Good!</p>
                        <b-button v-else :to="'/tutorials/' + currentProgress.nextVideoToWatch" variant="success">Videos</b-button>
                    </td>
                </tr>
                <tr v-if="currentProgress.drawingsNeeded">
                    <td>
                        Create {{ currentProgress.drawingsNeeded }} Drawings
                    </td>
                    <td>
                        <v-icon name="check" variant="success" v-if="currentProgress.drawingsComplete"/>
                        <p v-else>{{ currentProgress.drawingsCreated }}/{{ currentProgress.drawingsNeeded }}</p>
                    </td>
                    <td>
                        <p v-if="currentProgress.drawingsComplete">All Good!</p>
                        <b-button v-else :to="'/'" variant="success">Create Drawing</b-button>
                    </td>
                </tr>

                <tr v-if="currentProgress.feedbackNeeded">
                    <td>
                        Submit feedback, eg. a feature request, comment or report a bug!
                    </td>
                    <td>
                        <v-icon name="check" variant="success" v-if="currentProgress.feedbackComplete"/>
                        <p v-else>{{ currentProgress.feedbackSubmitted }}/{{ currentProgress.feedbackNeeded }}</p>
                    </td>
                    <td>
                        <p v-if="currentProgress.feedbackComplete">All Good!</p>
                        <b-button v-else @click="feedbackSubmit" variant="success">Submit Feedback</b-button>
                    </td>

                    <FeedbackModal v-model="showFeedbackModal"/>
                </tr>
            </table>
        </b-popover>
    </b-nav-item>

</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { SKILL_LEVELS, SkillLevel } from "../lib/tutorials/skillLevels";
    import FeedbackModal from "./FeedbackModal.vue";

    interface CurrentOnBoardingProgress {
        level: SkillLevel;

        videosWatched: number;
        videosTotal: number;
        videosComplete: boolean;
        nextVideoToWatch: string | null;

        drawingsCreated: number;
        drawingsNeeded: number;
        drawingsComplete: boolean;

        feedbackSubmitted: number;
        feedbackNeeded: number;
        feedbackComplete: boolean;

        overallLevelProgress: number;
        complete: boolean;
    }

    @Component({
        components: {
            FeedbackModal,
        }
    })
    export default class OnBoardingProgressMenuItem extends Vue {

        showFeedbackModal = false;

        get currentProgress(): CurrentOnBoardingProgress {
            const numDrawingsCreated: number = this.$store.getters["profile/numDrawingsCreated"];
            const numFeedbackSubmitted: number = this.$store.getters["profile/numFeedbackSubmitted"];
            const viewedVideoIds: string[] = this.$store.getters["profile/viewedVideoIds"];

            const res: CurrentOnBoardingProgress = {
                complete: false,
                overallLevelProgress: 0,
                drawingsComplete: false,
                drawingsCreated: numDrawingsCreated,
                drawingsNeeded: 0,
                nextVideoToWatch: null,
                feedbackComplete: false,
                feedbackNeeded: 0,
                feedbackSubmitted: numFeedbackSubmitted,
                level: SKILL_LEVELS[0],
                videosComplete: false,
                videosTotal: 0,
                videosWatched: 0
            };

            for (const lvl of SKILL_LEVELS) {
                // have we got this level?
                res.videosComplete = true;
                res.videosTotal = 0;
                res.videosWatched = 0;
                res.nextVideoToWatch = null;
                for (const v of lvl.videoRequirements) {
                    res.videosTotal++;
                    if (viewedVideoIds.includes(v)) {
                        res.videosWatched++;
                    } else {
                        res.videosComplete = false;
                        res.nextVideoToWatch = res.nextVideoToWatch || v;
                    }
                }

                res.drawingsCreated = lvl.requiredDrawingsCreated;
                res.drawingsComplete = res.drawingsCreated >= lvl.requiredDrawingsCreated;
                res.feedbackSubmitted = lvl.requiredFeedbacksSubmitted;
                res.feedbackComplete = res.feedbackSubmitted >= lvl.requiredFeedbacksSubmitted;

                res.level = lvl;

                res.complete = res.videosComplete && res.drawingsComplete && res.feedbackComplete;
                res.overallLevelProgress =
                    (res.videosWatched
                    + Math.min(res.drawingsCreated, res.drawingsNeeded)
                    + Math.min(res.feedbackSubmitted, res.feedbackNeeded)) /

                    (res.videosTotal + res.drawingsNeeded + res.feedbackNeeded);
                res.overallLevelProgress = Math.round(res.overallLevelProgress * 100);

                if (!res.complete) {
                    break;
                }
            }

            return res;
        }

        nextOnBoardingStep() {
            const prog = this.currentProgress;
            if (!prog.videosComplete) {
                this.$router.push('/tutorials/' + prog.nextVideoToWatch);
            } else if (!prog.drawingsComplete) {
                this.$router.push('/');
            } else if (!prog.feedbackComplete) {
                this.showFeedbackModal = true;
            }
        }

        feedbackSubmit() {
            this.showFeedbackModal = true;
        }
    }
</script>
