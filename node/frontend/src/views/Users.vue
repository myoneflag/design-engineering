<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container class="home">
            <b-row>
                <b-col>
                    <h1 class="title">
                        Users
                    </h1>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <b-alert variant="success" v-if="users.length === 0 && isLoaded" show>
                        There are no organizations right now. Wait what? Then WHO ARE YOU.
                    </b-alert>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <b-table
                        style="background-color: white"
                        :items="usersRendered"
                        :fields="fields"
                        @row-clicked="userRowClicked"
                        selectable
                    ></b-table>
                </b-col>
            </b-row>
            <b-row style="margin-top: 30px" v-if="profile && profile.accessLevel <= AccessLevel.ADMIN">
                <b-col>
                    <b-button size="lg" variant="success" to="/users/create"
                        ><v-icon name="plus"></v-icon>
                        Create User
                    </b-button>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import Vue from "vue";
import { AccessLevel, User } from "../../../common/src/models/User";
import { getUsers } from "../api/users";
import MainNavBar from "../../src/components/MainNavBar.vue";

@Component({
    components: {
        MainNavBar
    }
})
export default class Users extends Vue {
    users: User[] = [];
    isLoaded: boolean = false;

    mounted() {
        // fill documents
        getUsers().then((res) => {
            if (res.success) {
                this.users.splice(0, this.users.length, ...res.data);
                this.isLoaded = true;
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error retrieving user list"
                });
            }
        });
    }

    get usersRendered() {
        return this.users.map((u) => {
            return {
                username: u.username,
                fullName: u.firstname ? u.firstname + " " + u.lastname : u.name,
                accessLevel: ["SUPERUSER", "ADMIN", "MANAGER", "USER"][u.accessLevel],
                organization: u.organization ? u.organization.name : "",
                lastActivityOn: u.lastActivityOn ? new Date(u.lastActivityOn).toLocaleString() : ""
            };
        });
    }

    get profile(): User | null {
        return this.$store.getters["profile/profile"];
    }

    get fields() {
        const f = [
            { key: "username", sortable: true },
            { key: "fullName", sortable: true },
            { key: "accessLevel", sortable: true },
            { key: "organization", sortable: true }
        ];
        if (this.profile && this.profile.accessLevel <= AccessLevel.ADMIN) {
            f.push({ key: "lastActivityOn", sortable: true });
        }
        return f;
    }

    get AccessLevel() {
        return AccessLevel;
    }

    userRowClicked(row: any) {
        this.$router.push({ name: "user", params: { id: row.username } });
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
