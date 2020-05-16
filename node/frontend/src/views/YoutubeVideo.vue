<template>
    <div>
        <youtube :video-id="url" @ready="ready" @playing="playing" @paused="pauseHere" @ended="endHere">
        </youtube>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VueYouTubeEmbed from "vue-youtube-embed";
Vue.use(VueYouTubeEmbed);
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
    playedTime: Number;

    mounted() {
    }

    ready(event: any){
    }

    playing(){
        console.log('youtube playing');
        console.log('play current time?')
    }

    pauseHere(){
    }

    endHere(){
    }

    @Watch('urlArgs')
    onPropUrlChanged(value: VideoLabels, oldValue: VideoLabels) {
    }

}

</script>
