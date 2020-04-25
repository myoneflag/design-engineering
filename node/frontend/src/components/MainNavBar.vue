<template>
    <b-navbar type="light">
        <b-navbar-nav>
            <b-navbar-brand href="https://h2xengineering.com" v-b-tooltip.hover="{ title: 'Public Site' }">
                <img src="@/assets/h2x.png" class="d-inline-block align-top" height="30" />
            </b-navbar-brand>
        </b-navbar-nav>
        <b-navbar-nav>
            <b-nav-item :to="{ name: 'home' }" active-class="active" exact>Your Drawings</b-nav-item>
        </b-navbar-nav>
        <b-progress id="progressBar" :value="progressValue.value" variant="info" animated></b-progress>
        <b-popover target="progressBar" triggers="hover" placement="top">
            <div>
                <b-form-group :label="progressValue.rank">
                <b-form-checkbox-group
                    id="checkbox-group-1"
                    v-model="selected"
                    :options="options"
                ></b-form-checkbox-group>
                </b-form-group>
            </div>
        </b-popover>
        <b-navbar-nav class="ml-auto">
            <ProfileMenuItem />
        </b-navbar-nav>
    </b-navbar>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import ProfileMenuItem from "../../src/components/ProfileMenuItem.vue";
import { getLevelAndRequirements } from "../api/levelRequirement";
import { LevelAndRequirements, LevelName } from "../../../common/src/models/Level";
import { Requirement, RequirementType } from "../../../common/src/models/Requirement";
@Component({
    components: { ProfileMenuItem }
})
export default class MainNavBar extends Vue {
    LevelRequirements: LevelAndRequirements = {
        currentLevel: LevelName.NOVICE,
        currentRequirements: [],
        tickedRequirements: [] 
    };

    buildRequirementElement(r: Requirement) {
        let tx = '';
        let val = '';
        if (r.type===RequirementType.VIDEO){
            tx = `Watch ${r.video.titleId}`;
            val = `video${r.video.titleId}`;
        }
        if (r.type===RequirementType.NUM_PROJECT_STARTED){
            tx = `Start ${r.numProjectStarted} projects`;
            val = `project${r.numProjectStarted}`;
        }
        if (r.type===RequirementType.NUM_FEEDBACK){
            tx = `Give ${r.numFeedback} feedbacks`;
            val = `feedback${r.numFeedback}`;
        }
        return {
            text: tx,
            value: val
        }
    }

    get options(){
        let opts = [];
        for (let req of this.LevelRequirements.currentRequirements){
            opts.push(this.buildRequirementElement(req));
        }
        return opts;
    }

    get selected(){
        let opts = [];
        for (let req of this.LevelRequirements.tickedRequirements){
            opts.push(this.buildRequirementElement(req).value);
        }
        return opts;
    }

    get progressValue(){
        let rank = "Novice";
        let encouragement = "Get started on your journey to a H2X guru!";
        if (this.LevelRequirements.currentLevel===LevelName.BEGINNER){
            rank = "Beginner";
            encouragement = "Keep it up for a better tomorrow!";
        }
        else if (this.LevelRequirements.currentLevel===LevelName.INTERMEDIATE){
            rank = "Intermediate";
            encouragement = "You've learned how to use H2X! Mastery is only step away";
        }
        else if (this.LevelRequirements.currentLevel===LevelName.EXPERIENCED){
            rank = "Experienced";
            encouragement = "You've climbed the mountains, one more quest to a true grand master";
        }
        else if (this.LevelRequirements.currentLevel===LevelName.EXPERT){
            rank = "Expert";
            encouragement = "A true expert you are. People call you not by your name, but by your mastery.";
        }
        let val = 0;
        if (this.LevelRequirements.tickedRequirements.length!==0&&this.LevelRequirements.currentRequirements.length!==0){
            val = (this.LevelRequirements.tickedRequirements.length/this.LevelRequirements.currentRequirements.length)*100;
        }
        return {
            rank: rank,
            encouragement: encouragement,
            value: val
        }
    }
    mounted() {
        getLevelAndRequirements().then((ret)=>{
            if (ret.success){
                console.log('get level success');
                console.log(ret.data);
                this.LevelRequirements = ret.data;
            }
        })
    }

}
</script>

<style lang="less">
.navbar {
    padding: 10px;
    background-color: #ffffff;
    border-bottom: 1px solid lightgray;
}
</style>
