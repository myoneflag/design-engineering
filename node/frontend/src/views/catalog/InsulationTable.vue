<template>
    <b-table
            small
            striped
            :items="items"
            :fields="fields"
            style="max-width: 100%; overflow-x: auto; margin-top:25px"
            responsive="true"
    >
        <template v-slot:[cellKey]="slot">
            <b-input-group :prepend="currency.symbol">
                <b-form-input
                    type="number"
                    @input="(e) => onCellInput(slot.item['Size (mm)'], e)"
                    :value="displayValue(slot.value)"
                />
            </b-input-group>
        </template>
    </b-table>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {PlantTable, PriceTable} from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";
    import {DocumentState} from "../../store/document/types";
    import {setPropertyByStringVue} from "../../lib/utils";

    @Component({
        components: { },
        props: {
        }
    })
    export default class InsulationTable extends Vue {
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

        get fields() {
            return ["Size (mm)", "Cost per meter"];
        }

        get cellKey() {
            return 'cell(Cost per meter)';
        }

        onCellInput(id: number, value: number) {
            setPropertyByStringVue(
                this.document.drawing.metadata.priceTable,
                'Insulation.' + id,
                Number(value) / this.currency.multiplierPct * 100,
            );
        }

        get items() {
            return Object.entries(this.priceTable.Insulation).map(([size, cost]) => {
                return {
                    "Size (mm)": size,
                    "Cost per meter": cost,
                };
            });
        }
    }
</script>
<style lang="less"></style>
