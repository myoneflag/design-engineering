<template>
    <b-row style="position:fixed; left:300px; top:80px;">
        <b-col>
            <b-button-group>
                <FlowSystemPicker
                        :selected-system-uid="selectedSystem.uid"
                        :flow-systems="flowSystems"
                        @selectSystem="selectSystem"
                />
                <b-button variant="outline-dark" class="insertBtn riser btn-sm"
                          @click="$emit('insert', {entityName: entityNames.RISER, system: selectedSystem})"
                          v-b-tooltip.hover title="Riser"
                ><v-icon  name="arrow-up" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn return btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FLOW_RETURN, system: selectedSystem})"
                          v-b-tooltip.hover title="Flow Return"
                ><v-icon  name="arrow-down" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn pipes btn-sm"
                          @click="$emit('insert', {entityName: entityNames.PIPE, system: selectedSystem})"
                          v-b-tooltip.hover title="Pipes"
                ><v-icon  name="wave-square" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn valve btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FITTING, system: selectedSystem})"
                          v-b-tooltip.hover title="Valve"
                ><v-icon  name="cross" scale="1.2"/></b-button>

            </b-button-group>
        </b-col>
        <b-col>
            <b-button-group>
                <b-button variant="outline-dark" class="insertBtn tmv btn-sm"
                          @click="$emit('insert', {entityName: entityNames.TMV, system: selectedSystem})"
                          v-b-tooltip.hover title="TMV"
                ></b-button>
                <b-button variant="outline-dark" class="insertBtn tmv btn-sm"
                          @click="$emit('insert', {entityName: entityNames.TMV, system: selectedSystem, tmvHasCold: true})"
                          v-b-tooltip.hover title="TMV with cold water out"
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
                        @click="$emit('insert', {entityName: entityNames.FIXTURE, system: selectedSystem, catalogId: lastUsedFixtureUid})"
                >
                    {{ lastUsedFixture.name }}
                </b-button>
                <b-dropdown text="" class="insertEntityBtn" variant="outline-dark">
                    <b-dropdown-item
                            v-for="fixture in availableFixtureList"
                            variant="outline-dark"
                            class="shower btn-sm"
                            @click="$emit('insert', {entityName: entityNames.FIXTURE, system: selectedSystem, catalogId: fixture.uid})"
                    >{{ fixture.name }}</b-dropdown-item>
                    <b-dropdown-item href="#" variant="info" @click="addRemoveFixturesClick">+/- Fixtures</b-dropdown-item>
                </b-dropdown>

            </b-button-group>
            <b-dropdown
                    text="Fixtures..."
                    class="insertEntityBtn"
                    variant="outline-dark"
                    v-else
            >
                <b-dropdown-item
                        v-for="fixture in availableFixtureList"
                        variant="outline-dark"
                        class="shower btn-sm"
                        @click="$emit('insert', {entityName: entityNames.FIXTURE, system: selectedSystem, catalogId: fixture.uid})"
                >{{ fixture.name }}</b-dropdown-item>
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
                        @click="$emit('insert', {entityName: entityNames.DIRECTED_VALVE, system: selectedSystem, catalogId: lastUsedValveVid.catalogId, valveType: lastUsedValveVid.type})"
                >
                    {{ lastUsedValveVid.name }}
                </b-button>
                <b-dropdown text="" class="insertEntityBtn" variant="outline-dark">
                    <b-dropdown-item
                            v-for="valve in availableValves"
                            variant="outline-dark"
                            class="shower btn-sm"
                            @click="$emit('insert', {entityName: entityNames.DIRECTED_VALVE, system: selectedSystem, catalogId: valve.catalogId, valveType: valve.type})"
                    >{{ valve.name }}</b-dropdown-item>
                </b-dropdown>

            </b-button-group>
            <b-dropdown
                    text="Valves..."
                    class="insertEntityBtn"
                    variant="outline-dark"
                    v-else
            >
                <b-dropdown-item
                        v-for="valve in availableValves"
                        variant="outline-dark"
                        class="shower btn-sm"
                        @click="$emit('insert', {entityName: entityNames.DIRECTED_VALVE, system: selectedSystem, catalogId: valve.catalogId,  valveType: valve.type})"
                >{{ valve.name }}</b-dropdown-item>
            </b-dropdown>
        </b-col>


    </b-row>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import FlowSystemPicker from '../../../src/components/editor/FlowSystemPicker.vue';
    import {EntityType} from '../../../src/store/document/entities/types';
    import {FixtureSpec} from '../../../src/store/catalog/types';

    @Component({
        components: {FlowSystemPicker},
        props: {
            flowSystems: Array,
            fixtures: Object,
            availableFixtures: Array,
            availableValves: Array,
            lastUsedFixtureUid: String,
            lastUsedValveVid: Object,
        },
    })
    export default class HydraulicsInsertPanel extends Vue {

        get entityNames() {
            return EntityType;
        }

        selectedSystemId: number = 0;

        get selectedSystem() {
            return this.$props.flowSystems[this.selectedSystemId];
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

        addRemoveFixturesClick() {
            this.$router.push({name: 'settings/fixtures'});
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
        background-color:white;
    }

    .insertEntityBtn {
        height: 45px;
        font-size: 12px;
        background-color:white;
    }

    .insertBtn.tmv {
        background-image: url('../../../src/assets/object-icons/mixer-valves/tmv/tmv.png');
        background-size: 35px;
        background-repeat: no-repeat;
        background-position: center;
    }
</style>
