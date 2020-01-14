<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container class="home">
            <b-row>
                <b-col>
                    <h1 class="title">
                        Organizations
                    </h1>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <b-alert variant="success" v-if="organizations.length === 0 && isLoaded" show
                        >There are no organizations right now.</b-alert
                    >
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <b-list-group>
                        <b-list-group-item
                            v-for="org in organizations"
                            :to="'/organizations/id/' + org.id"
                            :key="org.id"
                        >
                            <b-row>
                                <b-col cols="4">{{ org.id }}</b-col>
                                <b-col cols="8">{{ org.name }}</b-col>
                            </b-row>
                        </b-list-group-item>
                    </b-list-group>
                </b-col>
            </b-row>
            <b-row style="margin-top: 30px">
                <b-col>
                    <b-button size="lg" variant="success" to="/organizations/create"
                        ><v-icon name="plus"></v-icon> Create Organization</b-button
                    >
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import { getOrganizations } from "../api/organizations";
import { Organization } from "../../../common/src/models/Organization";
import Vue from "vue";
import MainNavBar from "../../src/components/MainNavBar.vue";
import Component from "vue-class-component";
import DrawingNavBar from "../components/DrawingNavBar.vue";

@Component({
    components: {
        MainNavBar
    }
})
export default class Organizations extends Vue {
    organizations: Organization[] = [];
    isLoaded: boolean = false;

    mounted() {
        // fill documents
        getOrganizations().then((res) => {
            if (res.success) {
                this.organizations.splice(0, this.organizations.length, ...res.data);
                this.isLoaded = true;
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error retrieving org list"
                });
            }
        });
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
