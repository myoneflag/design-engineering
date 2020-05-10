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
                    class="insertBtn flowsource btn-sm"
                    @click="$emit('insert', { entityName: entityNames.FLOW_SOURCE, system: selectedSystem })"
                    v-b-tooltip.hover
                    title="Flow Source"
                ></b-button>
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
            <b-button-group>
                <b-dropdown text="Plants" class="insertEntityBtn" variant="outline-dark">
                    <b-dropdown-item
                            variant="outline-dark"
                            class="hot-water-plant btn-sm"
                            @click="
                        $emit('insert', {
                            entityName: entityNames.PLANT,
                            inletSystemUid: StandardFlowSystemUids.ColdWater,
                            outletSystemUid: StandardFlowSystemUids.HotWater,
                            plantType: PlantType.RETURN_SYSTEM,
                            title: 'Hot Water Plant',
                        })
                    "
                    >
                        Hot Water Plant w/Return <b-badge size="sm" class="beta-tag version-tag">BETA</b-badge>
                    </b-dropdown-item>

                    <b-dropdown-item
                            v-if="selectedSystem.uid !== StandardFlowSystemUids.HotWater && selectedSystem.hasReturnSystem"
                            variant="outline-dark"
                            class="btn-sm"
                            @click="
                        $emit('insert', {
                            entityName: entityNames.PLANT,
                            inletSystemUid: StandardFlowSystemUids.ColdWater,
                            outletSystemUid: selectedSystem.uid,
                            plantType: PlantType.RETURN_SYSTEM,
                            title: selectedSystem.name + ' Plant',
                        })
                    "
                    >
                        {{ selectedSystem.name + ' Plant w/Return' }}
                    </b-dropdown-item>

                    <b-dropdown-item
                            variant="outline-dark"
                            class="hot-water-plant btn-sm"
                            @click="
                        $emit('insert', {
                            entityName: entityNames.PLANT,
                            inletSystemUid: selectedSystem.uid,
                            outletSystemUid: selectedSystem.uid,
                            plantType: PlantType.TANK,
                            title: 'Tank',
                        })
                    "
                    >
                        {{ selectedSystem.name + ' Tank' }}
                    </b-dropdown-item>


                    <b-dropdown-item
                            variant="outline-dark"
                            class="hot-water-plant btn-sm"
                            @click="
                        $emit('insert', {
                            entityName: entityNames.PLANT,
                            inletSystemUid: selectedSystem.uid,
                            outletSystemUid: selectedSystem.uid,
                            plantType: PlantType.PUMP,
                            title: 'Pump',
                        })
                    "
                    >
                        {{ selectedSystem.name + ' Pump' }}
                    </b-dropdown-item>

                    <b-dropdown-item
                            variant="outline-dark"
                            class="btn-sm"
                            @click="
                        $emit('insert', {
                            entityName: entityNames.PLANT,
                            inletSystemUid: selectedSystem.uid,
                            outletSystemUid: selectedSystem.uid,
                            plantType: PlantType.CUSTOM,
                            title: 'Plant',
                        })
                    "
                    >
                        Custom Plant
                    </b-dropdown-item>

                </b-dropdown>

                <b-dropdown text="Fixtures" class="insertEntityBtn" variant="outline-dark">
                    <b-dropdown-item
                            v-for="fixture in availableFixtureList"
                            :key="fixture.uid"
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
                <b-dropdown text="Valves" class="insertEntityBtn" variant="outline-dark">
                    <b-dropdown-item
                            v-for="valve in availableValves"
                            :key="valve.name"
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
                <b-dropdown text="Nodes" class="insertEntityBtn" variant="outline-dark">


                    <b-dropdown-item
                            variant="outline-dark"
                            class="shower btn-sm"
                            @click="$emit('insert', { entityName: entityNames.LOAD_NODE, variant: 'hot-cold-load' })"
                    >
                        Hot/Cold Fixture Node Pair
                    </b-dropdown-item>

                    <b-dropdown-item
                            :disabled="document.drawing.metadata.calculationParams.dwellingMethod === null"
                            variant="outline-dark"
                            class="shower btn-sm"
                            @click="$emit('insert', { entityName: entityNames.LOAD_NODE, variant: 'hot-cold-dwelling' })"
                    >
                        Hot/Cold Dwelling Node Pair
                    </b-dropdown-item>


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
            </b-button-group>
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import FlowSystemPicker from "../../../src/components/editor/FlowSystemPicker.vue";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { DocumentState } from "../../store/document/types";
import { NodeType } from "../../../../common/src/api/document/entities/load-node-entity";
import { BigValveType } from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { StandardFlowSystemUids, SupportedPsdStandards } from "../../../../common/src/api/config";
import { Catalog, FixtureSpec } from "../../../../common/src/api/catalog/types";
import { FlowSystemParameters, NetworkType } from "../../../../common/src/api/document/drawing";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import { PlantType } from "../../../../common/src/api/document/entities/plants/plant-types";

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

    get StandardFlowSystemUids() {
        return StandardFlowSystemUids;
    }

    get PlantType() {
        return PlantType;
    }

    get selectedSystem(): FlowSystemParameters {
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

    get ValveType() {
        return ValveType;
    }

    get currentSystemHasReturn() {
        return this.selectedSystem.hasReturnSystem;
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

.insertBtn.flowsource {
    background-image: url("../../../src/assets/object-icons/pipework/flow-source.png");
    background-size: 25px;
    background-repeat: no-repeat;
    background-position: center;
}

    .insertBtn.return-pump {
        background-image: url("../../../src/assets/object-icons/valves/pump.png");
        background-size: 25px;
        background-repeat: no-repeat;
        background-position: center;
    }
</style>
