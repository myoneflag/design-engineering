import {AccessLevel} from "../../../backend/src/entity/User"; import {AccessLevel} from
"../../../backend/src/entity/User"; import {AccessLevel} from "../../../backend/src/entity/User";
<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container>
            <b-row>
                <b-col>
                    <h2>Sign Up</h2>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <template v-if="user">
                        <b-form>
                            <b-form-group :label-cols="2" label="Username">
                                <b-form-input v-model="user.username"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Email">
                                <b-form-input required="false" type="email" v-model="user.email"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Organization Name or Organization ID">
                                <b-form-input v-model="organization"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Password">
                                <b-form-input type="password" v-model="password"></b-form-input>
                            </b-form-group>
                        </b-form>
                        <b-button variant="success" style="margin-top:50px" @click="create">Sign Up for Greatness!</b-button>
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
import { AccessLevel, User as IUser } from "../../../common/src/models/User";
import { signUp } from "../api/users";
import { login } from "../../src/api/logins";

@Component({
    components: { MainNavBar }
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
        eulaAccepted: false,
        eulaAcceptedOn: null,
        lastActivityOn: null,
        lastNoticeSeenOn: null,
        temporaryOrganizationName: null,
        temporaryUser: true,
    };

    organization: string = "";
    password: string = "";

    create() {
        signUp(
            this.user.username,
            this.user.name,
            this.user.email || undefined,
            this.password,
            this.organization || undefined
        ).then((res) => {
            if (res.success) {
                login(this.user.username, this.password).then((logres) => {
                    if (logres.success === true) {
                        this.$store.dispatch("profile/setProfile", null);
                        (this as any).$cookies.set("session-id", logres.data);
                        if (this.$route.query.next) {
                            this.$router.push(this.$route.query.to as string);
                        } else {
                            this.$router.push("/");
                        }
                    } else {
                        this.$bvToast.toast(logres.message, {
                            title: "Login Error",
                            variant: "danger"
                        });
                    }
                });

                // this.$router.push("/users");
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Error creating user",
                    variant: "danger"
                });
            }
        });
    }

    get profile(): IUser {
        return this.$store.getters["profile/profile"];
    }
}
</script>
