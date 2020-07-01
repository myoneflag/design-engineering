<template>
    <b-container>
        <b-row style="margin-bottom: 50px;">
            <b-col>
                <b-breadcrumb :items="paths"> </b-breadcrumb>
            </b-col>
        </b-row>
        <template v-for="[prop, val] in Object.entries(getSchema())">
            <template v-if="val && currCatalog.hasOwnProperty(prop)">
                <template v-if="val.table">
                    <b-row :key="prop" style="margin-top: 25px; margin-bottom: 25px;">
                        <b-col cols="12">
                            <h4 style="text-align: left">
                                <router-link :to="navigateLink(prop)">
                                    {{ val.name }}
                                </router-link>
                                <span>
                                    <b-button
                                        v-b-toggle="'collapse' + prop"
                                        coll
                                        class="float-right"
                                        size="sm"
                                        variant="primary"
                                    >
                                        Show / Hide
                                    </b-button>
                                </span>
                            </h4>
                        </b-col>
                        <b-col cols="12">
                            <b-collapse :id="'collapse' + prop" :visible="onlyOneTable">
                                <b-table
                                    v-if="val.table.link"
                                    striped
                                    :items="getTable(prop).items"
                                    :fields="getTable(prop).fields"
                                    style="max-width: 100%; overflow-x: auto; margin-top:25px"
                                    select-mode="single"
                                    :selectable="true"
                                    @row-selected="(d) => onRowClick(prop, d)"
                                    responsive="true"
                                >
                                    <template v-if="prop === 'pipes' || prop === 'backflowValves'" v-slot:cell(manufacturer)="data">
                                        <b-button 
                                            :variant="isSelectedManufacturer(prop, data.item._key, manufacturer.uid) && 'primary' || 'outline-primary'" 
                                            size="sm" 
                                            :class="'manufacturer-item-btn'"
                                            v-for="manufacturer in data.item.Manufacturer" :key="manufacturer.name"
                                            @click="(e) => handleManufacturerClick(prop, data.item._key, manufacturer.uid)"
                                        >
                                            {{ manufacturer.name }}
                                        </b-button> 
                                    </template>
                                </b-table>
                                <b-table
                                    small
                                    v-else
                                    striped
                                    :items="getTable(prop).items"
                                    :fields="getTable(prop).fields"
                                    style="max-width: 100%; overflow-x: auto; margin-top:25px"
                                    responsive="true"
                                ></b-table>
                            </b-collapse>
                        </b-col>
                    </b-row>
                </template>
                <template v-else-if="val.displayField">
                    <b-form-group :key="prop" :label-cols="3" :label="val.name + displayUnitsString(val.units)" :disabled="true">
                        <b-form-input :disabled="true" :value="display(val.units, currCatalog[prop][val.displayField])"></b-form-input>
                    </b-form-group>
                </template>
                <template v-else>
                    <b-form-group :key="prop" :label-cols="3" :label="val.name + displayUnitsString(val.units)" :disabled="true">
                        <b-form-input :disabled="true" :value="display(val.units, prop)"></b-form-input>
                    </b-form-group>
                </template>
            </template>
        </template>
    </b-container>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import MainNavBar from "../../components/MainNavBar.vue";
import { CatalogSchema, getCatalogDisplaySchema, Page, Table } from "../../lib/catalog/displaySchema";
import { getPropertyByString } from "../../lib/utils";
import { RawLocation } from "vue-router";
import { Catalog, Manufacturer } from "../../../../common/src/api/catalog/types";
import { Catalog as DawingCatalog} from "../../../../common/src/api/document/drawing";
import { DocumentState } from "../../store/document/types";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { convertMeasurementSystem, Units } from "../../../../common/src/lib/measurements";
import { SelectedMaterialManufacturer } from "../../../../common/src/api/document/drawing";
@Component({
    components: { MainNavBar },
    props: {
        schema: Object
    }
})
export default class CatalogView extends Vue {
    onRowClick(prop: string, params: Array<{ _key: string }>) {
        if (params.length === 0) {
            return;
        }

        this.$router.push(this.navigateLink(prop + "." + params[0]._key));
    }

    get catalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get schemaTyped(): CatalogSchema {
        return getCatalogDisplaySchema();
    }

    get paths(): Array<{ text: string; to: RawLocation }> {
        const props: string[] = [];
        if (this.$route.params.prop) {
            props.push(...this.$route.params.prop.split("."));
        }
        const retVal: Array<{ text: string; to: RawLocation }> = [
            { text: "database", to: { name: "settings/catalog" } }
        ];
        let curPath = "";
        for (const prop of props) {
            if (curPath.length) {
                curPath += ".";
            }
            curPath += prop;
            retVal.push({ text: prop, to: { name: "settings/catalog", params: { prop: curPath } } });
        }
        return retVal;
    }

    get currPath() {
        return this.$route.params.prop || "";
    }

    get currCatalog() {
        const pathArr = this.currPath.split(".");
        if (pathArr.length % 2 === 1) {
            pathArr.splice(pathArr.length - 1, 1);
        }

        if (pathArr[0] === 'backflowValves' && pathArr.length === 4) {
            pathArr.splice(3, 0, this.manufacturer);
        }

        if (pathArr.join(".") === "") {
            return this.catalog;
        }
        
        console.log(pathArr.join("."));
        const val = getPropertyByString(this.catalog, pathArr.join("."));
        return val;
    }

    get document(): DocumentState {
        return this.$store.getters['document/document'];
    }

    get onlyOneTable() {
        const schema = this.getSchema();
        const data = this.currCatalog;
        let numTables = 0;
        for (const key of Object.keys(schema)) {
            if (data.hasOwnProperty(key)) {
                if (schema[key] && schema[key]!.table) {
                    numTables++;
                }
            }
        }
        return numTables === 1;
    }

    get manufacturer(): string {
        if (this.paths.length <= 2) {
            return '';
        }

        const selectedCatalog = this.paths[1].text;
        const materialObj = this.catalog[selectedCatalog][this.paths[2].text];
        const selMtlMftr = this.selMtlMftr(selectedCatalog);

        return selMtlMftr?.find((mtl: SelectedMaterialManufacturer) => mtl.uid === materialObj.uid)?.manufacturer || 'generic';
    }

    display(units: Units | undefined, prop: string) {
        let value: number | string | undefined = this.currCatalog[prop];
        if (prop === 'manufacturer' && Array.isArray(value)) {
            value = value.find((obj: Manufacturer) => obj.uid === this.manufacturer).name;
        }

        if (units && !isNaN(Number(value))) {
            return convertMeasurementSystem(this.document.drawing.metadata.units, units, Number(value))[1];
        } else {
            return value;
        }
    }

    displayUnitsString(units: Units | undefined) {
        if (units) {
            return ' (' +
                    convertMeasurementSystem(
                        this.document.drawing.metadata.units,
                        units,
                        1
                    )[0]
                    + ')';
        } else {
            return "";
        }
    }

    navigateLink(prop: string) {
        let currPath = this.$route.params.prop || "";

        const pathArr = this.currPath.split(".");
        if (pathArr.length % 2 === 1) {
            pathArr.splice(pathArr.length - 1, 1);
        }

        currPath = pathArr.join(".");
        if (currPath.length) {
            currPath += ".";
        }
        currPath += prop;
        return {
            name: "settings/catalog",
            params: {
                prop: currPath
            }
        };
    }

    getTable(prop: string) {
        const schema = this.getSchema();
        const table = schema[prop]!.table!;
        if (!table.twoDimensional) {

            const cols = cloneSimple(table.columns);

            for (const col of cols) {
                col[1] += this.displayUnitsString(col[2]);
            }

            const items = [];
            let entries = this.currCatalog[prop];
            
            if (this.manufacturer && (prop === 'pipesBySize' || prop === 'valvesBySize')) {
               entries = entries[this.manufacturer] || entries;
            }

            for (const [key, value] of Object.entries(entries)) {
                const item: any = {};
                if (table.primaryName) {
                    if (table.primaryUnits && !isNaN(Number(key))) {
                        item[table.primaryName] = convertMeasurementSystem(
                            this.document.drawing.metadata.units,
                            table.primaryUnits,
                            Number(key),
                        )[1];
                        if (!isNaN(item[table.primaryName])) {
                            item[table.primaryName] = parseFloat(Number(item[table.primaryName]).toFixed(5));
                        }
                    } else {
                        item[table.primaryName] = Number(key);
                    }
                }

                item._key = key;

                for (const col of cols) {
                    let display = value;
                    if (col[0] !== null) {
                        display = (value as any)[col[0]];
                    }

                    if (col[2]) {
                        item[col[1]] = convertMeasurementSystem(
                            this.document.drawing.metadata.units,
                            col[2],
                            Number(display),
                        )[1];
                        if (!isNaN(item[col[1]])) {
                            item[col[1]] = parseFloat(Number(item[col[1]]).toFixed(5));
                        }
                    } else {
                        item[col[1]] = display;
                    }
                }

                items.push(item);
            }

            const fields: Array<string|object> = cols.map((c) => c[1]);
            if (table.primaryName) {
                fields.splice(0, 0, table.primaryName);
            }

            if (prop === 'pipes') {
                fields[1] = {
                    label: fields[1],
                    key: 'manufacturer',
                    tdClass: 'text-left',
                };
            } else if (prop === 'backflowValves') {
                fields[1] = {
                    label: fields[1],
                    key: 'manufacturer',
                    tdClass: 'text-left',
                };
            }

            return { items, fields };
        } else {

            const cols = cloneSimple(table.columns);

            for (const col of cols) {
                col[1] += this.displayUnitsString(col[2]);
            }

            const newFieldNames = new Set<any>();

            const items = [];
            const entries = this.currCatalog[prop];

            for (const [key, value] of Object.entries(entries)) {
                const item: any = {};

                if (table.primaryName) {
                    if (table.primaryUnits && !isNaN(Number(key))) {
                        item[table.primaryName] = convertMeasurementSystem(
                            this.document.drawing.metadata.units,
                            table.primaryUnits,
                            Number(key),
                        )[1];
                        if (!isNaN(item[table.primaryName])) {
                            item[table.primaryName] = parseFloat(Number(item[table.primaryName]).toFixed(5));
                        }
                    } else {
                        item[table.primaryName] = Number(key);
                    }
                }

                item._key = key;

                for (const col of cols) {
                    let display = value;
                    if (col[0] !== null) {
                        display = (value as any)[col[0]];
                    }

                    if (col[2]) {
                        item[col[1]] = convertMeasurementSystem(
                            this.document.drawing.metadata.units,
                            col[2],
                            Number(display),
                        )[1];
                        if (!isNaN(item[col[1]])) {
                            item[col[1]] = parseFloat(Number(item[col[1]]).toFixed(5));
                        }
                    } else {
                        item[col[1]] = display;
                    }

                }

                Object.assign(item, value);
                for (const c of Object.keys(value as any)) {
                    newFieldNames.add(c);
                }

                items.push(item);
            }

            const fields = cols.map((c) => c[1]);

            for (const c of Array.from(newFieldNames.values()).sort((a, b) => {
                if (!isNaN(a) && !isNaN(b)) {
                    return a - b;
                } else {
                    return a < b ? -1 : (a > b ? 1 : 0);
                }
            })) {
                fields.push(c);
            }

            if (table.primaryName) {
                fields.splice(0, 0, table.primaryName);
            }

            return { items, fields };
        }
    }

    getSchema(): Page<any> {
        const components = this.currPath.split(".").filter((o) => o.length);
        let curr: Page<any> = this.schemaTyped;
        let i = 0;
        while (i < components.length - 1) {
            curr = curr[components[i]]!.table!.link!;
            i += 2;
        }
        if (i < components.length) {
            // one table remaining.
            const newObj: any = {};
            newObj[components[i]] = curr[components[i]];
            curr = newObj;
        }
        if (curr === null) {
            throw new Error("Link not defined for this path");
        }
        return curr;
    }

    selMtlMftr(catalog: string): SelectedMaterialManufacturer[] | [] {
        return this.document.drawing.metadata.catalog[catalog] || [];
    }

    isSelectedManufacturer(catalog: string, key: string, manufacturer: string) {
        // As default, generic is selected.
        if (!this.selMtlMftr(catalog).length || this.selMtlMftr(catalog).findIndex((obj: SelectedMaterialManufacturer)  => obj.uid === key) < 0) {
            return manufacturer === 'generic';
        }

        return this.selMtlMftr(catalog).findIndex((obj: SelectedMaterialManufacturer) => obj.uid === key && obj.manufacturer === manufacturer) >= 0;
    }

    handleManufacturerClick(catalog: string, key: string, manufacturer: string) {
        const index = this.selMtlMftr(catalog).findIndex((obj: SelectedMaterialManufacturer) => obj.uid === key);
        
        if (!this.selMtlMftr(catalog).length || index < 0) {
            this.document.drawing.metadata.catalog[catalog].push({uid: key, manufacturer});
        } else {
            this.document.drawing.metadata.catalog[catalog].splice(index, 1, {uid: key, manufacturer});
        }

        this.save();
    }

    save() {
        this.$store.dispatch("document/commit", {skipUndo: true}).then(() => {
            this.$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
        });
    }
}
</script>

<style scoped>
    .manufacturer-item-btn {
        margin-right: 15px;
    }

    .manufacturer-item-btn:last-child {
        margin-right: 0px;
    }
</style>