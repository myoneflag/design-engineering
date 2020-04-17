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
                    <b-row style="margin-top: 25px; margin-bottom: 25px;">
                        <b-col>
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
                    </b-row>
                    <b-row :key="prop">
                        <b-col>
                            <b-collapse :id="'collapse' + prop" :visible="onlyOneTable">
                                <b-table
                                    v-if="val.table.link"
                                    striped
                                    :items="getTable(prop).items"
                                    :fields="getTable(prop).fields"
                                    style="max-width: 100%; overflow-x: auto"
                                    select-mode="single"
                                    :selectable="true"
                                    @row-selected="(d) => onRowClick(prop, d)"
                                    responsive="true"
                                >
                                </b-table>
                                <b-table
                                    small
                                    v-else
                                    striped
                                    :items="getTable(prop).items"
                                    :fields="getTable(prop).fields"
                                    style="max-width: 100%; overflow-x: auto"
                                    responsive="true"
                                ></b-table>
                            </b-collapse>
                        </b-col>
                    </b-row>
                </template>
                <template v-else-if="val.displayField">
                    <b-form-group :label-cols="3" :label="val.name + displayUnitsString(val.units)" :disabled="true">
                        <b-form-input :disabled="true" :value="display(val.units, currCatalog[prop][val.displayField])"></b-form-input>
                    </b-form-group>
                </template>
                <template v-else>
                    <b-form-group :label-cols="3" :label="val.name + displayUnitsString(val.units)" :disabled="true">
                        <b-form-input :disabled="true" :value="display(val.units, currCatalog[prop])"></b-form-input>
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
import { Catalog } from "../../../../common/src/api/catalog/types";
import { DocumentState } from "../../store/document/types";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { convertMeasurementSystem, Units } from "../../../../common/src/lib/measurements";
@Component({
    components: { MainNavBar },
    props: {
        schema: Object
    }
})
export default class CatalogView extends Vue {
    mounted() {
        //
    }

    destroyed() {
        //
    }

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

        if (pathArr.join(".") === "") {
            return this.catalog;
        }

        const val = getPropertyByString(this.catalog, pathArr.join("."));
        return val;
    }

    display(units: Units | undefined, value: number | string) {
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

                items.push(item);
            }

            const fields = cols.map((c) => c[1]);
            if (table.primaryName) {
                fields.splice(0, 0, table.primaryName);
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
}
</script>
