<template>
    <b-container>
        <template v-for="[title, component] in sections">
            <b-row :key="title" style="margin-top: 25px; margin-bottom: 25px;">
                <b-col cols="12">
                    <h4 style="text-align: left">
                        <h3 style="display: inline">{{ title }}</h3>
                        <span>
                            <b-button
                                v-b-toggle="'collapse' + title"
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
                    <b-collapse :id="'collapse' + title">
                        <component :is="component"/>
                    </b-collapse>
                </b-col>
            </b-row>
        </template>
    </b-container>
</template>
<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FixturesTable from "./FixturesTable.vue";

@Component({
    components: { FixturesTable},
    props: {
        schema: Object
    }
})
export default class CatalogView extends Vue {
    get sections() {
        return [
            ["Fixtures", "FixturesTable"],
        ]
    }
}
</script>
<style lang="less"></style>
