<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{name}} ({{ selectedEntity.name }})</h3>
            </b-col>
        </b-row>
        <slot> </slot>
        <PropertiesFieldBuilder
            :fields="fields"
            :reactive-data="reactiveData"
            :default-data="defaultData"
            :on-commit="onCommit"
            :on-change="onChange"
            :target="targetProperty"
        >
            <template v-for="slot in ['plant.size']" v-slot:[slot]="{field}">
                <div :key="slot">
                    <b-dropdown
                        :key="slot"
                        class="float-left"
                        size="sm"
                        id="dropdown-1"
                        :text="choiceName(getPropertyByString(reactiveData, field.property), field.params.choices)"
                        variant="outline-secondary"
                    >
                        <b-dropdown-item
                            v-for="(choice, index) in field.params.choices"
                            @click="setPropertyByString(reactiveData, field.property, choice.key)"
                            :key="index"
                            size="sm"
                        >
                            {{ choice.name }}
                        </b-dropdown-item>
                    </b-dropdown>
                    <span
                        class="d-inline-flex circle-border border border-primary rounded-circle text-primary"
                        style="margin: 4px 6px;padding: 4px;"
                        v-b-modal.grease-arrestor-size-guide
                    >
                        <v-icon name="info" style="width:12px;height:12px;"></v-icon>
                    </span>
                </div>
            </template>
        </PropertiesFieldBuilder>
        <b-row>
            <b-col>
                <b-button size="sm" variant="danger" @click="onDelete">
                    Delete
                </b-button>
            </b-col>
        </b-row>

        <b-modal id="grease-arrestor-size-guide" centered title="Size Guide" hide-footer>
            <img src="@/assets/Grease_Arrestor_Size_Guide.png">
        </b-modal>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import PropertiesFieldBuilder from "../../../../src/components/editor/lib/PropertiesFieldBuilder.vue";
import { DocumentState } from "../../../../src/store/document/types";
import { fillPlantDefaults, makePlantEntityFields } from "../../../../../common/src/api/document/entities/plants/plant-entity";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import {getEntityName} from "../../../../../common/src/api/document/entities/types";
import { getPropertyByString, setPropertyByString } from "../../../lib/utils";
import { Choice } from "../../../../../common/src/lib/utils";
import { Watch } from "vue-property-decorator";

@Component({
    components: { PropertiesFieldBuilder },
    props: {
        selectedEntity: Object,
        selectedObject: Object,
        targetProperty: String,
        onDelete: Function,
        onChange: Function
    }
})
export default class PlantProperties extends Vue {
    getPropertyByString = getPropertyByString;
    setPropertyByString = setPropertyByString;
    
    get fields() {
        return makePlantEntityFields(this.defaultCatalog, this.document.drawing, this.$props.selectedEntity, this.document.drawing.metadata.flowSystems);
    }

    get name() {
        return getEntityName(this.$props.selectedEntity);
    }

    get reactiveData() {
        return this.$props.selectedEntity;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultCatalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get defaultData() {
        return fillPlantDefaults(this.$props.selectedEntity, this.document.drawing);
    }

    async onCommit() {
        await this.$store.dispatch("document/validateAndCommit");
    }

    choiceName(key: string, choices: Choice[]): string {
        const result = choices.find((c) => c.key === key);
        if (result) {
            return result.name;
        }
        return key + " (not found...)";
    }

    @Watch('reactiveData.plant.location')
    @Watch('reactiveData.plant.position')
    @Watch('reactiveData.plant.size')
    handleGreaseArrestorSizeUpdate() {
        const manufacturer = this.document.drawing.metadata.catalog.greaseArrestor[0]?.manufacturer || 'generic';
        const selectedSize = this.defaultCatalog.greaseArrestor!.size[manufacturer][this.reactiveData.plant.location]?.[this.reactiveData.plant.position]?.[this.reactiveData.plant.size];
        console.log(selectedSize);
        if (!!selectedSize) {
            setPropertyByString(this.reactiveData, 'heightMM', selectedSize.widthMM);
            setPropertyByString(this.reactiveData, 'widthMM', selectedSize.lengthMM);
            this.onCommit();
        }
    }
}
</script>

<style lang="less">
.sidebar-title {
    position: relative;
    font-size: 30px;
    z-index: 1;
    overflow: hidden;
    text-align: center;

    &:before,
    &:after {
        position: absolute;
        top: 51%;
        overflow: hidden;
        width: 50%;
        height: 1px;
        content: "\a0";
        background-color: lightgray;
    }

    &:before {
        margin-left: -50%;
        text-align: right;
    }
}
#grease-arrestor-size-guide .modal-dialog {
    max-width: max-content;
}
</style>
