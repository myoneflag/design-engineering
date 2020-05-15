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
import { getVideo, addVideoViewHistory } from "../api/videos";
import { VideoResult } from "../../../common/src/api/video"
import { Video } from "../../../common/src/models/Video";
import { Watch } from "vue-property-decorator";

export interface VideoLabels {
    category: string;
    title: string;
}

@Component({
    props: {
        urlArgs: Object
    }
})
export default class YoutubeVideo extends Vue {
    player: any;
    videoResult: Video;
    url: String = "";
    playedTime: Number;

    mounted() {
        getVideo(this.$props.urlArgs.category, this.$props.urlArgs.title).then((ret)=>{
            if (ret.success){
                if (ret.data.video){
                    if (ret.data.video.url){
                        this.url = ret.data.video.url;
                        this.videoResult = ret.data.video;
                        this.playedTime = ret.data.startOn || 0;
                    }
                }
            }
        }).catch(e=>{
            console.log('here prop url change weird');
            console.log(e);
        });
    }

    ready(event: any){
        this.player = event.target;
        console.log('this video play time');
        console.log(this.playedTime);
        console.log('after seeking');
        if (typeof this.player.seekTo === 'function'){
            console.log('valid function it is');
        }
        this.player.seekTo(this.playedTime, false);
    }

    playing(){
        console.log('youtube playing');
        console.log('play current time?')
    }

    pauseHere(){
        console.log('why why?')
        console.log(this.videoResult.title);
        addVideoViewHistory(this.videoResult.title, false, this.player.getCurrentTime())
        .then((ret)=>{
            console.log(ret);
        })
        .catch((e)=>{
            console.log('error is!!!');
            console.log(e);
        });
    }

    endHere(){
        console.log('end here current');
        console.log(this.player.getCurrentTime());
        addVideoViewHistory(this.videoResult.title, true, this.player.getCurrentTime())
        .catch((e)=>{
            console.log('error is!!!');
            console.log(e);
        });
    }

    @Watch('urlArgs')
    onPropUrlChanged(value: VideoLabels, oldValue: VideoLabels) {
        console.log('prop');
        console.log(value);
        getVideo(value.category, value.title).then((ret)=>{
            if (ret.success){
                if (ret.data.video){
                    if (ret.data.video.url){
                        this.url = ret.data.video.url;
                        this.videoResult = ret.data.video;
                        console.log(this.url);
                    }
                }
            }
        }).catch(e=>{
            console.log('here prop url change weird');
            console.log(e);
        });
    }

}

</script>
