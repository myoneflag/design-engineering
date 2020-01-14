<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container>
            <b-row>
                <b-col>
                    <b-button class="float-left" to="/organizations">Back</b-button>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <h2>View / Edit Organization</h2>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <template v-if="org">
                        <b-form>
                            <b-form-group :label-cols="2" label="ID">
                                <b-form-input v-model="org.id" disabled="true"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Full Name">
                                <b-form-input v-model="org.name"></b-form-input>
                            </b-form-group>
                        </b-form>
                        <b-button variant="success" @click="save">Save</b-button>
                    </template>
                    <b-alert v-else variant="success" show>Loading...</b-alert>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Route } from "vue-router";
import MainNavBar from "../components/MainNavBar.vue";
import { getOrganization, updateOrganization } from "../api/organizations";
import { Organization as IOrganization } from "../../../common/src/models/Organization";

@Component({
    components: { MainNavBar },
    watch: {
        $route(to, from) {
            (this as Organization).updateId(to.params.id);
        }
    }
})
export default class Organization extends Vue {
    org: IOrganization | null = null;

    updateId(id: string) {
        getOrganization(id).then((res) => {
            if (res.success) {
                this.org = res.data;
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Error retrieving data about organization",
                    variant: "danger"
                });
            }
        });
    }

    mounted() {
        this.updateId(this.$route.params.id);
    }

    save() {
        if (this.org) {
            updateOrganization(this.org.id, this.org.name).then((res) => {
                if (res.success) {
                    this.$router.push("/organizations");
                } else {
                    this.$bvToast.toast(res.message, {
                        title: "Error saving organization",
                        variant: "danger"
                    });
                }
            });
        }
    }
}
</script>
