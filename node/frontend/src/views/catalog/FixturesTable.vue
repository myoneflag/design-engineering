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
                <b-form-input type="number" @input="(e) => onCellInput(slot.item['Fixture'], e)" :value="displayValue(slot.value)"></b-form-input>
            </b-input-group>
        </template>
    </b-table>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {PriceTable} from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";
    import {DocumentState} from "../../store/document/types";
    import {setPropertyByStringVue} from "../../lib/utils";

    @Component({
        components: { },
        props: {
        }
    })
    export default class FixturesTable extends Vue {
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
        onCellInput(id: string, value: number) {
            setPropertyByStringVue(
                this.document.drawing.metadata.priceTable,
                'Fixtures.' + id,
                Number(value) / this.currency.multiplierPct * 100,
            );
        }

        get fields() {
            return ["Fixture", "Unit Cost - Supply and Install"];
        }

        get cellKey() {
            return 'cell(Unit Cost - Supply and Install)';
        }


        get items() {
            return Object.entries(this.priceTable.Fixtures).sort().map(([fixture, cost]) => {
                return {
                    "Fixture": fixture,
                    "Unit Cost - Supply and Install": cost,
                }
            });
        }
    }
</script>
<style lang="less"></style>
