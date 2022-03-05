<template>
    <div>
        <MainNavBar></MainNavBar>
        <div class="home" style="overflow-y: auto; overflow-x: hidden; height: calc(125vh - 63px)">
            <b-container>
                <b-row>
                    <b-col>
                        <h1 class="title">
                            Automatically Reported Errors
                        </h1>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-alert variant="success" v-if="errors.length === 0 && isLoaded" show
                            >There are no error reports right now</b-alert
                        >
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-list-group>
                            <b-list-group-item
                                v-for="e in errors"
                                :key="e.id"
                                :to="'/errors/id/' + e.id"
                                :variant="['danger', 'primary', 'success', ''][e.status]"
                            >
                                <b-row>
                                    <b-col cols="1">{{ e.user ? e.user.username : "[not logged in]" }}</b-col>
                                    <b-col cols="2">{{ new Date(e.threwOn).toLocaleString() }}</b-col>
                                    <b-col cols="1">{{ e.appVersion }}</b-col>
                                    <b-col cols="3">{{ e.url }}</b-col>
                                    <b-col cols="5">{{ e.message }}</b-col>
                                </b-row>
                            </b-list-group-item>
                        </b-list-group>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-button variant="info" @click="loadMoreErrors()">Load More</b-button>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import Vue from "vue";
import { User } from "../../../common/src/models/User";
import MainNavBar from "../../src/components/MainNavBar.vue";
import { ErrorReport, ErrorStatus } from "../../../common/src/models/Error";
import { getErrorReports } from "../api/error-report";

@Component({
    components: {
        MainNavBar
    }
})
export default class Errors extends Vue {
    errors: ErrorReport[] = [];
    isLoaded: boolean = false;
    triedToLoad = new Set<number>();
    filters: ErrorStatus[] = [ErrorStatus.NEW, ErrorStatus.DOING];

    mounted() {
        // fill documents
        this.loadMoreErrors();
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    loadMoreErrors() {
        this.triedToLoad.add(this.errors.length);
        getErrorReports(this.filters, this.errors.length, 50).then((res) => {
            if (res.success) {
                this.errors.push(...res.data);
                this.isLoaded = true;
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error retrieving error list (How ironic)"
                });
            }
        });
    }

    get ErrorStatus() {
        return ErrorStatus;
    }

    toggleFilter(val: ErrorStatus) {
        if (this.filters.includes(val)) {
            this.filters.splice(this.filters.indexOf(val), 1);
        } else {
            this.filters.push(val);
        }
        this.errors.splice(0);
        this.triedToLoad.clear();
        this.isLoaded = false;
        this.loadMoreErrors();
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
