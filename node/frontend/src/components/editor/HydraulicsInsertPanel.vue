<template>
    <b-row style="position:absolute; left:300px; top:80px;">
        <b-col>
            <b-button-group>
                <FlowSystemPicker
                    :selected-system-uid="selectedSystem.uid"
                    :flow-systems="flowSystems"
                    @selectSystem="selectSystem"
                    :disabled="isDrawing"
                    :class="{onboarding: checkOnboardingClass(1)}"
                />
                <b-button
                    variant="outline-dark"
                    class="insertBtn flowsource btn-sm"
                    @click="toggleWaterSource"
                    :class="{onboarding: checkOnboardingClass(2)}"
                    v-b-tooltip.hover
                    title="Flow Source"
                ></b-button>
                <b-button
                    variant="outline-dark"
                    class="insertBtn riser btn-sm"
                    @click="toggleRiser"
                    :class="{onboarding: checkOnboardingClass(3)}"
                    v-b-tooltip.hover
                    title="Riser"
                    ><v-icon name="arrow-up" scale="1.2"
                /></b-button>
                <b-button
                    variant="outline-dark"
                    class="insertBtn pipes btn-sm"
                    @click="toggleReticulationPipe"
                    :class="{onboarding: checkOnboardingClass(4)}"
                    v-b-tooltip.hover
                    title="Reticulation Pipe"
                    ><v-icon name="wave-square" scale="1.2" />{{
                        catalog.pipes[selectedSystem.networks[NetworkType.RETICULATIONS].material].abbreviation
                    }}</b-button
                >
                <b-button
                    v-if="selectedSystem.uid !== StandardFlowSystemUids.Gas"
                    variant="outline-dark"
                    class="insertBtn pipes btn-sm"
                    @click="toggleConnectionPipe"
                    :class="{onboarding: checkOnboardingClass(5)}"
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
                        v-if="selectedSystem.uid === StandardFlowSystemUids.Gas"
                        variant="outline-dark"
                        class="insertBtn gas-regulator btn-sm"
                        @click="
                        $emit('insert', {
                            entityName: entityNames.DIRECTED_VALVE,
                            system: selectedSystem,
                            catalogId: '',
                            valveType: ValveType.GAS_REGULATOR,
                            valveName: 'Gas Regulator',
                        })
                    "
                        v-b-tooltip.hover
                        title="Gas Regulator"
                ></b-button>
                <b-button
                        v-if="selectedSystem.uid === StandardFlowSystemUids.Gas"
                        variant="outline-dark"
                        class="insertBtn meter btn-sm"
                        @click="
                        $emit('insert', {
                            entityName: entityNames.DIRECTED_VALVE,
                            system: selectedSystem,
                            catalogId: 'waterMeter',
                            valveType: ValveType.WATER_METER,
                            valveName: 'Meter',
                        })
                    "
                        v-b-tooltip.hover
                        title="Meter"
                ></b-button>
                <b-button
                        v-if="selectedSystem.uid === StandardFlowSystemUids.Gas"
                        variant="outline-dark"
                        class="insertBtn filter btn-sm"
                        @click="
                        $emit('insert', {
                            entityName: entityNames.DIRECTED_VALVE,
                            system: selectedSystem,
                            catalogId: '',
                            valveType: ValveType.FILTER,
                            valveName: 'Filter',
                        })
                    "
                        v-b-tooltip.hover
                        title="Filter"
                ></b-button>

                <b-button
                    v-if="selectedSystem.uid !== StandardFlowSystemUids.Gas"
                    variant="outline-dark"
                    class="insertBtn rpzd-hot-cold btn-sm"
                    @click="toggleRPZD"
                    :class="{onboarding: checkOnboardingClass(6)}"
                    v-b-tooltip.hover
                    title="RPZD (Hot + Cold)"
                ></b-button>
                <b-button
                    v-if="selectedSystem.uid !== StandardFlowSystemUids.Gas"
                    variant="outline-dark"
                    class="insertBtn tmv btn-sm"
                    @click="toggleTMV"
                    :class="{onboarding: checkOnboardingClass(6)}"
                    v-b-tooltip.hover
                    title="TMV (Warm + Cold)"
                ></b-button>
                <b-button
                    v-if="selectedSystem.uid !== StandardFlowSystemUids.Gas"
                    variant="outline-dark"
                    class="insertBtn tempering-valve btn-sm"
                    @click="toggleTemperingValve"
                    :class="{onboarding: checkOnboardingClass(6)}"
                    v-b-tooltip.hover
                    title="Tempering Valve (Warm)"
                ></b-button>
            </b-button-group>
        </b-col>

        <b-col>
            <b-button-group>
                <b-dropdown 
                    text="Plants" 
                    class="insertEntityBtn"
                    :class="{onboarding: checkOnboardingClass(7)}"
                    variant="outline-dark"
                >
                    <b-dropdown-item
                        variant="outline-dark"
                        class="hot-water-plant btn-sm"
                        @click="toggleHotWaterPlant"
                    >
                        Hot Water Plant w/Return
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
                        @click="toggleTank"
                    >
                        {{ selectedSystem.name + ' Tank' }}
                    </b-dropdown-item>


                    <b-dropdown-item
                        variant="outline-dark"
                        class="hot-water-plant btn-sm"
                        @click="togglePump"
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

                <b-dropdown
                    text="Fixtures"
                    class="insertEntityBtn"
                    :class="{onboarding: checkOnboardingClass(8)}"
                    variant="outline-dark"
                >
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
                <b-dropdown
                    text="Valves"
                    class="insertEntityBtn"
                    :class="{onboarding: checkOnboardingClass(9)}"
                    variant="outline-dark"
                >
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
                <b-dropdown
                    text="Nodes"
                    class="insertEntityBtn"
                    :class="{onboarding: checkOnboardingClass(10)}"
                    variant="outline-dark"
                >
                    <b-dropdown-item
                        variant="outline-dark"
                        class="shower btn-sm"
                        @click="toggleNodePair"
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
                    >Dwelling Node</b-dropdown-item>

                    <b-dropdown-item
                            variant="outline-dark"
                            class="shower btn-sm"
                            @click="$emit('insert', { entityName: entityNames.LOAD_NODE, nodeType: NodeType.LOAD_NODE,
                             variant: 'continuous' })"
                    >
                        Continuous Flow Node
                    </b-dropdown-item>

                </b-dropdown>
            </b-button-group>
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Mousetrap from 'mousetrap';
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
import OnboardingState, { ONBOARDING_SCREEN } from "../../store/onboarding/types";

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
    mounted() {
        const { 
            coldWater,
            hotWater,
            warmWater,
            waterSource,
            riser,
            reticulationPipe,
            connectionPipe,
            rpzd,
            tmv,
            temperingValve,
            hotWaterPlant,
            tank,
            pump,
            prv,
            ballValve,
            gateValve,
            butterflyValve,
            balancingValve,
            strainer,
            waterMeter,
            checkValve,
            nodePair,
            continuousFlowNode,
            dwellingNodePair,
        } = this.hotKeySetting;
        
        Mousetrap.bind(coldWater, this.toggleCold);
        Mousetrap.bind(hotWater, this.toggleHot);
        Mousetrap.bind(warmWater, this.toggleWarm);
        Mousetrap.bind(waterSource, this.toggleWaterSource);
        Mousetrap.bind(riser, this.toggleRiser);
        Mousetrap.bind(reticulationPipe, this.toggleReticulationPipe);
        Mousetrap.bind(connectionPipe, this.toggleConnectionPipe);
        Mousetrap.bind(rpzd, this.toggleRPZD);
        Mousetrap.bind(tmv, this.toggleTMV);
        Mousetrap.bind(temperingValve, this.toggleTemperingValve);
        Mousetrap.bind(hotWaterPlant, this.toggleHotWaterPlant);
        Mousetrap.bind(tank, this.toggleTank);
        Mousetrap.bind(pump, this.togglePump);
        Mousetrap.bind(nodePair, this.toggleNodePair);
        Mousetrap.bind(continuousFlowNode, this.toggleContinuousFlowNode);
        
        this.document.drawing.metadata.calculationParams.dwellingMethod !== null && Mousetrap.bind(dwellingNodePair, this.toggleDwellingNodePair);

        this.availableFixtureList.map((fixture) => {
            this.hotKeySetting[fixture.uid] && Mousetrap.bind(this.hotKeySetting[fixture.uid], () => this.toggleFixture(fixture.uid));
        });

        this.$props.availableValves.filter((vProps: {catalogId: string, type: string, name: string}) => {
            if (vProps.catalogId === 'prv' && vProps.type !== 'PRV_SINGLE') {
                return false;
            }

            return true;
        }).map((vProps: {catalogId: string, type: string, name: string}) => {
            this.hotKeySetting[vProps.catalogId] && Mousetrap.bind(this.hotKeySetting[vProps.catalogId], () => this.toggleValve(vProps));
        });
    }

    get hotKeySetting(): { [key: string]: string } {
        return this.$store.getters["hotKey/setting"];
    }

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

    toggleCold() {
        this.selectedSystemId = 0;
    }

    toggleHot() {
        this.selectedSystemId = 1;
    }

    toggleWarm() {
        this.selectedSystemId = 2;
    }

    toggleWaterSource() {
        this.$emit('insert', { entityName: this.entityNames.FLOW_SOURCE, system: this.selectedSystem });
    }

    toggleRiser() {
        this.$emit('insert', { entityName: this.entityNames.RISER, system: this.selectedSystem });
    }

    toggleReticulationPipe() {
        this.$emit('insert', { 
            entityName: this.entityNames.PIPE,
            system: this.selectedSystem,
            networkType: NetworkType.RETICULATIONS
        });
    }

    toggleConnectionPipe() {
        this.$emit('insert', { 
            entityName: this.entityNames.PIPE,
            system: this.selectedSystem,
            networkType: NetworkType.CONNECTIONS
        });
    }

    toggleRPZD() {
        this.$emit('insert', {
            entityName: this.entityNames.BIG_VALVE,
            system: this.selectedSystem,
            tmvHasCold: true,
            bigValveType: BigValveType.RPZD_HOT_COLD
        });
    }

    toggleTMV() {
        this.$emit('insert', {
            entityName: this.entityNames.BIG_VALVE,
            system: this.selectedSystem,
            tmvHasCold: true,
            bigValveType: BigValveType.TMV
        });
    }

    toggleTemperingValve() {
        this.$emit('insert', {
            entityName: this.entityNames.BIG_VALVE,
            system: this.selectedSystem,
            tmvHasCold: true,
            bigValveType: BigValveType.TEMPERING
        });
    }

    toggleHotWaterPlant() {
         this.$emit('insert', {
            entityName: this.entityNames.PLANT,
            inletSystemUid: StandardFlowSystemUids.ColdWater,
            outletSystemUid: StandardFlowSystemUids.HotWater,
            plantType: PlantType.RETURN_SYSTEM,
            title: 'Hot Water Plant',
        });
    }

    toggleTank() {
        this.$emit('insert', {
            entityName: this.entityNames.PLANT,
            inletSystemUid: this.selectedSystem.uid,
            outletSystemUid: this.selectedSystem.uid,
            plantType: PlantType.TANK,
            title: 'Tank',
        });
    }

    togglePump() {
        this.$emit('insert', {
            entityName: this.entityNames.PLANT,
            inletSystemUid: this.selectedSystem.uid,
            outletSystemUid: this.selectedSystem.uid,
            plantType: PlantType.PUMP,
            title: 'Pump',
        });
    }

    toggleFixture(uid: string) {
        this.$emit('insert', {
            entityName: this.entityNames.FIXTURE,
            system: this.selectedSystem,
            catalogId: uid,
        });
    }

    toggleValve(valve: {catalogId: string, type: string, name: string}) {
        this.$emit('insert', {
            entityName: this.entityNames.DIRECTED_VALVE,
            system: this.selectedSystem,
            catalogId: valve.catalogId,
            valveType: valve.type,
            valveName: valve.name,
        });
    }

    toggleNodePair() {
       this.$emit('insert', { 
           entityName: this.entityNames.LOAD_NODE, 
           variant: 'hot-cold-load' 
        });
    }

    toggleContinuousFlowNode() {
        this.$emit('insert', { 
            entityName: this.entityNames.LOAD_NODE,
            nodeType: NodeType.LOAD_NODE,
            variant: 'continuous'
        });
    }

    toggleDwellingNodePair() {
        this.$emit('insert', {
            entityName: this.entityNames.LOAD_NODE,
            variant: 'hot-cold-dwelling'
        });
    }

    get onboarding(): OnboardingState {
        return this.$store.getters["onboarding/onboarding"];
    }

    checkOnboardingClass(step: number) {
        return step === this.onboarding.currentStep && this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT_PLUMBING;
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
.insertBtn.gas-regulator {
    background-image: url("../../../src/assets/object-icons/valves/regulator.png");
    background-size: 25px;
    background-repeat: no-repeat;
    background-position: center;
}

.insertBtn.meter {
     background-image: url("../../../src/assets/object-icons/valves/meter.png");
     background-size: 25px;
     background-repeat: no-repeat;
     background-position: center;
 }

.insertBtn.filter {
      background-image: url("../../../src/assets/object-icons/valves/filter.png");
      background-size: 25px;
      background-repeat: no-repeat;
      background-position: center;
  }

</style>
