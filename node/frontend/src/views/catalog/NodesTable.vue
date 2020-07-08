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
            <b-input-group prepend="$">
                <b-form-input type="number" @input="(e) => onCellInput(slot.item['Node'], e)" :value="slot.value"></b-form-input>
            </b-input-group>
        </template>
    </b-table>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {PriceTable} from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";

    @Component({
        components: { },
        props: {
        }
    })
    export default class NodesTable extends Vue {
        get priceTable(): PriceTable {
            return defaultPriceTable;
        }

        get fields() {
            return ["Node", "Unit cost"];
        }

        get cellKey() {
            return 'cell(Unit cost)';
        }

        onCellInput(id: string, value: number) {
            defaultPriceTable.Fixtures[id] = Number(value);
        }

        get items() {
            return Object.entries(this.priceTable.Node).map(([node, cost]) => {
                return {
                    "Node": node,
                    "Unit cost": cost,
                }
            });
        }
    }
</script>
<style lang="less"></style>
