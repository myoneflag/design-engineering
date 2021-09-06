<template>
    <div>
        <iframe>
            <youtube :video-id="url" @ready="ready" @playing="playing" @paused="pauseHere" @ended="endHere">
            </youtube>
        </iframe>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";

export interface VideoLabels {
    category: string;
    title: string;
}

@Component({
    props: {
        url: String
    }
})
export default class YoutubeVideo extends Vue {
    player: any;
    playedTime: number;
}

</script>
