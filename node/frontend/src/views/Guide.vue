<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container style="margin-top: 50px">
            <b-row>
                <b-col>
                    <h3>Guide</h3>
                </b-col>
            </b-row>
            <b-row style="padding-top: 20px">
                <b-col cols="4">
                    <div style="position:relative; height: calc(100vh - 180px); overflow-y:auto; text-align: left">
                        <b-navbar v-b-scrollspy:scrollspy-nested class="flex-column">
                            <b-nav pills vertical>
                                <template v-for="section in content">
                                    <template v-if="typeof section.content === 'string'">
                                        <b-nav-item
                                            @click="changeToPlay"
                                            v-bind:key="section.id"  
                                            :href="'#' + section.id" 
                                            style="font-weight: bold">{{
                                            section.title
                                        }}</b-nav-item>
                                    </template>
                                    <template v-else>
                                        <b-nav-item
                                            @click="changeToPlay" 
                                            v-bind:key="section.id+'nav'"
                                            v-b-toggle="getToggleId(section.id)" 
                                            :href="'#' + section.id" 
                                            style="font-weight: bold"
                                        >{{
                                            section.title
                                        }}</b-nav-item>
                                        <b-collapse 
                                            v-bind:key="section.id+'col'"
                                            :id="getToggleId(section.id)"
                                        >
                                            <b-nav pills vertical small>
                                                <template v-for="subsection in section.content">
                                                    <template v-if="typeof subsection.content === 'string'">
                                                        <b-nav-item
                                                            @click="changeToPlay"
                                                            v-bind:key="subsection.id+'nav'" 
                                                            class="ml-3 my-1"
                                                            :href="'#' + subsection.id" 
                                                        >
                                                            {{subsection.title}}
                                                        </b-nav-item>
                                                    </template>
                                                    

                                                     <template v-else>
                                                        <b-nav-item 
                                                            @click="changeToPlay"
                                                            v-bind:key="subsection.id+'nav'" 
                                                            v-b-toggle="getToggleId(subsection.id)"
                                                            :href="'#' + subsection.id"
                                                        >
                                                            {{subsection.title}}
                                                        </b-nav-item>
                                                        <b-collapse 
                                                            v-bind:key="subsection.id+'col'" 
                                                            :id="getToggleId(subsection.id)"
                                                        >
                                                             <b-nav-item
                                                                @click="changeToPlay"
                                                                v-bind:key="subsubsection.id" 
                                                                v-for="subsubsection in subsection.content"
                                                                :href="'#' + subsubsection.id" 
                                                            >
                                                                {{subsubsection.title}}
                                                            </b-nav-item>
                                                        </b-collapse>
                                                    </template>
                                                </template>
                                               
                                            </b-nav>
                                        </b-collapse>
                                    </template>
                                </template>
                            </b-nav>
                        </b-navbar>
                    </div>
                </b-col>
                <b-col cols="8">
                    <div
                        id="scrollspy-nested"
                        style="position:relative; height: calc(100vh - 180px); overflow-y:auto; text-align: left"
                    >
                        <YoutubeVideo :urlArgs="urlArgument">
                        </YoutubeVideo>
                    </div>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import YoutubeVideo from "./YoutubeVideo.vue";
import MainNavBar from "../components/MainNavBar.vue";

@Component({
    components: { MainNavBar, YoutubeVideo }
})
export default class Guide extends Vue {
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

    changeToPlay(){
        console.log('changing to play');
        console.log(this.$route.hash);
        this.toPlay = this.$route.hash.slice(1);
        console.log(this.toPlay);
    };

    get urlArgument(){
        if(this.categories.includes(this.toPlay)){
            return {'category': this.toPlay, 'title': ''};
        }
        else {
            return {'category': '', 'title': this.toPlay};
        }
    }

    getToggleId(id: string){
        return id;
    }

    get content(): NestedSection[] {
        return [

            {
                title: "Tutorials",
                id: "tutorials",
                content: [
                    {
                        title: "Novice",
                        id: "novice",
                        content: [
                            {
                                title: "Align floor plan",
                                id: 'H2X Engineering - How to align the floor plans in your multi level project',
                                content: ""
                            },
                            {
                                title: "Scale floor plan",
                                id: 'H2X Engineering - How to scale your floor plan',
                                content: ""
                            },
                        ]
                    },
                    {
                        title: "Beginner",
                        id: "beginner",
                        content: [
                            {
                                title: "Add hot water plant",
                                id: 'H2X Engineering - How to add hot water plant',
                                content: ""
                            },
                            {
                                title: "Add heater water return",
                                id: 'H2X Engineering - How to complete a heated water return system',
                                content: ""
                            },
                            {
                                title: "Draw pipes",
                                id: 'H2X Engineering - How to draw pipes',
                                content: ""
                            },
                            {
                                title: "Draw pipe between levels",
                                id: 'H2X Engineering - How to draw a pipe between levels (a riser)',
                                content: ""
                            },
                            {
                                title: "Connect fixtures",
                                id: 'H2X Engineering - How to auto connect fixtures',
                                content: ""
                            },
                            {
                                title: "Locate water source",
                                id: 'H2X Engineering - How to locate the water source',
                                content: ""
                            },
                        ]
                    },
                    // {
                    //     title: "Intermediate",
                    //     id: "intermediate",
                    //     content: [
                    //         {
                    //             title: "Intermediate Introduction Video",
                    //             id: 'intermediate-1',
                    //             content: "link for intermediate video 1"
                    //         },
                    //     ]
                    // },
                    // {
                    //     title: "Experienced",
                    //     id: "experienced",
                    //     content: [
                    //         {
                    //             title: "Experienced Introduction Video",
                    //             id: 'experienced-1',
                    //             content: "link for experienced video 1"
                    //         },
                    //     ]
                    // },
                    // {
                    //     title: "Expert",
                    //     id: "expert",
                    //     content: [
                    //         {
                    //             title: "Expert Introduction Video",
                    //             id: 'expert-1',
                    //             content: "link for expert video 1"
                    //         },
                    //     ]
                    // },
                ]
            },

            {
                title: "Reference",
                id: "reference",
                content: [
                    {
                        title: "PDF import",
                        id: "pdf-import",
                        content: [
                            {
                                title: "PDF import video 1",
                                id: 'pdf-1',
                                content: "link for pdf video 1"
                            },
                        ]
                    },
                    {
                        title: "Project Settings",
                        id: "project-settings",
                        content: [
                            {
                                title: "Project Settings Introduction Video",
                                id: 'project-1',
                                content: "link for project settings video 1"
                            },
                        ]
                    },
                    {
                        title: "Designing",
                        id: "designing",
                        content: [
                            {
                                title: "Designing Introduction Video",
                                id: 'designing-1',
                                content: "link for Designing video 1"
                            },
                        ]
                    },
                    {
                        title: "Results",
                        id: "results",
                        content: [
                            {
                                title: "Results Introduction Video",
                                id: 'results-1',
                                content: "link for results video 1"
                            },
                        ]
                    }
                ]
            },

        ];
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
    title: string;
    id: string;
    content:
        | Array<{
            title: string;
            id: string;
            content: 
                | Array<{
                title: string;
                id: string;
                content: String;
                }>
                | string;
            }>
        | string;
}
</script>
