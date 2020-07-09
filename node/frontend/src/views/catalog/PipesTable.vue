<template>
    <div>
        <b-row>
            <b-col>
                <h4>Price per meter ($/m)</h4>
            </b-col>
        </b-row>
        <b-table
                small
                striped
                :items="items"
                :fields="fields"
                style="max-width: 100%; overflow-x: auto; margin-top:25px"
                responsive="true"
        >
            <template v-for="material in materials" v-slot:[cellKey(material)]="slot" size="sm">
                <b-input-group size="sm">
                    <b-form-input
                            type="number"
                            @input="(e) => onCellInput(material, slot.item['Size (mm)'], e)"
                            :value="slot.value"
                    ></b-form-input>
                </b-input-group>
            </template>
        </b-table>
    </div>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {PipesBySize, PipesTable as PipesTableType, PlantTable, PriceTable} from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";
    import {DocumentState} from "../../store/document/types";
    import {setPropertyByStringVue} from "../../lib/utils";

    @Component({
        components: { },
        props: {
        }
    })
    export default class PipesTable extends Vue {
        get priceTable(): PriceTable {
            return this.$store.getters['document/priceTable'];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get fields() {
            const fields = ["Size (mm)"];
            for (const material of Object.keys(this.priceTable.Pipes)) {
                fields.push(material);
            }
            return fields;
        }

        cellKey(material: string) {
            return 'cell(' + material + ')';
        }

        get materials() {
            return Object.keys(this.priceTable.Pipes);
        }

        onCellInput(material: keyof PipesTableType, size: number, value: number) {
            setPropertyByStringVue(
                this.document.drawing.metadata.priceTable,
                'Pipes.' + material + '.' + size,
                Number(value),
            );
        }

        get items() {
            const itemsBySize: {[key: number]: {[key: string]: any}} = {};
            for (const [material, pipesBySize] of Object.entries(this.priceTable.Pipes)) {
                for (const [size, cost] of Object.entries(pipesBySize as PipesBySize)) {
                    if (!(size in itemsBySize)) {
                        itemsBySize[Number(size)] = {"Size (mm)": size};
                    }
                    itemsBySize[Number(size)][material] = cost;
                }
            }
            return Object.keys(itemsBySize).sort((a, b) => Number(a) - Number(b)).map((size) => itemsBySize[Number(size)]);
        }
    }
</script>
<style lang="less"></style>
