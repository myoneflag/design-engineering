import { AccessLevel } from "../../../common/src/models/User";
import { DocumentStatus } from "../../../common/src/models/Document";
import { DocumentStatus } from "../../../common/src/models/Document";
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
                    <b-col></b-col>
                    <b-col>
                        <b-button size="lg" variant="success" @click="createDocument"
                            ><v-icon name="plus"></v-icon> New Drawing</b-button
                        >
                    </b-col>
                        <b-col>
                            <b-checkbox
                                    v-if="profile.accessLevel <= AccessLevel.MANAGER"
                                    @change="toggleShowDeleted"
                            >
                                Show Deleted
                            </b-checkbox>
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
                    <template v-for="doc in documents">
                        <b-col sm="6" md="4" lg="3" :key="doc.id"  v-if="docVisible(doc)">
                            <b-card
                                :title="doc.metadata.title"
                                :img-src="docIcon(doc)"
                                img-alt="Image"
                                img-top
                                tag="article"
                                style="max-width: 20rem;"
                                class="mb-2 doc-tile"
                            >
                                <b-card-text>
                                    {{ doc.metadata.description }}<br />
                                    Owner: {{ doc.createdBy.username }}<br />
                                    Created: {{ new Date(doc.createdOn).toLocaleDateString() }}
                                </b-card-text>

                                <b-dropdown split :split-to="'/document/' + doc.id" variant="primary" text="Open Drawing" class="m-2" no-caret>

                                    <b-dropdown-item @click="clone(doc)">Make Copy</b-dropdown-item>
                                    <b-dropdown-item
                                            href="#"
                                            v-if="canDeleteDoc(doc)"
                                            variant="danger"
                                            @click="deleteDoc(doc)"
                                    >
                                        Delete
                                    </b-dropdown-item>

                                    <b-dropdown-item
                                            href="#"
                                            v-if="canRestoreDoc(doc)"
                                            variant="success"
                                            @click="restoreDoc(doc)"
                                    >
                                        Restore
                                    </b-dropdown-item>
                                </b-dropdown>
                            </b-card>
                        </b-col>
                    </template>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import MainNavBar from "../../src/components/MainNavBar.vue";
    import {
        canUserDeleteDocument,
        canUserRestoreDocument,
        Document,
        DocumentStatus
    } from "../../../common/src/models/Document";
    import { cloneDocument, createDocument, deleteDocument, getDocuments, restoreDocument } from "../api/document";
    import { AccessLevel, User } from "../../../common/src/models/User";
    import { assertUnreachable } from "../../../common/src/api/config";
    import Doc = Mocha.reporters.Doc;

    @Component({
    components: {
        MainNavBar
    }
})
export default class Home extends Vue {
    documents: Document[] = [];
    loaded: boolean = false;
    showDeleted: boolean = false;

    mounted() {
        this.reloadDocuments();
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    docIcon(doc: Document) {
        switch (doc.state) {
            case DocumentStatus.ACTIVE:
                return require('../assets/blueprint-architecture.png');
            case DocumentStatus.DELETED:
                return require('../assets/deleted.png');
            case DocumentStatus.PENDING:
                return require('../assets/pending.png');
            default:
                assertUnreachable(doc.state);
        }
    }

    docVisible(doc: Document) {
        switch (doc.state) {
            case DocumentStatus.ACTIVE:
                return true;
            case DocumentStatus.DELETED:
                return this.showDeleted;
            case DocumentStatus.PENDING:
                return this.profile.accessLevel <= AccessLevel.ADMIN;
            default:
                assertUnreachable(doc.state);
        }
    }

    get AccessLevel() {
        return AccessLevel;
    }

    reloadDocuments() {

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

    toggleShowDeleted() {
        this.showDeleted = !this.showDeleted;
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

    canDeleteDoc(doc: Document) {
        if (!this.profile) {
            return false;
        }

        return canUserDeleteDocument(doc, this.profile);
    }

    canRestoreDoc(doc: Document) {
        if (!this.profile) {
            return false;
        }

        return canUserRestoreDocument(doc, this.profile);
    }

    async deleteDoc(doc: Document) {
        const confirm = await this.$bvModal.msgBoxConfirm(
            'Are you sure you want to delete the document "' + doc.metadata.title + '"?',
        );
        if (confirm) {
            const res = await deleteDocument(doc.id);
            if (res.success) {
                this.reloadDocuments();
            } else {
                this.$bvToast.toast(res.message, {
                    variant: 'danger',
                    title: 'Failed to Delete Drawing',
                });
            }
        }
    }

    async restoreDoc(doc: Document) {
        const res = await restoreDocument(doc.id);
        if (res.success) {
            this.reloadDocuments();
        } else {
            this.$bvToast.toast(res.message, {
                variant: 'danger',
                title: 'Failed to Restore Drawing',
            });
        }
    }

    async clone(doc: Document) {
        if (this.profile && this.profile.organization) {
            const res = await cloneDocument(doc.id, this.profile.organization.id);
            if (res.success) {
                this.reloadDocuments();
            } else {
                this.$bvToast.toast(res.message, {
                    variant: 'danger',
                    title: 'Error Making Copy',
                });
            }
        } else {
            this.$bvToast.toast('You need to be part of an organization to store drawings', {
                variant: 'danger',
                title: 'Cannot Make Copy',
            });
        }
    }
}
</script>

<style lang="less">
    h1 {
        padding-top: 50px;
    }

    .doc-tile img {
        max-height: 150px;
    }
</style>
