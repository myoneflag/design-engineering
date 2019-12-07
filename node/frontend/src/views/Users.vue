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
                    <b-alert variant="success"  v-if="users.length === 0 && isLoaded" show>There are no organizations right now. Wait what? Then WHO ARE YOU.</b-alert>
                </b-col>
            </b-row>
            <b-row>
                <b-col>

                    <b-list-group>
                        <b-list-group-item v-for="user in users" :to="'/users/username/' + user.username" :key="user.username">
                            <b-row>
                                <b-col cols="3">{{ user.username }}</b-col>
                                <b-col cols="3">{{ user.name }}</b-col>
                                <b-col cols="3">{{ ['SUPERUSER', 'ADMIN', 'MANAGER', 'USER'][user.accessLevel]}}</b-col>
                                <b-col cols="3">{{ user.organization ? user.organization.id : "<no org>" }}</b-col>
                            </b-row>
                        </b-list-group-item>
                    </b-list-group>
                </b-col>
            </b-row>
            <b-row style="margin-top: 30px">

                <b-col>
                    <b-button size="lg" variant="success" to="/users/create"><v-icon name="plus"></v-icon> Create User</b-button>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
    import {Component} from "vue-property-decorator";
    import Vue from 'vue';
    import {User} from "../../../backend/src/entity/User";
    import {getUsers} from "../api/users";
    import MainNavBar from "../../src/components/MainNavBar.vue";
    import DrawingNavBar from "../components/DrawingNavBar.vue";

    @Component({
        components: {
            MainNavBar,
        },
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
                        variant: 'danger',
                        title: 'Error retrieving user list',
                    });
                }
            })
        }
    }
</script>

<style lang="less">
    h1 {
        padding-top: 50px;
    }
</style>
