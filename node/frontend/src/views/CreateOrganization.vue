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
                    <h2>Create Organization</h2>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <template v-if="org">
                        <b-form>

                            <b-form-group
                                    :label-cols="2"
                                    label="ID"
                            >
                                <b-form-input v-model="org.id"></b-form-input>
                            </b-form-group>

                            <b-form-group
                                    :label-cols="2"
                                    label="Full Name"
                            >
                                <b-form-input v-model="org.name"></b-form-input>
                            </b-form-group>
                        </b-form>
                        <b-button variant="success" @click="create">Create</b-button>
                    </template>
                    <b-alert v-else variant="success" show>Loading...</b-alert>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";
    import {Route} from "vue-router";
    import MainNavBar from "../components/MainNavBar.vue";
    import {createOrganization, getOrganization} from "../api/organizations";
    import {Organization as IOrganization} from '../../../backend/src/entity/Organization';

    @Component({
        components: {MainNavBar},
    })
    export default class CreateOrganization extends Vue {
        org: IOrganization = {
            id: "",
            name: "",
        };

        create() {
            createOrganization(this.org.id, this.org.name).then((res) => {
                if (res.success) {
                    this.$router.push('/organizations');
                } else {
                    this.$bvToast.toast(res.message, {
                        title: 'Error creating organization',
                        variant: 'danger',
                    });
                }
            })
        }
    }
</script>
