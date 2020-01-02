import {AccessLevel} from "../../../backend/src/entity/User"; import {AccessLevel} from
"../../../backend/src/entity/User";
<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container>
            <b-row>
                <b-col>
                    <b-button class="float-left" :to="backlink">Back</b-button>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <h2>View / Edit Profile</h2>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <template v-if="user">
                        <b-form>
                            <b-form-group :label-cols="2" label="Username" :disabled="true">
                                <b-form-input v-model="user.username"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Full Name">
                                <b-form-input v-model="user.name"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Email">
                                <b-form-input :required="false" type="email" v-model="user.email"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="3" label="Subscribe">
                                <b-form-checkbox v-model="user.subscribed">
                                    Subscribe to "Contact Us" messages?
                                </b-form-checkbox>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Organization ID">
                                <b-form-input
                                    v-model="organization"
                                    :disabled="!profile || profile.accessLevel >= AccessLevel.MANAGER"
                                ></b-form-input>
                            </b-form-group>
                            <b-button-group>
                                <b-button
                                    v-for="a in levels"
                                    @click="user.accessLevel = a.level"
                                    :disabled="a.disabled"
                                    :pressed="a.level === user.accessLevel"
                                    :variant="a.level === user.accessLevel ? 'primary' : 'info'"
                                    >{{ a.name }}</b-button
                                >
                            </b-button-group>
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
import MainNavBar from "../components/MainNavBar.vue";
import { AccessLevel, User as IUser } from "../../../backend/src/entity/User";
import { getUser, updateUser } from "../api/users";

@Component({
    components: { MainNavBar },
    watch: {
        $route(to, from) {
            (this as User).updateUsername(to.params.username);
        }
    }
})
export default class User extends Vue {
    user: IUser | null = null;

    organization: string | null = null;

    updateUsername(username: string) {
        getUser(username).then((res) => {
            if (res.success) {
                this.user = res.data;
                this.organization = null;
                if (res.data.organization) {
                    this.organization = res.data.organization.id;
                }
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Error retrieving user data",
                    variant: "danger"
                });
            }
        });
    }

    mounted() {
        this.updateUsername(this.$route.params.id);
    }

    save() {
        if (this.user) {
            updateUser(
                this.user.username,
                this.user.name,
                this.user.email || undefined,
                this.user.subscribed,
                this.user.accessLevel,
                this.organization || undefined
            ).then((res) => {
                if (res.success) {
                    this.$router.push(this.backlink);

                    if (this.user!.username === this.profile.username) {
                        this.$store.dispatch("profile/setProfile", res.data);
                    }
                } else {
                    this.$bvToast.toast(res.message, {
                        title: "Error saving organization",
                        variant: "danger"
                    });
                }
            });
        }
    }

    get profile(): IUser {
        return this.$store.getters["profile/profile"];
    }

    get editingMyself(): boolean {
        return this.profile != null && this.user != null && this.profile.username === this.user.username;
    }

    get levels() {
        if (this.profile) {
            if (this.profile.accessLevel <= AccessLevel.ADMIN) {
                return [
                    {
                        name: "SUPERUSER",
                        level: AccessLevel.SUPERUSER,
                        disabled: this.profile.accessLevel > AccessLevel.SUPERUSER || this.editingMyself
                    },
                    {
                        name: "ADMIN",
                        level: AccessLevel.ADMIN,
                        disabled: this.profile.accessLevel >= AccessLevel.ADMIN || this.editingMyself
                    },
                    {
                        name: "MANAGER",
                        level: AccessLevel.MANAGER,
                        disabled: this.profile.accessLevel > AccessLevel.ADMIN || this.editingMyself
                    },
                    {
                        name: "USER",
                        level: AccessLevel.USER,
                        disabled: this.profile.accessLevel > AccessLevel.ADMIN || this.editingMyself
                    }
                ];
            } else {
                return [
                    {
                        name: "MANAGER",
                        level: AccessLevel.MANAGER,
                        disabled: this.profile.accessLevel > AccessLevel.ADMIN || this.editingMyself
                    },
                    {
                        name: "USER",
                        level: AccessLevel.USER,
                        disabled: this.profile.accessLevel > AccessLevel.ADMIN || this.editingMyself
                    }
                ];
            }
        } else {
            return [];
        }
    }

    get AccessLevel() {
        return AccessLevel;
    }

    get backlink() {
        if (!this.profile || this.profile.accessLevel >= AccessLevel.USER) {
            return "/";
        } else {
            return "/users";
        }
    }
}
</script>
