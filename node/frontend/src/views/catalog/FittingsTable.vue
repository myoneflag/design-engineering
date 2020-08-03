<template>
    <div>
        <template v-for="fitting in fittings">
            <b-row>
                <b-col>
                    <h4>{{fitting}}</h4>
                </b-col>
            </b-row>
            <b-table
                    small
                    striped
                    :items="items(fitting)"
                    :fields="fields(fitting)"
                    style="max-width: 100%; overflow-x: auto; margin-top:25px"
                    responsive="true"
            >
                <template v-for="material in materials" v-slot:[cellKey(material)]="slot" >
                    <b-input-group size="sm">
                        <b-form-input
                                type="number"
                                @input="(e) => onCellInput(fitting, material, slot.item['Size (mm)'], e)"
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
        FittingsTable as FittingsTableType,
        PriceTable,
    } from "../../../../common/src/api/catalog/price-table";
    import {defaultPriceTable} from "../../../../common/src/api/catalog/default-price-table";
    import {setPropertyByStringVue} from "../../lib/utils";
    import {DocumentState} from "../../store/document/types";

    @Component({
        components: { },
        props: {
        }
    })
    export default class FittingsTable extends Vue {
        get priceTable(): PriceTable {
            return this.$store.getters['document/priceTable'];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get fittings() {
            return Object.keys(this.priceTable.Fittings);
        }

        fields(fitting: keyof FittingsTableType) {
            const fields = ["Size (mm)"];
            for (const material of Object.keys(this.priceTable.Fittings[fitting])) {
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

        onCellInput(fitting: keyof FittingsTableType, material: keyof PipesTableType, size: number, value: number) {
            setPropertyByStringVue(
                this.document.drawing.metadata.priceTable,
                'Fittings.' + fitting + '.' + material + '.' + size,
                Number(value),
            );
        }

        items(fitting: keyof FittingsTableType) {
            const itemsBySize: {[key: number]: {[key: string]: any}} = {};
            for (const [material, pipesBySize] of Object.entries(this.priceTable.Fittings[fitting])) {

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
