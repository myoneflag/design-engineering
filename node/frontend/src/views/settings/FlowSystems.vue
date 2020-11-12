import {Units} from "../../../../common/src/lib/measurements";
<template>
    <div>
        <SettingsFieldBuilder
            ref="fields"
            :fields="fields"
            :reactiveData="selectedSystem"
            :originalData="committedSelectedSystem"
            :onSave="save"
            :onBack="back"
        >
            <b-row style="padding-bottom: 10px; padding-top: 20px;">
                <b-col>
                    <h4 class="float-right">Settings for:</h4>
                </b-col>
                <b-col>
                    <FlowSystemPicker
                        :selected-system-uid="selectedSystem.uid"
                        :flow-systems="flowSystems"
                        @selectSystem="selectSystem"
                    />
                </b-col>
            </b-row>
            <b-row style="padding-bottom: 20px">
                <b-col> </b-col>
                <b-col>
                    <b-button variant="light" @click="addNewSystem" class="float-left">
                        <v-icon name="plus" /> Add New System
                    </b-button>
                    <b-button variant="light" @click="deleteSystem" class="float-left">
                        <v-icon name="trash-alt" /> Delete
                    </b-button>
                </b-col>
            </b-row>
        </SettingsFieldBuilder>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from 'vue-property-decorator'
import { DocumentState, initialDocumentState } from "../../../src/store/document/types";
import SettingsFieldBuilder from "../../../src/components/editor/lib/SettingsFieldBuilder.vue";
import uuid from "uuid";
import FlowSystemPicker from "../../../src/components/editor/FlowSystemPicker.vue";
import * as _ from "lodash";
import {initialDrainageProperties, initialDrawing, NetworkType} from "../../../../common/src/api/document/drawing";
import {Choice, cloneSimple} from "../../../../common/src/lib/utils";
import {
    getInsulationMaterialChoicesWithThermalConductivity,
    INSULATION_JACKET_CHOICES,
    INSULATION_MATERIAL_CHOICES, InsulationJackets,
    InsulationMaterials,
    INSULATION_THICKNESS_MMKEMBLA, StandardFlowSystemUids, isGas, isDrainage, assertUnreachable
} from "../../../../common/src/api/config";
import { Units } from "../../../../common/src/lib/measurements";
import {Catalog} from "../../../../common/src/api/catalog/types";
import { setPropertyByString } from "../../lib/utils";
import {
    getDrainageMaterials,
    getWaterDrainageMaterials
} from "../../../../common/src/api/document/entities/pipe-entity";

@Component({
    components: {SettingsFieldBuilder, FlowSystemPicker },
    beforeRouteLeave(to, from, next) {
        if ((this.$refs.fields as any).leave()) {
            next();
        } else {
            next(false);
        }
    }
})
export default class FlowSystems extends Vue {
    selectedSystemId: number = 0;

    get fields(): any[][] {
        const selectedIsGas = isGas(this.selectedSystem.fluid, this.catalog);
        const selectedIsDrainage = isDrainage(this.selectedSystem.uid);
        const fields = [
            ["name", "System Name", "text"],
            ["fluid", "Fluid", "choice", this.$store.getters["catalog/defaultFluidChoices"]],
        ];
        if (!selectedIsGas) {
            fields.push(
                ["temperature", "Temperature", "range", 10, 100, null, Units.Celsius],
            );
        }
        fields.push(
            ["color", "Colour", "color"],
        );

        if (selectedIsDrainage) {
            fields.push(
                ["drainageProperties.ventColor", "Vent colour", "color"],
            )
        }

        if (!selectedIsGas && !selectedIsDrainage) {
            fields.push(
                ["hasReturnSystem", "Has Return System", "yesno"],
            )
        }
        if (this.selectedSystem.hasReturnSystem && !selectedIsGas && !selectedIsDrainage) {
            fields.push(
                ['returnIsInsulated', "Return Is Insulated", "yesno"],
            );

            if (this.selectedSystem.returnIsInsulated) {
               fields.push(['insulationMaterial', "Insulation Material", "choice", getInsulationMaterialChoicesWithThermalConductivity(this.selectedSystem.temperature)]);

                if (this.selectedSystem.insulationMaterial !== 'mmKemblaInsulation') {
                    fields.push(['insulationJacket', "Insulation Jacket", "choice", INSULATION_JACKET_CHOICES],);
                }

                fields.push(['returnMaxVelocityMS', "Max. Velocity of Return", "number", Units.MetersPerSecond]);

                if (this.selectedSystem.insulationMaterial === 'mmKemblaInsulation') {
                    fields.push([
                        'insulationThicknessMM',
                        "Insulation Thickness",
                        "select",
                        Units.Millimeters,
                        INSULATION_THICKNESS_MMKEMBLA
                    ]);
                } else {
                    fields.push([
                        'insulationThicknessMM',
                        "Insulation Thickness",
                        "number",
                        Units.Millimeters
                    ]);
                }
            }
        }

        if (selectedIsDrainage) {
            for (const netKey of Object.keys(this.selectedSystem.networks) as NetworkType[]) {
                let drainageTitle = '';
                switch (netKey) {
                    case NetworkType.RISERS:
                        drainageTitle = 'Stacks';
                        break;
                    case NetworkType.RETICULATIONS:
                        drainageTitle = 'Pipes';
                        break;
                    case NetworkType.CONNECTIONS:
                        drainageTitle = 'Vents';
                        break;
                    default:
                        assertUnreachable(netKey);
                }

                fields.push(
                    [netKey, drainageTitle, "title4"],
                    [
                        "networks." + netKey + ".material",
                        "Material",
                        "choice",
                        this.drainageMaterials,
                    ],
                );
            }

            fields.push(
                ["", "Drainage Properties", "title4"],
            );

            fields.push(
                [
                    "drainageProperties.horizontalPipeSizing",
                    "Horizontal Pipe Sizing",
                    "array-table",
                    [
                        {name: "Min Units", key: "minUnits", units: Units.None},
                        {name: "Max Units", key: "maxUnits", units: Units.None},
                        {name: "Size", key: "sizeMM", units: Units.Millimeters},
                        {name: "grade %", key: "gradePCT", units: Units.None},
                    ],
                ],
                [
                    "drainageProperties.maxUnventedLengthM",
                    "Max. Unvented Length",
                    "optional-numeric-table",
                    this.selectedSystem.drainageProperties.availablePipeSizesMM,
                    "Pipe Size",
                    "Unlimited",
                    Units.Millimeters,
                    Units.Meters,
                ],

                [
                    "drainageProperties.maxUnventedCapacityWCs",
                    "Max. Unvented Capacity (WC's)",
                    "optional-numeric-table",
                    this.selectedSystem.drainageProperties.availablePipeSizesMM,
                    "Pipe Size",
                    "Unlimited",
                    Units.Millimeters,
                    Units.None
                ],

                [
                    "drainageProperties.ventSizing",
                    "Vent Sizing",
                    "array-table",
                    [
                        {name: "Min Units", key: "minUnits", units: Units.None},
                        {name: "Max Units", key: "maxUnits", units: Units.None},
                        {name: "Size (mm)", key: "sizeMM", units: Units.Millimeters},
                    ],
                ],

                [
                    "drainageProperties.stackSizeDiminish",
                    "Does the stack diminish in size?",
                    "yesno",
                ],

                [
                    "drainageProperties.stackPipeSizing",
                    "Stack Pipe Sizing",
                    "array-table",
                    [
                        {name: "Min Units", key: "minUnits", units: Units.None},
                        {name: "Max Units", key: "maxUnits", units: Units.None},
                        {name: "Size (mm)", key: "sizeMM", units: Units.Millimeters},
                        {name: "Maximum Fixture/discharge Units Per Level", key: "maximumUnitsPerLevel", units: Units.None},
                    ],
                ],

                [
                    "drainageProperties.stackDedicatedVent",
                    "Does the stack have a dedicated vent?",
                    "yesno",
                ],

                [
                    "drainageProperties.stackVentPipeSizing",
                    "Stack Vent Sizing",
                    "array-table",
                    [
                        {name: "Min Units", key: "minUnits", units: Units.None},
                        {name: "Max Units", key: "maxUnits", units: Units.None},
                        {name: "Size (mm)", key: "sizeMM", Units: Units.Millimeters},
                    ],
                ],
            );
        } else {
            fields.push(
                ["", "Network Properties", "title3"]
            );

            const pipeSizes: { [key: string]: Array<{key: number, name: string}> } = {};
            Object.entries(this.catalog.pipes).map(([key, pipeProp]) => {
                pipeSizes[key] = Object.keys(pipeProp.pipesBySize.generic).map(x => ({
                    key: +x,
                    name: x + "mm",
                }));
            });

            for (const netKey of Object.keys(this.selectedSystem.networks)) {
                if (netKey === NetworkType.CONNECTIONS && selectedIsGas) {
                    continue;
                }

                fields.push(
                    [netKey, _.startCase(netKey.toLowerCase()), "title4"],
                    ["networks." + netKey + ".velocityMS", "Velocity", "number", Units.MetersPerSecond],
                    [
                        "networks." + netKey + ".material",
                        "Material",
                        "choice",
                        this.waterMaterials,
                    ],
                    [
                        "networks." + netKey + ".minimumPipeSize",
                        "Minimum Pipe Size",
                        "choice",
                        pipeSizes[this.selectedSystem.networks[netKey as NetworkType].material],
                        this.selectedSystem.networks[netKey as NetworkType].material
                    ],
                    ["networks." + netKey + ".spareCapacityPCT", "Spare Capacity (%)", "range", 0, 100],
                );
            }
        }

        return fields;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get catalog(): Catalog {
        return this.$store.getters['catalog/default'];
    }

    get drainageMaterials(): Choice[] {
        const choices: Choice[] = this.$store.getters["catalog/defaultPipeMaterialChoices"];
        return getDrainageMaterials(choices);
    }

    get waterMaterials(): Choice[] {
        const choices: Choice[] = this.$store.getters["catalog/defaultPipeMaterialChoices"];
        return getWaterDrainageMaterials(choices);
    }

    get flowSystems() {
        return this.document.drawing.metadata.flowSystems;
    }

    get pipeSizes() {
        const pipeSizes: { [key: string]: Array<{key: number, name: string}> } = {};
        
        Object.entries(this.catalog.pipes).map(([key, pipeProp]) => {
            pipeSizes[key] = Object.keys(pipeProp.pipesBySize.generic)
            .filter(x => {
                if (this.selectedSystemId === 5) {
                    return +x >= 25;
                }
                
                return true;
            })
            .map(x => ({
                key: +x,
                name: x + "mm",
            }));
        });

        return pipeSizes;
    }

    get risersMaterial() {
        return this.selectedSystem.networks.RISERS.material;
    }

    @Watch('risersMaterial')
    handleRisersMaterialChange(val: string, oldVal: string) {
        setPropertyByString(this.selectedSystem, 'networks.RISERS.minimumPipeSize', this.pipeSizes[val][0].key);
    }

    get reticulationsMaterial() {
        return this.selectedSystem.networks.RETICULATIONS.material;
    }

    @Watch('reticulationsMaterial')
    handleReticulationsMaterialChange(val: string, oldVal: string) {
        setPropertyByString(this.selectedSystem, 'networks.RETICULATIONS.minimumPipeSize', this.pipeSizes[val][0].key);
    }

    get connectionsMaterial() {
        return this.selectedSystem.networks.CONNECTIONS.material;
    }

    @Watch('connectionsMaterial')
    handleConnectionsMaterialChange(val: string, oldVal: string) {
        setPropertyByString(this.selectedSystem, 'networks.CONNECTIONS.minimumPipeSize', this.pipeSizes[val][0].key);
    }

    get selectedIsDrainage() {
        return isDrainage(this.selectedSystem.uid);
    }

    selectSystem(value: number) {
        if (value === this.selectedSystemId) {
            return;
        }
        if ((this.$refs.fields as any).leave()) {
            this.selectedSystemId = value;
        } else {
            // nup
        }
    }

    deleteSystem() {
        if (window.confirm("Are you sure you want to delete " + this.selectedSystem.name + "?")) {
            this.document.drawing.metadata.flowSystems.splice(this.selectedSystemId, 1);
            this.selectedSystemId = 1;
            this.$store.dispatch("document/commit");
        }
    }

    get selectedSystem() {
        return this.document.drawing.metadata.flowSystems[this.selectedSystemId];
    }

    get committedSelectedSystem() {
        return this.document.committedDrawing.metadata.flowSystems[this.selectedSystemId];
    }

    addNewSystem() {
        if ((this.$refs.fields as any).leave()) {
            this.document.drawing.metadata.flowSystems.push({
                name: "New Flow System",
                temperature: 60,
                color: { hex: "#FCDC00" },
                uid: uuid(),
                fluid: "water",
                networks: cloneSimple(initialDrawing.metadata.flowSystems[0].networks),
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,
                drainageProperties: cloneSimple(initialDrainageProperties),
            });
            this.$store.dispatch("document/commit").then(() => {
                this.selectedSystemId = this.document.drawing.metadata.flowSystems.length - 1;
            });
        } else {
            // nup
        }
    }

    save() {
        this.$store.dispatch("document/commit", {skipUndo: true}).then(() => {
            (this as any).$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
        });
    }

    back() {
        this.$router.push({ name: "drawing" });
    }
}
</script>

<style lang="less"></style>
