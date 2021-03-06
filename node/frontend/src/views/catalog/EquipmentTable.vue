<template>
    <div>
        <template v-for="component in components">
            <b-row>
                <b-col>
                    <h4>{{ title(component) }}</h4>
                </b-col>
            </b-row>
            <b-table
                    small
                    striped
                    :items="items(component)"
                    :fields="fields"
                    style="max-width: 100%; overflow-x: auto; margin-top:25px"
                    responsive="true"
            >
                <template v-slot:[cellKey]="slot" >
                    <b-input-group :prepend="currency.symbol" size="sm">
                        <b-form-input
                                size="sm"
                                type="number"
                                @input="(e) => onCellInput(component, slot.item['Size (mm)'], e)"
                                :value="displayValue(slot.value)"
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
        EquipmentTable as EquipmentTableType,
        PipesTable as PipesTableType,
        ValvesTable as ValvesTableType,
        PriceTable,
    } from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";
    import {DocumentState} from "../../store/document/types";
    import {setPropertyByString, setPropertyByStringVue} from "../../lib/utils";
    import { Price } from "aws-sdk/clients/route53domains";
    import { I18N } from "../../../../common/src/api/locale/values";

    @Component({
        components: { },
        props: {
        }
    })
    export default class EquipmentTable extends Vue {

        title(component: keyof PriceTable["Equipment"]) {
            switch (component) {
                case "Balancing Valve":
                    return I18N.balancingValve[this.document.locale];
            }
            return component;
        }

        get priceTable(): PriceTable {
            return this.$store.getters['document/priceTable'];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }
        get currency() {
            return this.document.drawing.metadata.units.currency;
        }
        displayValue(value: number) {
            if (!value) {
                return value;
            }
            return (value * this.currency.multiplierPct / 100).toFixed(2);
        }

        get components() {
            return Object.keys(this.priceTable.Equipment);
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

        onCellInput(equipment: keyof EquipmentTableType, size: number | 'All', value: number) {
            const priceTable = this.document.drawing.metadata.priceTable;
            console.log(JSON.stringify(priceTable, null, 2));
            if (typeof this.priceTable.Equipment[equipment] === 'number') {
                setPropertyByStringVue(
                    priceTable,
                    'Equipment.' + equipment,
                    Number(value) / this.currency.multiplierPct * 100,
                );
            } else {
                setPropertyByStringVue(
                    priceTable,
                    'Equipment.' + equipment + '.' + Number(size),
                    Number(value) / this.currency.multiplierPct * 100,
                );
            }
            console.log(JSON.stringify(priceTable, null, 2));
        }

        items(equipment: keyof EquipmentTableType) {
            if (typeof this.priceTable.Equipment[equipment] === 'number') {
                // Single 'all'
                return [{"Size (mm)": "All", "Unit cost": this.priceTable.Equipment[equipment]}];
            } else {
                // all other components have keys
                const itemsBySize: {[key: number]: any} = {};
                for (const [size, cost] of Object.entries(this.priceTable.Equipment[equipment])) {
                    itemsBySize[Number(size)] = {"Size (mm)": size, "Unit cost": cost};
                }
                return Object.keys(itemsBySize).sort((a, b) => Number(a) - Number(b)).map((size) => itemsBySize[Number(size)]);
            }
        }
    }
</script>
<style lang="less"></style>
