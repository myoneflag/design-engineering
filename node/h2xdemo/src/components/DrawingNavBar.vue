<template>
    <b-navbar type="light">

        <b-navbar-nav>
            <b-nav-item :to="{name: 'home'}" active-class="active" exact>Home</b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav style="padding-left: 20px">

            <span v-if="titleEditing">
                <b-input v-model="title"
                              v-autowidth="{maxWidth: '960px', minWidth: '20px', comfortZone: 0}"
                              v-on:blur="commit"
                              @keyup.enter="commit"
                              @focus="$event.target.select()"
                         size="md"
                />
            </span>

            <b-navbar-brand
                    :to="{name: 'drawing'}"
                    v-else
                    @dblclick="titleEditing = true"
                    v-b-tooltip.hover :title="title"
            >
                {{shortTitle}}
            </b-navbar-brand>

            <b-nav-item :to="{name: 'settings/general'}" active-class="active" exact>
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
    import Component from 'vue-class-component';
    import ProfileMenuItem from '@/components/ProfileMenuItem.vue';
    @Component({
        components: { ProfileMenuItem },
    })
    export default class DrawingNavBar extends Vue {
        @State('document') documentState!: DocumentState;

        titleEditing = false;

        get username() {
            return this.$store.getters['profile/username'];
        }

        get title() {
            return this.$store.getters['document/title'];
        }

        set title(value: string) {
            this.$store.dispatch('document/setTitle', value);
        }

        get shortTitle() {
            let title = this.title;
            if (title.length > 50) {
                title = title.slice(0, 40) + '...' + title.slice(title.length - 7, title.length);
            }
            return title;
        }

        commit() {
            this.titleEditing = false;
            this.$store.dispatch('document/commit');
        }
    }

</script>

<style lang="less">
    .navbar {
        padding: 10px;
        background-color: #ffffff;
        border-bottom: 1px solid lightgray;
    }
</style>
