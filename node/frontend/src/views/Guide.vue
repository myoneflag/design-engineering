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
import YoutubeVideo, { VideoLabels } from "./YoutubeVideo.vue";
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

    get urlArgument(): VideoLabels {
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
                shortTitle: "Tutorials",
                title: "tutorials",
                id: 'tutorials',
                content: [
                    {
                        shortTitle: "Novice",
                        id: 'novice',
                        title: "novice",
                        content: [
                            {
                                shortTitle: "Align floor plan",
                                title: 'H2X Engineering - How to align the floor plans in your multi level project',
                                id: 'alignFloorPlan',
                                content: ""
                            },
                            {
                                shortTitle: "Scale floor plan",
                                title: 'H2X Engineering - How to scale your floor plan',
                                id: 'scaleFloorPlan',
                                content: ""
                            },
                        ]
                    },
                    {
                        shortTitle: "Beginner",
                        title: "beginner",
                        id: 'beginner',
                        content: [
                            {
                                shortTitle: "Add hot water plant",
                                title: 'H2X Engineering - How to add hot water plant',
                                id: 'addHotWaterPlant',
                                content: ""
                            },
                            {
                                shortTitle: "Add heater water return",
                                title: 'H2X Engineering - How to complete a heated water return system',
                                id: 'addHeaterWaterReturn',
                                content: ""
                            },
                            {
                                shortTitle: "Draw pipes",
                                title: 'H2X Engineering - How to draw pipes',
                                id: 'drawPipes',
                                content: ""
                            },
                            {
                                shortTitle: "Draw pipe between levels",
                                title: 'H2X Engineering - How to draw a pipe between levels (a riser)',
                                id: 'drawPipesBetweenLevels',
                                content: ""
                            },
                            {
                                shortTitle: "Connect fixtures",
                                title: 'H2X Engineering - How to auto connect fixtures',
                                id: 'connectFixtures',
                                content: ""
                            },
                            {
                                shortTitle: "Locate water source",
                                title: 'H2X Engineering - How to locate the water source',
                                id: 'locateWaterSource',
                                content: ""
                            },
                        ]
                    },
                    // {
                    //     shortTitle: "Intermediate",
                    //     title: "intermediate",
                    //     content: [
                    //         {
                    //             shortTitle: "Intermediate Introduction Vtitleeo",
                    //             title: 'intermediate-1',
                    //             content: "link for intermediate vtitleeo 1"
                    //         },
                    //     ]
                    // },
                    // {
                    //     shortTitle: "Experienced",
                    //     title: "experienced",
                    //     content: [
                    //         {
                    //             shortTitle: "Experienced Introduction Vtitleeo",
                    //             title: 'experienced-1',
                    //             content: "link for experienced vtitleeo 1"
                    //         },
                    //     ]
                    // },
                    // {
                    //     shortTitle: "Expert",
                    //     title: "expert",
                    //     content: [
                    //         {
                    //             shortTitle: "Expert Introduction Vtitleeo",
                    //             title: 'expert-1',
                    //             content: "link for expert vtitleeo 1"
                    //         },
                    //     ]
                    // },
                ]
            },

            {
                shortTitle: "Reference",
                title: "reference",
                id: 'reference',
                content: [
                    {
                        shortTitle: "PDF import",
                        title: "pdf-import",
                        id: 'pdfImport',
                        content: [
                            {
                                shortTitle: "PDF import vtitleeo 1",
                                title: 'pdf-1',
                                content: "link for pdf vtitleeo 1",
                                id: 'pdf1',
                            },
                        ]
                    },
                    {
                        shortTitle: "Project Settings",
                        title: "project-settings",
                        id: 'projectSettings',
                        content: [
                            {
                                shortTitle: "Project Settings Introduction Video",
                                title: 'project-1',
                                id: 'projectSettingsIntroduction',
                                content: "link for project settings video 1"
                            },
                        ]
                    },
                    {
                        shortTitle: "Designing",
                        title: "designing",
                        id: 'designing',
                        content: [
                            {
                                shortTitle: "Designing Introduction Vtitleeo",
                                title: 'designing-1',
                                id: 'designing1',
                                content: "link for Designing vtitleeo 1"
                            },
                        ]
                    },
                    {
                        shortTitle: "Results",
                        title: "results",
                        id: 'results',
                        content: [
                            {
                                shortTitle: "Results Introduction Vtitleeo",
                                title: 'results-1',
                                id: 'Results',
                                content: "link for results vtitleeo 1"
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
