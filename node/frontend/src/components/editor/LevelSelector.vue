<template>
    <div>
        <div class="level-selector">
            <b-list-group>
                <b-list-group-item
                    button
                    size="sm"
                    class="levelBtn"
                    variant="outline-dark"
                    @click="expanded = true"
                    v-if="!expanded"
                >
                    <v-icon name="chevron-right"></v-icon><v-icon name="chevron-right"></v-icon>
                </b-list-group-item>

                <b-list-group-item
                    button
                    size="sm"
                    class="levelBtn"
                    variant="outline-dark"
                    @click="expanded = false"
                    v-else
                >
                    <v-icon name="chevron-left"></v-icon><v-icon name="chevron-left"></v-icon>
                </b-list-group-item>

                <b-list-group-item
                    button
                    size="sm"
                    class="levelBtn"
                    variant="outline-dark"
                    @click="addAbove"
                    v-b-tooltip.hover.right="{ title: 'Add Level Above' }"
                    ><v-icon name="plus"></v-icon> LVL</b-list-group-item
                >

                <div class="level-selector-scroll">
                    <b-list-group-item
                        class="levelBtn"
                        variant="outline-dark"
                        v-for="(level, idx) in sortedLevels"
                        :key="level.uid"
                        :active="level.uid === currentLevelUid"
                        :id="'level-button-' + level.uid"
                        v-b-tooltip.hover.right="{ title: level.name, boundary: 'viewport' }"
                        button
                        size="sm"
                        @click="selectLevel(level.uid)"
                    >
                        <b-row>
                            <b-col :cols="expanded ? 1 : 12">
                                {{ level.abbreviation }}
                            </b-col>
                            <template v-if="expanded">
                                <b-col cols="1" style="padding: 0px">
                                    <b-form-input
                                        v-b-tooltip.hover.top="{ title: 'Abbreviation', boundary: 'viewport' }"
                                        @click="$event.stopPropagation()"
                                        v-model="level.abbreviation"
                                        size="sm"
                                        @blur="commit"
                                        col
                                    ></b-form-input>
                                </b-col>
                                <b-col cols="3">
                                    <b-form-input
                                        v-b-tooltip.hover.top="{ title: 'Description', boundary: 'viewport' }"
                                        @click="$event.stopPropagation()"
                                        v-model="level.name"
                                        size="sm"
                                        @blur="commit"
                                    ></b-form-input>
                                </b-col>
                                <b-col cols="2">
                                    <b-input-group size="sm">
                                        <b-form-input
                                            class="border-right-0"
                                            @click="$event.stopPropagation()"
                                            v-b-tooltip.hover.top="{
                                                title: 'Floor Height Above Sea (m)',
                                                boundary: 'viewport'
                                            }"
                                            type="number"
                                            :value="getFloorHeightCached(level)"
                                            @input="setFloorHeightCached(level, Number($event))"
                                            size="sm"
                                            @blur="commitFloorHeight(level)"
                                        >
                                        </b-form-input>
                                        <b-input-group-append>
                                            <b-input-group-text class="bg-white">
                                                m
                                            </b-input-group-text>
                                        </b-input-group-append>
                                    </b-input-group>
                                </b-col>
                                <b-col cols="1" style="padding: 0">
                                    <label
                                        v-b-tooltip.hover.top="{ title: 'Height Datum (m)', boundary: 'viewport' }"
                                        type="number"
                                        size="sm"
                                        >{{
                                            sortedLevels[idx - 1]
                                                ? (sortedLevels[idx - 1].floorHeightM - level.floorHeightM).toFixed(2)
                                                : "??"
                                        }}
                                        m</label
                                    >
                                </b-col>

                                <b-col cols="3">
                                    <label
                                        v-b-tooltip.hover.title="{ title: 'Fixture Count', boundary: 'viewport' }"
                                        type="number"
                                        size="sm"
                                    >
                                        <span v-for="psd in getLevelPsdFormatted(level)" :style="{ color: psd.hex }"
                                            >{{ psd.text }}&nbsp;</span
                                        >
                                    </label>
                                </b-col>

                                <b-col cols="1" style="padding: 0">
                                    <b-button
                                        @click="
                                            $event.stopPropagation();
                                            deleteLevel(level);
                                        "
                                        variant="danger"
                                        size="sm"
                                        ><v-icon name="trash"></v-icon
                                    ></b-button>
                                </b-col>
                            </template>
                        </b-row>
                    </b-list-group-item>
                </div>
                <b-list-group-item
                    button
                    class="levelBtn"
                    variant="outline-dark"
                    @click="addBelow"
                    v-b-tooltip.hover.right="{ title: 'Add Level Below' }"
                    ><v-icon name="plus"></v-icon> B</b-list-group-item
                >
            </b-list-group>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DocumentState } from "../../store/document/types";
import uuid from "uuid";
import { countPsdUnits, getPsdUnitName } from "../../calculations/utils";
import { lighten } from "../../lib/utils";
import { GROUND_FLOOR_MIN_HEIGHT_M } from "../../lib/types";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { Level } from "../../../../common/src/api/document/drawing";
import { LEVEL_HEIGHT_DIFF_M } from "../../../../common/src/api/config";

@Component({
    props: {
        objectStore: Map // not Object, but Map
    }
})
export default class LevelSelector extends Vue {
    expanded = false;
    // we need this cache during input so that typing doesn't reorder the floor heights.
    floorHeightCache = new Map<string, number>();

    getFloorHeightCached(level: Level): number {
        if (this.floorHeightCache.has(level.uid)) {
            return this.floorHeightCache.get(level.uid)!;
        } else {
            return level.floorHeightM;
        }
    }

    setFloorHeightCached(level: Level, heightM: number) {
        this.floorHeightCache.set(level.uid, heightM);
    }

    get sortedLevels(): Level[] {
        return this.$store.getters["document/sortedLevels"];
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
        this.$store.dispatch("document/setCurrentLevelUid", levelUid);
    }

    addAbove() {
        const highestFloor = this.sortedLevels[0];
        const highestHeight = highestFloor ? highestFloor.floorHeightM : 0;
        const nMatch = highestFloor.abbreviation.match("[0-9]+");
        let num: number;
        if (nMatch) {
            num = Number(nMatch[0]) + 1;
        } else {
            num = this.numAboveFloors;
        }
        const newLvl: Level = {
            abbreviation: "L" + num,
            entities: {},
            floorHeightM: highestHeight + LEVEL_HEIGHT_DIFF_M,
            name: "Level " + num,
            uid: uuid()
        };
        this.$store.dispatch("document/addLevel", newLvl);
        this.$store.dispatch("document/validateAndCommit");
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
            uid: uuid()
        };
        this.$store.dispatch("document/addLevel", newLvl);
        this.$store.dispatch("document/validateAndCommit");
    }

    get catalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    commitFloorHeight(level: Level) {
        level.floorHeightM = Number(this.getFloorHeightCached(level));
        this.commit();
    }

    getLevelPsdFormatted(level: Level): Array<{ hex: string; text: string }> {
        const entities = Object.values(level.entities);
        const result = countPsdUnits(entities, this.document, this.catalog, this.$props.objectStore);
        if (result) {
            return Object.keys(result).map((k) => {
                const system = this.document.drawing.metadata.flowSystems.find((fs) => fs.uid === k);
                const hex = system ? system.color.hex : "#555555";
                let text = "";
                if (result[k].units) {
                    if (text) {
                        text += " ";
                    }
                    text +=
                        Number(result[k].units.toFixed(2)) +
                        getPsdUnitName(this.document.drawing.metadata.calculationParams.psdMethod).abbreviation;
                }
                if (result[k].dwellings) {
                    if (text) {
                        text += " ";
                    }
                    text += Number(result[k].dwellings) + "DWG";
                }
                return { hex, text };
            });
        } else {
            return [];
        }
    }

    deleteLevel(level: Level) {
        this.$bvModal
            .msgBoxConfirm("Are you sure you want to delete " + level.name + " (" + level.abbreviation + ")?")
            .then((res) => {
                if (res) {
                    this.$store.dispatch("document/deleteLevel", level);
                    this.$store.dispatch("document/validateAndCommit");
                }
            });
    }

    commit() {
        this.$store.dispatch("document/validateAndCommit");
    }
}
</script>

<style lang="less">
.level-selector {
    position: fixed;
    top: 45%;
    transform: translateY(-50%);
    left: -5px;
    min-height: 100px;
    border-left: none;
    margin-top: 50px;
    border-radius: 0px 5px 5px 0px;
}
.levelBtn {
    padding-top: 5px;
    padding-bottom: 5px;
}

.levels-list {
}

.level-selector-scroll {
    max-height: -webkit-calc(100vh - 50px);
    overflow-y: auto;
}
</style>
