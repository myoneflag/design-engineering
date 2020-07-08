<template>
    <div>
        <template v-for="valve in valves">
            <b-row>
                <b-col>
                    <h4>{{valve}}</h4>
                </b-col>
            </b-row>
            <b-table
                    small
                    striped
                    :items="items(valve)"
                    :fields="fields(valve)"
                    style="max-width: 100%; overflow-x: auto; margin-top:25px"
                    responsive="true"
            >
                <template v-for="material in materials" v-slot:[cellKey(material)]="slot" >
                    <b-input-group>
                        <b-form-input
                                type="number"
                                @input="(e) => onCellInput(valve, material, slot.item['Size (mm)'], e)"
                                :value="slot.value"
                        ></b-form-input>
                    </b-input-group>
                </template>
            </b-table>
            <br/>
            <br/>
        </template>
    </div>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {
        PipesBySize,
        PipesTable as PipesTableType,
        PlantTable,
        PriceTable,
        ValvesTable as ValvesTableType
    } from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";

    @Component({
        components: { },
        props: {
        }
    })
    export default class ValvesTable extends Vue {
        get priceTable(): PriceTable {
            return defaultPriceTable;
        }

        get valves() {
            return Object.keys(this.priceTable.Valves);
        }

        fields(valve: keyof ValvesTableType) {
            const fields = ["Size (mm)"];
            for (const material of Object.keys(this.priceTable.Valves[valve])) {
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

        onCellInput(valve: 'Tee' | 'Elbow', material: keyof PipesTableType, size: number, value: number) {
            defaultPriceTable.Valves[valve][material][size] = Number(value);
        }

        items(valve: keyof ValvesTableType) {
            const itemsBySize: {[key: number]: {[key: string]: any}} = {};
            for (const [material, val] of Object.entries(this.priceTable.Valves[valve])) {
                if ()
                for (const [size, cost] of Object.entries(pipesBySize as PipesBySize)) {
                    if (!(cost in itemsBySize)) {
                        itemsBySize[cost] = {"Size (mm)": size};
                    }
                    itemsBySize[cost][material] = cost;
                }
            }
            return Object.keys(itemsBySize).sort().map((size) => itemsBySize[Number(size)]);
        }
    }
</script>
<style lang="less"></style>
