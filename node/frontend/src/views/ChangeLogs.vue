<template>
    <div>
        <MainNavBar></MainNavBar>
        <div class="home" style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 70px)">
            <b-container>
                <b-row>
                    <b-col>
                        <h1 class="title">
                            Change Logs: see, add.
                        </h1>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-form @submit="onSubmit" >
                            <!-- <label for="tags-basic">Type tags for the new update and press enter</label> -->
                            <b-form-group
                                id="input-group-1"
                                label="Version:"
                                label-for="t1"
                            >
                                <b-form-input
                                id="t1" size="sm" v-model="version" placeholder="version(s) this update message is relevant to.">
                                </b-form-input>
                            </b-form-group>

                            <b-form-group
                                id="input-group-2"
                                label="Tags:"
                                label-for="t2"
                            >
                                <b-form-input
                                    id="t2" size="sm" v-model="tags" placeholder="tags of the features relevant for this update message.">
                                </b-form-input>
                            </b-form-group>

                            <b-form-group
                                id="input-group-3"
                                label="Message:"
                                label-for="t3"
                            >
                                <b-form-textarea
                                    id="t3" v-model="message" placeholder="the message for this update" rows="15">
                                </b-form-textarea>
                            </b-form-group>
                            <b-button type="submit" variant="primary">Submit</b-button>
                        </b-form>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-alert variant="success" v-if="logMessages.length === 0 && isLoaded" show
                            >There are no change log messages right now</b-alert
                        >
                    </b-col>
                </b-row>
                <b-row v-for="log in logMessages" :key="log.id">
                    <b-col>
                        <b-card>
                            <b-card-text style="text-align: left">
                                <b>Tags:</b> {{ log.tags }}<br />
                                <b>Date:</b> {{ new Date(log.createdOn).toLocaleString() }}<br />
                                <b>Version:</b> {{ log.version }}<br />
                                <b>Submitted by:</b> {{ log.submittedBy }}<br />
                                <b>Message:</b> {{ log.message }}
                            </b-card-text>
                        </b-card>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import Vue from "vue";
import { User } from "../../../common/src/models/User";
import { getUsers, updateUser } from "../api/users";
import MainNavBar from "../../src/components/MainNavBar.vue";
import DrawingNavBar from "../components/DrawingNavBar.vue";
import { ChangeLogMessage } from "../../../common/src/models/ChangeLogMessage";
import { getChangeLogMessages, saveChangeLogMessage } from "../api/change-log";

@Component({
    components: {
        MainNavBar
    }
})
export default class ChangeLogs extends Vue {
    logMessages: ChangeLogMessage[] = [];
    isLoaded: boolean = false;
    value: string = "";
    version: string = "";
    tags: string = "";
    submittedBy: string = "";
    message: string = "";

    onSubmit(){
        const res = saveChangeLogMessage(this.message, this.tags, this.version);
    }

    mounted() {
        // get all change log messages
        getChangeLogMessages(null).then((res) => {
            if (res.success) {
                this.logMessages.splice(0, this.logMessages.length, ...res.data);
                this.isLoaded = true;
            }
        });
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
