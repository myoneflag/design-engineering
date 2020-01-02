<template>
    <div>
        <MainNavBar></MainNavBar>
        <b-container>
            <b-row>
                <b-col>
                    <b-button class="float-left" to="/errors">Back</b-button>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <h2>View / Edit Error</h2>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <b-form v-if="errorReport">
                        <b-form-group>
                            <b-form-group :label-cols="2" label="Username">
                                <b-form-input
                                    :value="errorReport.user ? errorReport.user.username : '(anonymous)'"
                                    :disabled="true"
                                ></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="IP Address">
                                <b-form-input v-model="errorReport.ip" :disabled="true"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="URL of User">
                                <b-form-input v-model="errorReport.url" :disabled="true"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="App Version">
                                <b-form-input v-model="errorReport.appVersion" :disabled="true"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Date and Time">
                                <b-form-input
                                    :value="new Date(errorReport.threwOn).toLocaleString()"
                                    :disabled="true"
                                ></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Error Name">
                                <b-textarea v-model="errorReport.message" :disabled="true"></b-textarea>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Error Message">
                                <b-form-input v-model="errorReport.message" :disabled="true"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="2" label="Error Stack Trace">
                                <b-textarea
                                    :value="errorReport.trace"
                                    :disabled="true"
                                    rows="10"
                                    wrap="off"
                                ></b-textarea>
                            </b-form-group>

                            <b-button-group>
                                <b-button
                                    :variant="errorReport.status === ErrorStatus.NEW ? 'danger' : 'light'"
                                    @click="errorReport.status = ErrorStatus.NEW"
                                    :pressed="errorReport.status === ErrorStatus.NEW"
                                    >New</b-button
                                >
                                <b-button
                                    :variant="errorReport.status === ErrorStatus.DOING ? 'primary' : 'light'"
                                    @click="errorReport.status = ErrorStatus.DOING"
                                    :pressed="errorReport.status === ErrorStatus.DOING"
                                    >Doing</b-button
                                >
                                <b-button
                                    :variant="errorReport.status === ErrorStatus.RESOLVED ? 'success' : 'light'"
                                    @click="errorReport.status = ErrorStatus.RESOLVED"
                                    :pressed="errorReport.status === ErrorStatus.RESOLVED"
                                    >Resolved</b-button
                                >
                                <b-button
                                    :variant="errorReport.status === ErrorStatus.HIDDEN ? 'dark' : 'light'"
                                    @click="errorReport.status = ErrorStatus.HIDDEN"
                                    :pressed="errorReport.status === ErrorStatus.HIDDEN"
                                    >Hidden</b-button
                                >
                            </b-button-group>
                        </b-form-group>

                        <b-button variant="success" @click="save">Save</b-button>
                    </b-form>
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
import { getErrorReport, updateErrorReport } from "../api/error-report";
import { ErrorReport, ErrorStatus } from "../../../backend/src/entity/Error";

@Component({
    components: { MainNavBar },
    watch: {
        $route(to, from) {
            (this as ViewError).updateId(to.params.id);
        }
    }
})
export default class ViewError extends Vue {
    errorReport: ErrorReport | null = null;

    updateId(id: string) {
        getErrorReport(Number(id)).then((res) => {
            if (res.success) {
                this.errorReport = res.data;
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Error retrieving data about error (kek)",
                    variant: "danger"
                });
            }
        });
    }

    mounted() {
        this.updateId(this.$route.params.id);
    }

    save() {
        if (this.errorReport) {
            updateErrorReport(this.errorReport.id, this.errorReport.status).then((res) => {
                if (res.success) {
                    this.$bvToast.toast("Success", {
                        title: "Updated",
                        variant: "success"
                    });
                } else {
                    this.$bvToast.toast(res.message, {
                        title: "Error saving organization",
                        variant: "danger"
                    });
                }
            });
        }
    }

    get ErrorStatus() {
        return ErrorStatus;
    }
}
</script>
