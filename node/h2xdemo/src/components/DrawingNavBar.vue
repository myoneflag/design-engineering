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

            <b-nav-item>
                <span>
                    <v-icon name="cog"></v-icon>
                </span>
                Settings
            </b-nav-item>
        </b-navbar-nav>


        <ProfileMenuItem/>
    </b-navbar>
</template>

<script lang="ts">
    import {Vue } from 'vue-property-decorator';
    import { DocumentState } from '@/store/document/types';
    import { State } from 'vuex-class';
    import {state} from "@/store/document";
    import {mapGetters} from "vuex";
    import Component from 'vue-class-component';
    import ProfileMenuItem from '@/components/ProfileMenuItem.vue';
    @Component({
        components: {ProfileMenuItem}
    })
    export default class DrawingNavBar extends Vue {
        @State('document') documentState!: DocumentState;

        titleEditing = false;
        stagedTitle: string = "";

        get username() {
            return this.$store.getters["profile/username"]
        }

        get title() {
            return this.$store.getters["document/title"];
        }


        setTitle(event: any) {
            this.$store.dispatch("document/setTitle", event.target.value);
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
