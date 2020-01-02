<template>
    <b-row style="position:fixed; left:300px; top:80px;">
        <b-col>
            <b-button-group>
                <FlowSystemPicker
                    :selected-system-uid="selectedSystem.uid"
                    :flow-systems="flowSystems"
                    @selectSystem="selectSystem"
                    :disabled="isDrawing"
                />
                <b-button
                    variant="outline-dark"
                    class="insertBtn riser btn-sm"
                    @click="$emit('insert', { entityName: entityNames.RISER, system: selectedSystem })"
                    v-b-tooltip.hover
                    title="Riser"
                    ><v-icon name="arrow-up" scale="1.2"
                /></b-button>
                <b-button
                    variant="outline-dark"
                    class="insertBtn return btn-sm"
                    @click="$emit('insert', { entityName: entityNames.FLOW_RETURN, system: selectedSystem })"
                    v-b-tooltip.hover
                    title="Flow Return"
                    ><v-icon name="arrow-down" scale="1.2"
                /></b-button>
                <b-button
                    variant="outline-dark"
                    class="insertBtn pipes btn-sm"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.PIPE,
                            system: selectedSystem,
                            networkType: NetworkType.RETICULATIONS
                        })
                    "
                    v-b-tooltip.hover
                    title="Reticulation Pipe"
                    ><v-icon name="wave-square" scale="1.2" />{{
                        catalog.pipes[selectedSystem.networks[NetworkType.RETICULATIONS].material].abbreviation
                    }}</b-button
                >
                <b-button
                    variant="outline-dark"
                    class="insertBtn pipes btn-sm"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.PIPE,
                            system: selectedSystem,
                            networkType: NetworkType.CONNECTIONS
                        })
                    "
                    v-b-tooltip.hover
                    title="Connection Pipe"
                    ><v-icon name="wave-square" scale="1.2" />{{
                        catalog.pipes[selectedSystem.networks[NetworkType.CONNECTIONS].material].abbreviation
                    }}</b-button
                >
            </b-button-group>
        </b-col>
        <b-col>
            <b-button-group>
                <b-button
                    variant="outline-dark"
                    class="insertBtn rpzd-hot-cold btn-sm"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.BIG_VALVE,
                            system: selectedSystem,
                            tmvHasCold: true,
                            bigValveType: BigValveType.RPZD_HOT_COLD
                        })
                    "
                    v-b-tooltip.hover
                    title="RPZD (Hot + Cold)"
                ></b-button>
                <b-button
                    variant="outline-dark"
                    class="insertBtn tmv btn-sm"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.BIG_VALVE,
                            system: selectedSystem,
                            tmvHasCold: true,
                            bigValveType: BigValveType.TMV
                        })
                    "
                    v-b-tooltip.hover
                    title="TMV (Warm + Cold)"
                ></b-button>
                <b-button
                    variant="outline-dark"
                    class="insertBtn tempering-valve btn-sm"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.BIG_VALVE,
                            system: selectedSystem,
                            tmvHasCold: true,
                            bigValveType: BigValveType.TEMPERING
                        })
                    "
                    v-b-tooltip.hover
                    title="Tempering Valve (Warm)"
                ></b-button>
            </b-button-group>
        </b-col>

        <b-col>
            <b-button-group v-if="lastUsedFixtureUid">
                <b-button
                    class="insertEntityBtn"
                    variant="outline-dark"
                    id="insertEntitySplitBtn"
                    :disabled="!lastUsedFixture"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.FIXTURE,
                            system: selectedSystem,
                            catalogId: lastUsedFixtureUid
                        })
                    "
                >
                    {{ lastUsedFixture.name }}
                </b-button>
                <b-dropdown text="" class="insertEntityBtn" variant="outline-dark">
                    <b-dropdown-item
                        v-for="fixture in availableFixtureList"
                        variant="outline-dark"
                        class="shower btn-sm"
                        @click="
                            $emit('insert', {
                                entityName: entityNames.FIXTURE,
                                system: selectedSystem,
                                catalogId: fixture.uid
                            })
                        "
                        >{{ fixture.name }}</b-dropdown-item
                    >
                    <b-dropdown-item href="#" variant="info" @click="addRemoveFixturesClick"
                        >+/- Fixtures</b-dropdown-item
                    >
                </b-dropdown>
            </b-button-group>
            <b-dropdown text="Fixtures" class="insertEntityBtn" variant="outline-dark" v-else>
                <b-dropdown-item
                    v-for="fixture in availableFixtureList"
                    variant="outline-dark"
                    class="shower btn-sm"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.FIXTURE,
                            system: selectedSystem,
                            catalogId: fixture.uid
                        })
                    "
                    >{{ fixture.name }}</b-dropdown-item
                >
                <b-dropdown-item variant="info" @click="addRemoveFixturesClick">+/- Fixtures</b-dropdown-item>
            </b-dropdown>
        </b-col>

        <b-col>
            <b-button-group v-if="lastUsedValveVid">
                <b-button
                    class="insertEntityBtn"
                    variant="outline-dark"
                    id="insertEntityBtn"
                    :disabled="!lastUsedValveVid"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.DIRECTED_VALVE,
                            system: selectedSystem,
                            catalogId: lastUsedValveVid.catalogId,
                            valveType: lastUsedValveVid.type,
                            valveName: valve.name
                        })
                    "
                >
                    {{ lastUsedValveVid.name }}
                </b-button>
                <b-dropdown text="" class="insertEntityBtn" variant="outline-dark">
                    <b-dropdown-item
                        v-for="valve in availableValves"
                        variant="outline-dark"
                        class="shower btn-sm"
                        @click="
                            $emit('insert', {
                                entityName: entityNames.DIRECTED_VALVE,
                                system: selectedSystem,
                                catalogId: valve.catalogId,
                                valveType: valve.type,
                                valveName: valve.name
                            })
                        "
                        >{{ valve.name }}</b-dropdown-item
                    >
                </b-dropdown>
            </b-button-group>
            <b-dropdown text="Valves" class="insertEntityBtn" variant="outline-dark" v-else>
                <b-dropdown-item
                    v-for="valve in availableValves"
                    variant="outline-dark"
                    class="shower btn-sm"
                    @click="
                        $emit('insert', {
                            entityName: entityNames.DIRECTED_VALVE,
                            system: selectedSystem,
                            catalogId: valve.catalogId,
                            valveType: valve.type,
                            valveName: valve.name
                        })
                    "
                    >{{ valve.name }}</b-dropdown-item
                >
            </b-dropdown>
        </b-col>
        <b-col>
            <b-dropdown text="Nodes" class="insertEntityBtn" variant="outline-dark">
                <b-dropdown-item
                    variant="outline-dark"
                    class="shower btn-sm"
                    @click="$emit('insert', { entityName: entityNames.LOAD_NODE, nodeType: NodeType.LOAD_NODE })"
                    >Fixture Node</b-dropdown-item
                >
                <b-dropdown-item
                    :disabled="document.drawing.metadata.calculationParams.dwellingMethod === null"
                    variant="outline-dark"
                    class="shower btn-sm"
                    @click="$emit('insert', { entityName: entityNames.LOAD_NODE, nodeType: NodeType.DWELLING })"
                    >Dwelling Node</b-dropdown-item
                >
            </b-dropdown>
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import FlowSystemPicker from "../../../src/components/editor/FlowSystemPicker.vue";
import { EntityType } from "../../../src/store/document/entities/types";
import { FixtureSpec } from "../../../src/store/catalog/types";
import { DocumentState, NetworkType } from "../../store/document/types";
import { SupportedPsdStandards } from "../../../src/config";
import { NodeType } from "../../store/document/entities/load-node-entity";
import { Catalog } from "../../../../backend/src/entity/Catalog";
import { BigValveType } from "../../store/document/entities/big-valve/big-valve-entity";

@Component({
    components: { FlowSystemPicker },
    props: {
        flowSystems: Array,
        fixtures: Object,
        availableFixtures: Array,
        availableValves: Array,
        lastUsedFixtureUid: String,
        lastUsedValveVid: Object,
        isDrawing: Boolean
    }
})
export default class HydraulicsInsertPanel extends Vue {
    get NetworkType() {
        return NetworkType;
    }

    get SupportedPsdStandards() {
        return SupportedPsdStandards;
    }

    get NodeType() {
        return NodeType;
    }

    get entityNames() {
        return EntityType;
    }

    get selectedSystem() {
        return this.$props.flowSystems[this.selectedSystemId];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get lastUsedFixture() {
        if (!this.$props.lastUsedFixtureUid) {
            return null;
        }
        return this.$props.fixtures[this.$props.lastUsedFixtureUid];
    }

    get availableFixtureList(): FixtureSpec[] {
        return this.$props.availableFixtures.map((key: string) => {
            return this.$props.fixtures[key];
        });
    }

    get BigValveType() {
        return BigValveType;
    }

    get catalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    selectedSystemId: number = 0;

    addRemoveFixturesClick() {
        this.$router.push({ name: "settings/fixtures" });
    }

    selectSystem(value: number) {
        this.selectedSystemId = value;
    }
}
</script>

<style lang="less">
.insertBtn {
    height: 45px;
    width: 50px;
    font-size: 12px;
    background-color: white;
}

.insertEntityBtn {
    height: 45px;
    font-size: 12px;
    background-color: white;
}

.insertBtn.tmv {
    background-image: url("../../../src/assets/object-icons/big-valves/TMV.png");
    background-size: 35px;
    background-repeat: no-repeat;
    background-position: center;
}

.insertBtn.tempering-valve {
    background-image: url("../../../src/assets/object-icons/big-valves/tempering-valve.png");
    background-size: 35px;
    background-repeat: no-repeat;
    background-position: center;
}

.insertBtn.rpzd-hot-cold {
    background-image: url("../../../src/assets/object-icons/big-valves/hot-cold-rpzd.png");
    background-size: 35px;
    background-repeat: no-repeat;
    background-position: center;
}
</style>
