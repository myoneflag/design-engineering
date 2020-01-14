<template>
    <div>
        <MainNavBar></MainNavBar>
        <div style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 70px)">
            <b-container class="home">
                <b-row>
                    <b-col>
                        <h1 class="title">
                            Your Drawings
                        </h1>
                    </b-col>
                </b-row>
                <b-row style="margin-bottom: 30px">
                    <b-col>
                        <b-button size="lg" variant="success" @click="createDocument"
                            ><v-icon name="plus"></v-icon> New Drawing</b-button
                        >
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-alert variant="success" v-if="documents.length === 0 && loaded" show
                            >You don't have any documents right now.</b-alert
                        >
                    </b-col>
                </b-row>
                <b-row>
                    <b-col sm="6" md="4" lg="3" v-for="doc in documents" :key="doc.id">
                        <b-card
                            :title="doc.metadata.title"
                            img-src="https://conversionxl.com/wp-content/uploads/2013/03/blueprint-architecture.png"
                            img-alt="Image"
                            img-top
                            tag="article"
                            style="max-width: 20rem;"
                            class="mb-2"
                        >
                            <b-card-text>
                                {{ doc.metadata.description }}<br />
                                Owner: {{ doc.createdBy.username }}<br />
                                Created: {{ new Date(doc.createdOn).toLocaleDateString() }}
                            </b-card-text>

                            <b-button :to="'/document/' + doc.id" variant="primary">Open Drawing</b-button>
                        </b-card>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import MainNavBar from "../../src/components/MainNavBar.vue";
import { State, Action, Getter } from "vuex-class";
import { DocumentState } from "../../src/store/document/types";
import { Document } from "../../../common/src/models/Document";
import { createDocument, getDocuments } from "../api/document";
import { User } from "../../../common/src/models/User";

@Component({
    components: {
        MainNavBar
    }
})
export default class Home extends Vue {
    documents: Document[] = [];
    loaded: boolean = false;

    mounted() {
        // fill documents
        getDocuments().then((res) => {
            if (res.success) {
                this.documents.splice(0, this.documents.length, ...res.data);
                this.loaded = true;
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error retrieving document list"
                });
            }
        });
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    createDocument() {
        if (this.profile.organization) {
            createDocument(this.profile.organization.id).then((res) => {
                if (res.success) {
                    this.$router.push("/document/" + res.data.id);
                } else {
                    this.$bvToast.toast(res.message, {
                        variant: "danger",
                        title: "Error creating new document"
                    });
                }
            });
        } else {
            this.$bvToast.toast("You need to belong to an organization to create a document", {
                variant: "danger",
                title: "Error creating new document"
            });
        }
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
