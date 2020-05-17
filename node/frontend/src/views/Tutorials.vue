<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container style="margin-top: 50px">
            <b-row>
                <b-col>
                    <h3>Tutorials</h3>
                </b-col>
            </b-row>
            <b-row style="padding-top: 20px">
                <b-col cols="4">
                    <div role="tablist">
                        <template v-for="(level, index) in skillLevels">
                            <b-card
                                    no-body
                                    class="mb-1"
                            >
                                <b-card-header header-tag="header" class="p-1" role="tab">
                                    <b-button block v-b-toggle="'menu-accordion-' + index" variant="primary">
                                        <v-icon name="check" v-if="isLevelWatched(level)"/>
                                        <b-badge v-else variant="danger">{{ numUnwatched(level) }}</b-badge>
                                        {{level.name + ' Videos'}}
                                    </b-button>
                                </b-card-header>
                                <b-collapse
                                        :id="'menu-accordion-' + index"
                                        accordion="menu-accordion"
                                        role="tabpanel"
                                >
                                    <b-card-body>
                                        <b-nav pills vertical>
                                            <b-nav-item
                                                    v-for="videoId in level.videoRequirements"
                                                    :to="'/tutorials/' + videoId"
                                                    variant="success"
                                            >
                                                <v-icon name="check" v-if="isVideoWatched(videoId)"/>
                                                {{ VIDEO_INDEX[videoId].id }}
                                            </b-nav-item>
                                        </b-nav>
                                    </b-card-body>
                                </b-collapse>
                            </b-card>
                        </template>

                    </div>
                </b-col>
                <b-col cols="8">
                    <b-alert v-if="$route.params.videoId === undefined" variant="success" show>Choose a video from the left</b-alert>
                    <b-alert v-else-if="VIDEO_INDEX[$route.params.videoId] === undefined" variant="error" alert>The video linked is invalid.</b-alert>
                    <template v-else>
                        <template v-if="loadedVideo[$route.params.videoId]">
                            <h4>{{loadedVideo[$route.params.videoId].title}}</h4>
                        </template>
                        <h4 v-else-if="loadVideo($route.params.videoId)">Loading video link...</h4>

                        <youtube :video-id="VIDEO_INDEX[$route.params.videoId].videoId" @ended="videoEnded" @playing="videoPlaying" @paused="videoPaused">

                        </youtube>

                        <b-button v-if="isVideoWatched($route.params.videoId)" disabled variant="success"><v-icon name="check"/> Watched</b-button>
                        <b-button v-else  @click="markAsWatched" variant="warning">Mark as Watched</b-button>
                    </template>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import MainNavBar from "../components/MainNavBar.vue";
import { SKILL_LEVELS, SkillLevel } from "../lib/tutorials/skillLevels";
import { VIDEO_INDEX, VideoRecord, VideoSpec, videoSpec2Record } from "../lib/tutorials/videos";
import { recordVideoView } from "../api/videos";
import YoutubeVideo from "./YoutubeVideo.vue";

@Component({
    components: { YoutubeVideo, MainNavBar }
})
export default class Tutorials extends Vue {
    toPlay: string = "";
    categories: string[] = [
        'tutorials',
        'novice',
        'beginner',
        'intermediate',
        'experienced',
        'expert',
        'reference',
        'pdf-import',
        'project-settings',
        'designing',
        'results'
    ];

    loadedVideo: {[key: string]: VideoRecord} = {};
    markAsWatchedVideoId: string = '';
    currentVideoWatchedDurationMS: number = 0;
    lastPlayStart: number = (new Date()).getTime();
    markAsWatchedTimer: NodeJS.Timeout;

    loadVideo(id: string) {
        this.currentVideoWatchedDurationMS = 0;
        videoSpec2Record((VIDEO_INDEX[id])).then((res) => {
            Vue.set(this.loadedVideo, id, res);
        });

        return true;
    }

    get watchedVideoSet() {
        const watchedIds: string[] = this.$store.getters['profile/viewedVideoIds'];
        const res = new Set<string>();
        for (const id of watchedIds) {
            res.add(id);
        }
        return res;
    }

    get skillLevels(): SkillLevel[] {
        return SKILL_LEVELS.filter((l) => l.videoRequirements.length);
    }

    get VIDEO_INDEX() {
        return VIDEO_INDEX;
    }

    async markAsWatched() {
        const target = this.$route.params.videoId;
        const res = await recordVideoView(target);
        if (res.success) {
            this.$store.dispatch('profile/recordVideoView', target);
        } else {
            this.$bvToast.toast(res.message, {
                title: 'Could not mark video as watched',
                variant: 'error',
            })
        }
    }

    videoEnded() {
        this.markAsWatched();
    }

    videoPlaying() {
        this.markAsWatchedVideoId = this.$route.params.videoId;
        this.lastPlayStart = new Date().getTime();
        this.markAsWatchedTimer = setTimeout(() => {
            if (this.markAsWatchedVideoId === this.$route.params.videoId) {
                this.markAsWatched();
            }
        }, 10000 - this.currentVideoWatchedDurationMS);
    }

    videoPaused() {
        this.currentVideoWatchedDurationMS += (new Date().getTime()) - this.lastPlayStart;
        clearTimeout(this.markAsWatchedTimer);
    }

    isVideoWatched(videoId: string) {
        return this.watchedVideoSet.has(videoId);
    }

    isLevelWatched(level: SkillLevel) {
        for (const v of level.videoRequirements) {
            if (!this.isVideoWatched(v)) {
                return false;
            }
        }
        return true;
    }

    numUnwatched(level: SkillLevel) {
        let res = 0;
        for (const v of level.videoRequirements) {
            if (!this.isVideoWatched(v)) {
                res += 1;
            }
        }
        return res
    }

}

interface Section {
    title: string;
    id: string;
    content:
        | Array<{
              title: string;
              id: string;
              content: string;
          }>
        | string;
}

interface NestedSection {
    shortTitle: string;
    title: string;
    id: string;
    content:
        | Array<{
            shortTitle: string;
            title: string;
            id: string;
            content:
                | Array<{
                shortTitle: string;
                title: string;
                id: string;
                content: String;
                }>
                | string;
            }>
        | string;
}
</script>
