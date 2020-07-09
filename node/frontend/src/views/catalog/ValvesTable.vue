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
                    :fields="fields"
                    style="max-width: 100%; overflow-x: auto; margin-top:25px"
                    responsive="true"
            >
                <template v-slot:[cellKey]="slot" >
                    <b-input-group prepend="$" size="sm">
                        <b-form-input
                                size="sm"
                                type="number"
                                @input="(e) => onCellInput(valve, slot.item['Size (mm)'], e)"
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
        ValvesTable as ValvesTableType,
        PriceTable,
    } from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";
    import {DocumentState} from "../../store/document/types";
    import {setPropertyByStringVue} from "../../lib/utils";

    @Component({
        components: { },
        props: {
        }
    })
    export default class ValvesTable extends Vue {
        get priceTable(): PriceTable {
            return this.$store.getters['document/priceTable'];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get valves() {
            return Object.keys(this.priceTable.Valves);
        }

        get fields() {
            return ["Size (mm)", "Unit cost"];
        }

        get cellKey() {
            return 'cell(Unit cost)';
        }

        get materials() {
            return Object.keys(this.priceTable.Pipes);
        }

        onCellInput(valve: keyof ValvesTableType, size: number, value: number) {
            setPropertyByStringVue(
                this.document.drawing.metadata.priceTable,
                'Valves.' + valve + '.' + size,
                Number(value),
            );
        }

        items(valve: keyof ValvesTableType) {
            const itemsBySize: {[key: number]: any} = {};
            for (const [size, cost] of Object.entries(this.priceTable.Valves[valve])) {
                itemsBySize[Number(size)] = {"Size (mm)": size, "Unit cost": cost};
            }
            return Object.keys(itemsBySize).sort((a, b) => Number(a) - Number(b)).map((size) => itemsBySize[Number(size)]);
        }
    }
</script>
<style lang="less"></style>
