import {AccessLevel} from "../../../backend/src/entity/User";
import {AccessLevel} from "../../../backend/src/entity/User";
import {AccessLevel} from "../../../backend/src/entity/User";
<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container>
            <b-row>
                <b-col>
                    <b-button class="float-left" to="/users">Back</b-button>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <h2>Create User</h2>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <template v-if="user">
                        <b-form>

                            <b-form-group
                                    :label-cols="2"
                                    label="Username"
                            >
                                <b-form-input v-model="user.username"></b-form-input>
                            </b-form-group>

                            <b-form-group
                                    :label-cols="2"
                                    label="Full Name"
                            >
                                <b-form-input v-model="user.name"></b-form-input>
                            </b-form-group>

                            <b-form-group
                                    :label-cols="2"
                                    label="Email"
                            >
                                <b-form-input required="false" type="email" v-model="user.email"></b-form-input>
                            </b-form-group>


                            <b-form-group
                                    :label-cols="3"
                                    label="Subscribe"
                            >
                                <b-form-checkbox v-model="user.subscribed">Subscribe to "Contact Us" messages?</b-form-checkbox>
                            </b-form-group>

                            <b-form-group
                                    :label-cols="2"
                                    label="Organization ID"
                            >
                                <b-form-input v-model="organization"></b-form-input>
                            </b-form-group>

                            <b-form-group
                                    :label-cols="2"
                                    label="Password"
                            >
                                <b-form-input type="password" v-model="password"></b-form-input>
                            </b-form-group>
                            <b-button-group>
                                <b-button
                                        v-for="a in levels"
                                        @click="user.accessLevel = a.level"
                                        :disabled="a.disabled"
                                        :pressed="a.level === user.accessLevel"
                                        :variant="a.level === user.accessLevel ? 'primary' : 'info'"
                                >{{ a.name }}
                                </b-button>
                            </b-button-group>
                        </b-form>
                        <b-button variant="success" style="margin-top:50px" @click="create">Create</b-button>
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
    import MainNavBar from "../components/MainNavBar.vue";
    import {AccessLevel, User as IUser} from '../../../backend/src/entity/User';
    import {createUser} from "../api/users";

    @Component({
        components: {MainNavBar},
    })
    export default class CreateUser extends Vue {
        user: IUser = {
            accessLevel: AccessLevel.USER,
            name: "",
            organization: null,
            passwordHash: "",
            username: "",
            email: "",
            subscribed: false,
        };

        organization: string = "";
        password: string = "";

        create() {
            createUser(this.user.username, this.user.name, this.user.email || undefined, this.user.subscribed, this.password, this.user.accessLevel, this.organization || undefined).then((res) => {
                if (res.success) {
                    this.$router.push('/users');
                } else {
                    this.$bvToast.toast(res.message, {
                        title: 'Error creating user',
                        variant: 'danger',
                    });
                }
            })
        }

        get profile(): IUser {
            return this.$store.getters['profile/profile'];
        }

        get levels() {
            if (this.profile) {
                return [
                    {
                        name: "SUPERUSER",
                        level: AccessLevel.SUPERUSER,
                        disabled: this.profile.accessLevel > AccessLevel.SUPERUSER
                    },
                    {name: "ADMIN", level: AccessLevel.ADMIN, disabled: this.profile.accessLevel >= AccessLevel.ADMIN},
                    {
                        name: "MANAGER",
                        level: AccessLevel.MANAGER,
                        disabled: this.profile.accessLevel > AccessLevel.ADMIN
                    },
                    {name: "USER", level: AccessLevel.USER, disabled: this.profile.accessLevel > AccessLevel.ADMIN},
                ];
            } else {
                return [];
            }
        }

        get AccessLevel() {
            return AccessLevel;
        }
    }
</script>
