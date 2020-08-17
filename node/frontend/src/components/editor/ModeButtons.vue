<template>
    <div>
        <b-row style="position:fixed; left:20px; top:80px;">
            <b-col>
                <b-button-group>
                    <b-button
                        variant="outline-dark"
                        class="modebtn background btn-sm"
                        :pressed="mode === 0"
                        @click="toggleFloorPlan"
                    ><v-icon name="ruler-combined" scale="2" /><br />Floor Plan</b-button>
                    <b-button
                        variant="outline-dark"
                        class="modebtn pipes btn-sm"
                        :pressed="mode === 1"
                        @click="togglePlumbing"
                    ><v-icon name="wave-square" scale="2.5" /><br />Plumbing</b-button>
                    <b-button
                        variant="outline-dark"
                        class="modebtn results btn-sm"
                        :pressed="mode === 2"
                        @click="toggleResults"
                    ><v-icon name="calculator" scale="2" /><br />Results</b-button>
                </b-button-group>
            </b-col>
        </b-row>
        <b-row v-if="isBrandNew()" style="position:fixed; left:20px; top:160px; pointer-events: none;">
            <b-col>
                <b-button-group>
                    <div class="numberCircle">1</div>
                    <div class="numberCircle">2</div>
                    <div class="numberCircle">3</div>
                </b-button-group>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Mousetrap from 'mousetrap';
import { DocumentState } from "../../store/document/types";

@Component({
    props: {
        mode: Number
    }
})
export default class ModeButtons extends Vue {
    mounted() {
        const { floorPlan, plumbing, results } = this.hotKeySetting;

        Mousetrap.bind(floorPlan, this.toggleFloorPlan);
        Mousetrap.bind(plumbing, this.togglePlumbing);
        Mousetrap.bind(results, this.toggleResults);
    }
    
    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }
    
    get hotKeySetting(): { [key: string]: string } {
        return this.$store.getters["hotKey/setting"];
    }

    isBrandNew() {
        return this.$store.getters["document/isBrandNew"];
    }

    toggleFloorPlan() {
        this.$emit('update:mode', 0);
    }

    togglePlumbing() {
        this.$emit('update:mode', 1);
    }

    toggleResults() {
        this.$emit('update:mode', 2);
    }
}
</script>

<style lang="less">
.modebtn {
    height: 70px;
    width: 80px;
    font-size: 12px;
    background-color: white;
}

.numberCircle {
    border-radius: 50%;
    margin-left: 20px;
    margin-right: 20px;
    width: 40px;
    height: 40px;
    padding: 8px;
    background: #fff;
    border: 2px solid #666;
    color: #666;
    text-align: center;
    font: 20px Arial, sans-serif;
}
</style>
