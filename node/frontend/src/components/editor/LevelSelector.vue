<template>
    <div class="level-selector">
        <b-btn-group vertical>
            <b-button class="levelBtn" variant="outline-dark" @click="addAbove"><v-icon name="plus"></v-icon> LVL</b-button>

            <b-button
                    class="levelBtn"
                    variant="outline-dark"
                    v-for="level in sortedLevels"
                    :key="level.uid"
                    @click="selectLevel(level.uid)"
                    :pressed="level.uid === currentLevelUid"
            >
                {{ level.abbreviation }}
            </b-button>
            <b-button class="levelBtn" variant="outline-dark" @click="addBelow"><v-icon name="plus"></v-icon> B</b-button>

        </b-btn-group>
    </div>
</template>

<script lang="ts">

    import Vue from 'vue';
    import Component from "vue-class-component";
    import {DocumentState, Level} from "../../store/document/types";
    import uuid from 'uuid';

    export const GROUND_FLOOR_MIN_HEIGHT_M = -0.5;
    export const LEVEL_HEIGHT_DIFF_M = 3;

    @Component({
    })
    export default class LevelSelector extends Vue {

        get sortedLevels(): Level[] {
            const levels = Object.values(this.document.drawing.levels) as Level[];
            return levels.sort((a, b) => -(a.floorHeightM - b.floorHeightM));
        }

        get numAboveFloors(): number {
            return this.sortedLevels.filter((l) => l.floorHeightM >= GROUND_FLOOR_MIN_HEIGHT_M).length;
        }

        get numBasementFloors(): number {
            return this.sortedLevels.length - this.numAboveFloors;
        }

        get document(): DocumentState {
            return this.$store.getters["document/document"];
        }

        get currentLevelUid(): string | null {
            return this.document.uiState.levelUid;
        }

        selectLevel(levelUid: string) {
            this.$store.dispatch('document/setCurrentLevelUid', levelUid);
        }

        addAbove() {
            const highestFloor = this.sortedLevels[0];
            const highestHeight = highestFloor ? highestFloor.floorHeightM : 0;
            const nMatch = highestFloor.abbreviation.match("[0-9]+");
            let num: number;
            if (nMatch) {
                num = Number(nMatch[0]);
            } else {
                num = this.numAboveFloors;
            }
            const newLvl: Level = {
                abbreviation: "L" + num,
                entities: {},
                floorHeightM: highestHeight + LEVEL_HEIGHT_DIFF_M,
                name: "Level " + num,
                uid: uuid(),
            };
            this.$store.dispatch('document/addLevel', newLvl);
            this.$store.dispatch('document/commit');
        }

        addBelow() {
            const lowestFloor = this.sortedLevels[this.sortedLevels.length - 1];
            const lowestHeight = lowestFloor ? lowestFloor.floorHeightM : 0;
            const nMatch = lowestFloor.abbreviation.match("[0-9]+");
            let num: number;
            if (nMatch) {
                num = Number(nMatch[0]) + 1;
            } else {
                num = this.numBasementFloors + 1;
            }
            const newLvl: Level = {
                abbreviation: "B" + num,
                entities: {},
                floorHeightM: lowestHeight - LEVEL_HEIGHT_DIFF_M,
                name: "Basement " + num,
                uid: uuid(),
            };
            this.$store.dispatch('document/addLevel', newLvl);
            this.$store.dispatch('document/commit');
        }
    }
</script>

<style lang="less">
    .level-selector {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        left: -5px;
        min-height: 100px;
        border-left: none;
        border-radius: 0px 5px 5px 0px;

        max-height: -webkit-calc(100vh - 30px);
        overflow-y: auto;
        overflow-x: hidden;
    }
    .levelBtn {
        background-color:white;
    }
</style>
