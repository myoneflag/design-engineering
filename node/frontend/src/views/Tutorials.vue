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
                                            <b-nav-item v-for="videoId in level.videoRequirements">
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
import { VIDEO_INDEX } from "../lib/tutorials/videos";

@Component({
    components: { MainNavBar }
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

    get skillLevels(): SkillLevel[] {
        return SKILL_LEVELS.filter((l) => l.videoRequirements.length);
    }

    get VIDEO_INDEX() {
        return VIDEO_INDEX;
    }

    changeToPlay(){
        console.log('changing to play');
        console.log(this.$route.hash);
        this.toPlay = this.$route.hash.slice(1);
        console.log(this.toPlay);
    };

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
