<template>
    <b-container>
        <b-row style="margin-bottom: 50px;">
            <b-col>
                <b-breadcrumb :items="paths">
                </b-breadcrumb>
            </b-col>

        </b-row>
        <template v-for="[prop, val] in Object.entries(getSchema())">
            <template v-if="val && currCatalog.hasOwnProperty(prop)">
                <template v-if="val.table" >
                    <b-row style="margin-top: 25px; margin-bottom: 25px;" >
                        <b-col>
                            <h4 style="text-align: left">
                                <router-link :to="navigateLink(prop)">
                                    {{ val.name }}
                                </router-link>
                                <span>
                                <b-button v-b-toggle="'collapse' + prop" coll class="float-right" size="sm" variant="primary">
                                    Show / Hide
                                </b-button>
                            </span>
                            </h4>

                        </b-col>
                    </b-row>
                    <b-row :key="prop">
                        <b-col >
                            <b-collapse :id="'collapse' + prop" :visible="onlyOneTable">
                                <b-table v-if="val.table.link"
                                         striped
                                         :items="getTable(prop).items"
                                         :fields="getTable(prop).fields"
                                         style="max-width: 100%; overflow-x: auto"
                                         select-mode="single"
                                         :selectable="true"
                                         @row-selected="(d) => onRowClick(prop, d)"
                                ></b-table>
                                <b-table
                                        small
                                        v-else
                                        striped
                                        :items="getTable(prop).items"
                                        :fields="getTable(prop).fields"
                                        style="max-width: 100%; overflow-x: auto"
                                ></b-table>
                            </b-collapse>
                        </b-col>
                    </b-row>
                </template>
                <template v-else-if="val.displayField">
                    <b-form-group
                            :label-cols="3"
                            :label="val.name + ';'"
                            :disabled="true"
                    >
                        <b-form-input :disabled="true" :value="currCatalog[prop][val.displayField]"></b-form-input>
                    </b-form-group>
                </template>
                <template v-else>
                    <b-form-group
                            :label-cols="3"
                            :label="val.name"
                            :disabled="true"
                    >
                        <b-form-input :disabled="true" :value="currCatalog[prop]"></b-form-input>
                    </b-form-group>
                </template>
            </template>
        </template>
    </b-container>

</template>
<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";
    import MainNavBar from "../../components/MainNavBar.vue";
    import {Catalog} from "../../store/catalog/types";
    import {CatalogSchema, getCatalogDisplaySchema, Page, Table} from "../../lib/catalog/displaySchema";
    import {getPropertyByString} from "../../lib/utils";
    import {RawLocation} from "vue-router";
    @Component({
        components: {MainNavBar},
        props: {
            schema: Object,
        },
    })
    export default class CatalogView extends Vue {
        mounted() {
        }

        destroyed() {

        }

        onRowClick(prop: string, params: {_key: string}[]) {
            if (params.length === 0) {
                return;
            }
            this.$router.push(
                this.navigateLink(prop + '.' + params[0]._key),
            );
        }

        get catalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        get schemaTyped(): CatalogSchema {
            return getCatalogDisplaySchema();
        }

        get paths(): {text: string, to: RawLocation}[] {
            const props: string[] = [];
            if (this.$route.params.prop) {
                props.push(...this.$route.params.prop.split('.'));
            }
            const retVal: {text: string, to: RawLocation}[] = [
                {text: 'database', to: { name: 'settings/catalog'}},
            ];
            let curPath = '';
            for (const prop of props) {
                if (curPath.length) {
                    curPath += '.';
                }
                curPath += prop;
                retVal.push({text: prop, to: { name: 'settings/catalog', params: { prop: curPath}}});
            }
            return retVal;
        }

        get currPath() {
            console.log('current path: ' + this.$route.params.prop);
            return this.$route.params.prop || '';
        }

        get currCatalog() {

            const pathArr = this.currPath.split('.');
            if (pathArr.length % 2 === 1) {
                pathArr.splice(pathArr.length - 1, 1);
            }

            if (pathArr.join('.') === '') {
                console.log('value: ' + JSON.stringify(this.catalog));
                return this.catalog;
            }

            const val = getPropertyByString(this.catalog, pathArr.join('.'));
            console.log('value: ' + JSON.stringify(val));
            return val;
        }

        navigateLink(prop: string) {

            let currPath = this.$route.params.prop || '';

            const pathArr = this.currPath.split('.');
            if (pathArr.length % 2 === 1) {
                pathArr.splice(pathArr.length - 1, 1);
            }

            currPath = pathArr.join('.');
            if (currPath.length) {
                currPath += '.';
            }
            currPath += prop;
            console.log(currPath);
            return {
                name: 'settings/catalog',
                params: {
                    prop: currPath,
                }
            };
        }

        getTable(prop: string) {
            const table = this.getSchema()[prop]!.table!;
            const cols = table.columns;

            const items = [];
            const entries = this.currCatalog[prop];


            for (const [key, value] of Object.entries(entries)) {
                const item: any = {};
                console.log('table: ' + JSON.stringify(table));
                if (table.primaryName) {
                    item[table.primaryName] = key;
                }

                item._key = key;

                for (const col of cols) {
                    if (col[0] === null) {
                        item[col[1]] = value;
                    } else {
                        item[col[1]] = (value as any)[col[0]];
                    }
                }

                items.push(item);
            }

            const fields = cols.map((c) => c[1]);
            if (table.primaryName) {
                fields.splice(0, 0, table.primaryName);
            }

            return {items, fields};
        }

        getSchema(): Page<any> {
            const components = this.currPath.split('.').filter((o) => o.length);
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
                throw new Error('Link not defined for this path');
            }
            console.log('schema: ' + JSON.stringify(curr));
            return curr;
        }

        get onlyOneTable() {
            const schema = this.getSchema();
            const data = this.currCatalog;
            let numTables = 0;
            for (const key of Object.keys(schema)) {
                if (data.hasOwnProperty(key)) {
                    if (schema[key] && schema[key]!.table) {
                        numTables ++;
                    }
                }
            }
            return numTables === 1;
        }
    }
</script>
