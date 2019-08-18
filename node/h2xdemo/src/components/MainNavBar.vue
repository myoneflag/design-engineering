<template>
    <b-nav pills>
        <b-nav-item to="/" active-class="active" exact>Home</b-nav-item>
        <template v-if="$route.name === 'document'">
            <span v-if="data.titleEditing">
                <b-form-input v-model="documentState.drawing.title"
                              v-autowidth="{maxWidth: '960px', minWidth: '20px', comfortZone: 0}"
                              v-on:blur="data.titleEditing = false"
                              @keyup.enter="data.titleEditing = false"
                              @focus="$event.target.select()"
                />
            </span>

            <b-nav-text v-else @dblclick="data.titleEditing = true">{{ documentState.drawing.title }}</b-nav-text>
        </template>
    </b-nav>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { DocumentState } from '@/store/document/types';
import { State } from 'vuex-class';

export interface MainNavBarState {
    titleEditing: boolean;
}

@Component
export default class MainNavBar extends Vue {
    @State('document') documentState!: DocumentState;
    data: MainNavBarState = {
        titleEditing: false,
    };
    methods: any  = {
        editTitle: function () {
            console.log("Double clicked you douche");
        }
    }
}

</script>

<style lang="less">
    .nav {
        padding: 10px;
        background-color: #ffffff;
        border-bottom: 1px solid lightgray;
    }
</style>
