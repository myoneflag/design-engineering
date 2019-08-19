<template>
    <b-navbar type="light">

        <b-navbar-nav>
            <b-nav-item to="/" active-class="active" exact>Home</b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav style="padding-left: 20px">

            <span v-if="titleEditing">
                <b-input v-model="stagedTitle"
                              v-autowidth="{maxWidth: '960px', minWidth: '20px', comfortZone: 0}"
                              v-on:blur="setTitle"
                              @keyup.enter="setTitle"
                              @focus="$event.target.select()"
                         size="md"
                />
            </span>

            <b-navbar-brand v-else @dblclick="titleEditing = true; stagedTitle = title">{{title}}</b-navbar-brand>

        </b-navbar-nav>

        <b-navbar-nav class="ml-auto">
            <b-nav-item v-b-modal.project-setup-modal>Setup <v-icon name="sliders-h"></v-icon> </b-nav-item>
        </b-navbar-nav>
    </b-navbar>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import { DocumentState } from '@/store/document/types';
    import { State } from 'vuex-class';
    import {state} from "@/store/document";

    @Component
    export default class DrawingNavBar extends Vue {
        @State('document') documentState!: DocumentState;

        titleEditing = false;
        stagedTitle: string = "";

        get title() {
            return this.$store.getters["document/title"];
        }


        setTitle(event: any) {
            this.$store.dispatch("document/titleChange", event.target.value);
            this.titleEditing = false;
        }
    };

</script>

<style lang="less">
    .navbar {
        padding: 10px;
        background-color: #ffffff;
        border-bottom: 1px solid lightgray;
    }
</style>
