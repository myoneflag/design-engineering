<template>
    <b-container style="margin-top: 50px">
        <b-row>
            <b-col>
                <h3>Project Settings</h3>
            </b-col>
        </b-row>
        <b-row style="padding-top: 20px">
                <b-nav vertical pills style="top: 0;">
                    <b-nav-item :to="{name: 'settings/general'}" active-class="active">General</b-nav-item>
                    <b-nav-item :to="{name: 'settings/fixtures'}" active-class="active">Fixtures</b-nav-item>
                    <b-nav-item :to="{name: 'settings/flow-systems'}" active-class="active">Flow Systems</b-nav-item>
                    <b-nav-item :to="{name: 'settings/calculations'}" active-class="active">Calculations</b-nav-item>
                    <b-nav-item :to="{name: 'settings/document'}" active-class="active">Document</b-nav-item>
                </b-nav>
            <b-col>
                <router-view>

                </router-view>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import DrawingNavBar from '../../components/DrawingNavBar.vue';

    @Component({
        components: { DrawingNavBar },
    })
    export default class ProjectSettings extends Vue {
    }
    /*

     */
</script>

