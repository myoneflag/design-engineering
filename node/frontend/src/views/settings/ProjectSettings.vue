<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <b-container style="margin-top: 50px">
            <b-row>
                <b-col>
                    <h3>Project Settings</h3>
                </b-col>
            </b-row>
            <b-row style="padding-top: 20px">
                <b-col cols="2">
                    <b-nav vertical pills style="top: 0;">
                        <b-nav-item :to="{ name: 'settings/general' }" active-class="active">General</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/units' }" active-class="active">Units</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/catalog' }" active-class="active">Catalog</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/budget' }" active-class="active">Budget</b-nav-item>

                        <b-nav-item :to="{ name: 'settings/fixtures' }" active-class="active">Fixtures</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/flow-systems' }" active-class="active"
                            >Flow Systems</b-nav-item
                        >
                        <b-nav-item :to="{ name: 'settings/calculations' }" active-class="active"
                            >Calculations</b-nav-item
                        >
                        <b-nav-item :to="{ name: 'settings/document' }" active-class="active">Document</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/hot-keys' }" active-class="active">Hot Keys</b-nav-item>
                        <b-nav-item :to="{ name: 'settings/debug' }" active-class="active" style="opacity: 0.1"
                            >Debug</b-nav-item
                        >
                    </b-nav>
                </b-col>
                <b-col cols="10">
                    <div style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 200px)">
                        <router-view> </router-view>
                    </div>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import DrawingNavBar from "../../components/DrawingNavBar.vue";

@Component({
    components: { DrawingNavBar }
})
export default class ProjectSettings extends Vue {}
</script>
