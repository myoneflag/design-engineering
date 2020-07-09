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
    import {DocumentState} from "../../store/document/types";
    import {setPropertyByStringVue} from "../../lib/utils";

    @Component({
        components: { },
        props: {
        }
    })
    export default class NodesTable extends Vue {
        get priceTable(): PriceTable {
            return this.$store.getters['document/priceTable'];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get fields() {
            return ["Node", "Unit cost"];
        }

        get cellKey() {
            return 'cell(Unit cost)';
        }

        onCellInput(id: string, value: number) {
            setPropertyByStringVue(
                this.document.drawing.metadata.priceTable,
                'Fixtures.' + id,
                Number(value),
            );
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
