<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container>
            <b-row>
                <b-col>
                    <h3>All Videos</h3>
                    <b-list-group>
                        <b-list-group-item
                            v-for="v in allVideos"
                            :key="v.id"
                        >
                            {{formatVideo(v)}}
                        </b-list-group-item>
                    </b-list-group>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <h3>Video Category Listings</h3>
                    <b-list-group>
                        <b-list-group-item
                            v-for="v in allVideoListings"
                            :key="v.id"
                        >
                            {{formatVlisting(v)}}
                        </b-list-group-item>
                    </b-list-group>
                </b-col>
            </b-row>
            <b-row>
                <template v-for="field in newVideoForm">
                   <label :key="field[0]">{{field[0]}}</label>
                   <b-form-input :key="field[0]" :id="field[0]" :type="field[1]" :value="videoObj[field[2]]"  @input="videoObj[field[2]] = $event"></b-form-input>
                </template>
                <b-button variant="primary" @click="addNewVideo">Add video</b-button>
                <b-button variant="secondary" @click="addNewVideoListing">Add video listing (category)</b-button>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import MainNavBar from "../components/MainNavBar.vue";
import { getAllVideoListing, addVideo, addVideoListing, getAllVideos } from "../api/videos";
import { VideoListing } from "../../../common/src/models/VideoListing";
import { Video } from "../../../common/src/models/Video";
import {Decimal} from 'decimal.js';


function sortVideoListing(a:VideoListing, b:VideoListing){
    if (a.category>b.category){
        return 1;
    }
    else if (b.category>a.category){
        return -1
    }
    else if (new Decimal(a.order)>new Decimal(b.order)){
        return 1;
    }
    else if (new Decimal(b.order)>new Decimal(a.order)){
        return -1;
    }
    else{
        return 0;
    }
}

@Component({
    components: {
        MainNavBar
    }
})
export default class AddVideo extends Vue {
    videoListings: VideoListing[] = [];
    videos: Video[] = [];
    title: String = "";
    url: String = "";
    category: String = "";
    order: String = "";
    progressValue: String = "";
    videoObj = {
        'title': 'new title',
        'url': 'here an url',
        'category': '',
        'order': '',
        'progressValue': ''
    };
    get newVideoForm(){
        return [
            ['title', 'text', 'title'],
            ['youtube video id', 'text', 'url'],
            ['category', 'text', 'category'],
            ['order', 'text', 'order'],
            ['progress value', 'number', 'progressValue']
        ]
    }

    get allVideos(){
        return this.videos;
    }
    get newVideoObj(){
        return this.videoObj;
    }
    get allVideoListings(){
        return this.videoListings;
    }

    getVideosIn(){
        getAllVideos().then((res) => {
            if (res.success){
                this.videos = res.data;
            }
        })
    }
    getAndSortVideoListing(){
        getAllVideoListing().then((res) => {
            if (res.success) {
                this.videoListings = res.data;
                this.videoListings.sort(sortVideoListing);
                console.log('this video listing is');
                console.log(this.videoListings);
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error retrieving contact list"
                });
            }
        });
    }
    mounted() {
        // fill documents
        this.getAndSortVideoListing();
        this.getVideosIn();
    }

    addNewVideo(){
        addVideo(this.videoObj['title'], this.videoObj['url'])
        .then(()=>{
            this.getVideosIn();
        })
    }

    addNewVideoListing(){
        addVideoListing(this.videoObj['title'], this.videoObj['category'], this.videoObj['order'])
        .then(()=>{
            this.getAndSortVideoListing();
        });
    }

    formatVlisting(v:VideoListing){
        return `category: ${v.category}, title: ${v.video.title}, order: ${v.order}`
    }

    formatVideo(v:Video){
        return `title: ${v.title}, Youtube ID: ${v.url}, submitter: ${v.submitter ? v.submitter.username : "null"}`
    }

}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
