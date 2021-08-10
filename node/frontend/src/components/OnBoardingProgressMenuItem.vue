<template>
    <b-nav-item id="on-boarding-progress-popover" @click="nextOnBoardingStep">
        {{ currentProgress.level.name }}
        <b-badge variant="primary"> {{ currentProgress.overallLevelProgress }}%</b-badge>
        <FeedbackModal v-model="showFeedbackModal"/>

        <b-popover target="on-boarding-progress-popover" triggers="hover" placement="bottom"
                   v-if="!currentProgress.complete" style="max-width: 100%">
            <b-table-simple>
                <b-thead>
                    <b-tr>
                        <th>
                            Requirement
                        </th>
                        <th>
                            Progress
                        </th>
                        <th>
                            Action
                        </th>
                    </b-tr>
                </b-thead>
                <b-tbody>
                    <b-tr v-if="currentProgress.videosTotal">
                        <b-td>
                            Watch the {{ currentProgress.level.name }} Videos
                        </b-td>
                        <b-td>
                            <v-icon name="check" variant="success" v-if="currentProgress.videosComplete"/>
                            <p v-else>{{ currentProgress.videosWatched }}/{{ currentProgress.videosTotal }}</p>
                        </b-td>
                        <b-td>
                            <p v-if="currentProgress.videosComplete">All Good!</p>
                            <b-button v-else :to="'/tutorials/' + currentProgress.nextVideoToWatch" variant="success">
                                Videos
                            </b-button>
                        </b-td>
                    </b-tr>
                    <b-tr v-if="currentProgress.drawingsNeeded">
                        <b-td>
                            Create {{ currentProgress.drawingsNeeded }} Projects
                        </b-td>
                        <b-td>
                            <v-icon name="check" variant="success" v-if="currentProgress.drawingsComplete"/>
                            <p v-else>{{ currentProgress.drawingsCreated }}/{{ currentProgress.drawingsNeeded }}</p>
                        </b-td>
                        <b-td>
                            <p v-if="currentProgress.drawingsComplete">All Good!</p>
                            <b-button v-else :to="'/'" variant="success">Create Project</b-button>
                        </b-td>
                    </b-tr>

                    <b-tr v-if="currentProgress.feedbackNeeded">
                        <b-td>
                            Submit feedback, eg. a feature request, comment or report a bug!
                        </b-td>
                        <b-td>
                            <v-icon name="check" variant="success" v-if="currentProgress.feedbackComplete"/>
                            <p v-else>{{ currentProgress.feedbackSubmitted }}/{{ currentProgress.feedbackNeeded }}</p>
                        </b-td>
                        <b-td>
                            <p v-if="currentProgress.feedbackComplete">All Good!</p>
                            <b-button v-else @click="feedbackSubmit" variant="success">Submit Feedback</b-button>
                        </b-td>

                    </b-tr>
                </b-tbody>
            </b-table-simple>
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
            FeedbackModal
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

                res.drawingsNeeded = lvl.requiredDrawingsCreated;
                res.feedbackNeeded = lvl.requiredFeedbacksSubmitted;

                for (const v of lvl.videoRequirements) {
                    res.videosTotal++;
                    if (viewedVideoIds.includes(v)) {
                        res.videosWatched++;
                    } else {
                        res.videosComplete = false;
                        res.nextVideoToWatch = res.nextVideoToWatch || v;
                    }
                }

                res.drawingsComplete = res.drawingsCreated >= res.drawingsNeeded;
                res.feedbackComplete = res.feedbackSubmitted >= res.feedbackNeeded;

                res.level = lvl;

                res.complete = res.videosComplete && res.drawingsComplete && res.feedbackComplete;
                res.overallLevelProgress =
                    (res.videosWatched
                        + Math.min(res.drawingsCreated, res.drawingsNeeded)
                        + Math.min(res.feedbackSubmitted, res.feedbackNeeded)) /

                    (res.videosTotal + res.drawingsNeeded + res.feedbackNeeded);
                res.overallLevelProgress = Math.round(res.overallLevelProgress * 100);
                if (res.videosTotal + res.drawingsNeeded + res.feedbackNeeded === 0) {
                    res.overallLevelProgress = 100;
                }

                if (!res.complete) {
                    break;
                }
            }
            
            return res;
        }

        nextOnBoardingStep() {
            const prog = this.currentProgress;
            if (!prog.videosComplete) {
                this.$router.push("/tutorials/" + prog.nextVideoToWatch);
            } else if (!prog.drawingsComplete) {
                this.$router.push("/");
            } else if (!prog.feedbackComplete) {
                this.showFeedbackModal = true;
            }
        }

        feedbackSubmit() {
            this.showFeedbackModal = true;
        }
    }
</script>

<style lang="less">
    .popover {
        max-width: 500px;
    }
</style>
