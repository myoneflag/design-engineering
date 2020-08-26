<template>
    <div style="height: 100%">
        <MainNavBar></MainNavBar>
        <div style="overflow: auto; max-height: calc(100% - 61px);">
            <b-container class="home">
                <b-row>
                    <b-col cols="12">
                        <h1 class="title">Users</h1>
                    </b-col>
                    <b-col cols="12" v-if="isSuperuser">
                        <b-card 
                            border-variant="info"
                            title="Active Users Graph" 
                            style="text-align: initial;"
                            class="mb-5 mt-5"

                        >   
                            <div id="date-container">
                                <b-form-datepicker
                                    id="active-from"
                                    v-model="reactiveDate.activeFrom"
                                    placeholder="From"
                                    hide-header
                                    reset-button
                                    today-button
                                    :reset-value="date.activeFrom"
                                    :date-format-options="{ year: 'numeric', month: 'short', day: '2-digit' }"
                                ></b-form-datepicker>
                                <b-form-datepicker
                                    id="active-to"
                                    v-model="reactiveDate.activeTo"
                                    class="ml-2" 
                                    placeholder="To"
                                    hide-header
                                    reset-button
                                    today-button
                                    :reset-value="date.activeTo"
                                    :date-format-options="{ year: 'numeric', month: 'short', day: '2-digit' }"
                                ></b-form-datepicker>
                            </div>
                            <BarChart v-if="isChartLoaded" :chartData="chartData" class="mt-4"></BarChart>
                        </b-card>
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
                <b-row style="margin-top: 30px; margin-bottom: 30px;" v-if="profile && profile.accessLevel <= AccessLevel.ADMIN">
                    <b-col>
                        <b-button size="lg" variant="success" to="/users/create"
                            ><v-icon name="plus"></v-icon>
                            Create User
                        </b-button>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { AccessLevel, User } from "../../../common/src/models/User";
import { getUsers, activeUsers } from "../api/users";
import MainNavBar from "../../src/components/MainNavBar.vue";
import BarChart from "../../src/components/chartjs/Bar.vue";
import { cloneSimple } from "../../../common/src/lib/utils";

interface DateProps {
    activeFrom: null | Date | string;
    activeTo: null | Date | string;
}

@Component({
    components: {
        MainNavBar,
        BarChart,
    }
})
export default class Users extends Vue {
    users: User[] = [];
    isLoaded: boolean = false;
    isChartLoaded: boolean = false;
    date: DateProps = {
        activeFrom: null,
        activeTo: null,
    };
    reactiveDate: DateProps = {
        activeFrom: null,
        activeTo: null,
    };
    chartData = {
        labels: [],
        datasets: [{
            label: 'Users',
            data: [],
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
        }],
    };

    created() {
        var d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setHours(0, 0, 0);
        d.setMilliseconds(0);

        this.date.activeFrom = this.reactiveDate.activeFrom = d;
        this.date.activeTo = this.reactiveDate.activeTo = new Date();
    }

    async mounted() {
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

    @Watch('reactiveDate', { immediate: true, deep: true })
    onChangeDate(value: {activeFrom: Date, activeTo: Date}, oldValue: {activeFrom: Date, activeTo: Date}) {
        this.handleActiveUserRequest(value);
    }

    get usersRendered() {
        return this.users.map((u) => {
            return {
                username: u.username,
                fullName: u.name + (u.lastname && ` ${u.lastname}` || ""),
                accessLevel: ["SUPERUSER", "ADMIN", "MANAGER", "USER"][u.accessLevel],
                organization: u.organization ? u.organization.name : "",
                lastActivityOn: u.lastActivityOn ? new Date(u.lastActivityOn).toLocaleString() : ""
            };
        });
    }

    get profile(): User {
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

    get isSuperuser() {
        return this.profile.accessLevel === AccessLevel.SUPERUSER;
    }

    userRowClicked(row: any) {
        this.$router.push({ name: "user", params: { id: row.username } });
    }

    handleActiveUserRequest(props?: {activeFrom: Date, activeTo: Date}) {
        this.isChartLoaded = false;

        activeUsers(props).then(res => {
            if (res.success) {
                let labels = [], data = [];

                for (var i = 0; i < res.data.length; i++) {
                    labels.push(res.data[i].date);
                    data.push(Number(res.data[i].total_active));
                }

                this.$set(this.chartData, 'labels', labels);
                this.$set(this.chartData.datasets[0], 'data', data);
            }

            this.isChartLoaded = true;
        });
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
#date-container {
    display: flex;
    width: 500px;
    margin-left: auto;
    margin-top: -44px;
    justify-content: space-between;
}
</style>
