<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container>
            <b-row>
                <b-col>
                    <b-button class="float-left" @click="back()">Back</b-button>
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
                            <b-form-group :label-cols="2" label="First Name">
                                <b-form-input v-model="user.firstname"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Last Name">
                                <b-form-input v-model="user.lastname"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Username">
                                <b-form-input v-model="editedOrSuggestedUserName"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Email">
                                <b-form-input type="email" v-model="user.email"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Password">
                                <b-form-input type="password" v-model="user.password"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Organization ID">
                                <b-form-input v-model="organization" :disabled="$route.query.orgId ? true : false"></b-form-input>
                            </b-form-group>

                            <b-button-group>
                                <b-button
                                    v-for="a in levels"
                                    @click="user.accessLevel = a.level"
                                    :disabled="a.disabled"
                                    :pressed="a.level === user.accessLevel"
                                    :variant="a.level === user.accessLevel ? 'primary' : 'info'"
                                    :key="a.name"
                                    >{{ a.name }}
                                </b-button>
                            </b-button-group>
                        </b-form>
                        <b-button variant="success" style="margin-top:50px" @click="create(false)">Create</b-button>
                        &nbsp;
                        <b-button variant="success" style="margin-top:50px" @click="create(true)">Create and New</b-button>
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
import { AccessLevel, User as IUser } from "../../../common/src/models/User";
import { createUser } from "../api/users";
import MainNavBar from "../components/MainNavBar.vue";

@Component({
    components: { MainNavBar }
})
export default class CreateUser extends Vue {

    user = {
        accessLevel: AccessLevel.USER,
        firstname: "",
        lastname: "",
        organization: null,
        password: "",
        username: "",
        email: "",
        subscribed: false,
        eulaAccepted: false,
        eulaAcceptedOn: null,
        lastActivityOn: null,
        lastNoticeSeenOn: null,
        temporaryOrganizationName: null,
        temporaryUser: false
    };

    organizationValue: string = ""
    get organization() { 
        return this.$route.query.orgId as string || this.organizationValue
    }

    set organization(value: string) { 
        this.organizationValue = value
    }

    userNameFrom(name: string): string {
        return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    }

    get editedOrSuggestedUserName(): string {
        return this.user.username || 
            ( (this.user.firstname && this.user.lastname) ? this.userNameFrom(this.user.firstname + this.user.lastname) : "" )
    }

    set editedOrSuggestedUserName(value: string) {
        this.user.username = value
        console.log("set " + value)
        console.log(this.editedOrSuggestedUserName)        
    }

    create(andNew: boolean) {
        this.user.username = this.editedOrSuggestedUserName
        this.organizationValue = this.organization
        createUser({
            username: this.user.username,
            firstname: this.user.firstname,
            lastname: this.user.lastname,
            email: this.user.email,
            password: this.user.password,
            accessLevel: this.user.accessLevel,
            organization: this.organizationValue || undefined,
            subscribed: this.user.subscribed,
        }).then((res) => {
            if (res.success) {
                if (andNew) {
                    window.location.reload()
                }
                else {
                    this.back()
                }
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Error creating user",
                    variant: "danger"
                });
            }
        });
    }

    back() {
        if (this.$route.query.orgId)
            this.$router.push("/organizations/id/" + this.$route.query.orgId)
        else
            this.$router.push("/users")
    }

    get profile(): IUser {
        return this.$store.getters["profile/profile"];
    }

    get levels() {
        if (this.profile) {
            return [
                {
                    name: "SUPERUSER",
                    level: AccessLevel.SUPERUSER,
                    disabled: this.profile.accessLevel > AccessLevel.SUPERUSER
                },
                { name: "ADMIN", level: AccessLevel.ADMIN, disabled: this.profile.accessLevel >= AccessLevel.ADMIN },
                {
                    name: "MANAGER",
                    level: AccessLevel.MANAGER,
                    disabled: this.profile.accessLevel > AccessLevel.ADMIN
                },
                { name: "USER", level: AccessLevel.USER, disabled: this.profile.accessLevel > AccessLevel.ADMIN }
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
