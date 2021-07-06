<template>
    <div>
        <MainNavBar :profile="profile"></MainNavBar>
        <div style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 70px)" :class="[ (profile && !profile.email_verified_at) && 'isEmailVerification']">
            <LocaleSelector/>
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
                        <b-checkbox v-if="(profile ? profile.accessLevel <= AccessLevel.MANAGER : false)" @change="toggleShowDeleted">
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
                    <b-col>
                        <b-modal id="modal-1" scrollable title="What's New" v-if="compiledChangeLogs.length >= 0" size="lg" @hidden="changeLogModalHidden">
                            <b-card v-for="log in compiledChangeLogs" :key="log.id">
                                <b-card-text style="text-align: left;">
                                    <b>Version:</b> {{ log.version }}<br />
                                    <span style="white-space: pre-wrap">{{ log.message }}</span> <br /><br />
                                    {{ new Date(log.createdOn).toLocaleString() }}<br />
                                    <b>Submitted by:</b> {{ log.submittedBy.username }}<br />
                                    <b-badge pill variant="primary" v-for="badge in log.tags.split(',')" :key="badge">{{ badge }}</b-badge>
                                </b-card-text>
                            </b-card>
                        </b-modal>
                    </b-col>
                </b-row>
                <b-row>
                    <template v-for="doc in documents">
                        <b-col sm="6" md="4" lg="3" :key="doc.id" v-if="docVisible(doc)">
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
                                    <template v-if="doc.metadata.description">{{ doc.metadata.description }}</template>

                                    <table style="text-align: left; font-size: 14px">
                                        <tr>
                                            <td>Owner:</td>
                                            <td>{{ doc.createdBy.username }}</td>
                                        </tr>
                                        <tr>
                                            <td>Created:</td>
                                            <td>{{ new Date(doc.createdOn).toLocaleDateString(locale) }}</td>
                                        </tr>
                                        <template v-if="shouldShowCompany() && doc.organization"
                                            ><tr>
                                                <td>Company:</td>
                                                <td>{{ doc.organization.name }}</td>
                                            </tr></template
                                        >
                                        <template v-if="doc.lastModifiedBy"
                                            ><tr>
                                                <td>Modified By:</td>
                                                <td>{{ doc.lastModifiedBy.username }}</td>
                                            </tr></template
                                        >
                                        <template v-if="doc.lastModifiedOn"
                                            ><tr>
                                                <td>Modified On:</td>
                                                <td>{{ new Date(doc.lastModifiedOn).toLocaleDateString(locale) }}</td>
                                            </tr></template
                                        >
                                    </table>
                                </b-card-text>

                                <b-dropdown
                                    split
                                    :split-to="'/document/' + doc.id"
                                    variant="primary"
                                    text="Open Drawing"
                                    class="m-2"
                                    no-caret
                                >
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
        <Onboarding :screen="onboardingScreen"></Onboarding>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
    canUserDeleteDocument,
    canUserRestoreDocument,
    Document,
    DocumentStatus
} from "../../../common/src/models/Document";
import { cloneDocument, createDocument, deleteDocument, getDocuments, restoreDocument } from "../api/document";
import { getChangeLogMessages, saveChangeLogMessage } from "../api/change-log";
import { updateLastNoticeSeen } from "../api/users";
import { AccessLevel, User } from "../../../common/src/models/User";
import { assertUnreachable, CURRENT_VERSION } from "../../../common/src/api/config";
import { ChangeLogMessage } from "../../../common/src/models/ChangeLogMessage";
import { ONBOARDING_SCREEN } from "../store/onboarding/types";
import MainNavBar from "../../src/components/MainNavBar.vue";
import Onboarding from "../../src/components/Onboarding.vue";
import LocaleSelector from "../components/LocaleSelector.vue";
import { SupportedLocales } from "../../../common/src/api/locale";

@Component({
    components: {
        LocaleSelector,
        MainNavBar, Onboarding
    }
})
export default class Home extends Vue {
    documents: Document[] = [];
    loaded: boolean = false;
    showDeleted: boolean = false;
    hasNewChangeLogs: boolean = true;
    compiledChangeLogs: ChangeLogMessage[] = [];

    mounted() {
        this.reloadDocuments();
        this.getChangeLogs();
    }

    get onboardingScreen() {
        return ONBOARDING_SCREEN.HOME;
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get locale(): SupportedLocales {
        return this.$store.getters["profile/locale"];
    }

    docIcon(doc: Document) {
        switch (doc.state) {
            case DocumentStatus.ACTIVE:
                if (doc.version !== CURRENT_VERSION) {
                    return require("../assets/pending.png");
                } else {
                    return require("../assets/blueprint-architecture.png");
                }
            case DocumentStatus.DELETED:
                return require("../assets/deleted.png");
            case DocumentStatus.PENDING:
                return require("../assets/pending.png");
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

    shouldShowCompany() {
        return this.profile ? this.profile.accessLevel <= AccessLevel.ADMIN : false;
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
            createDocument(this.profile.organization.id, this.locale).then((res) => {
                if (res.success) {
                    this.$router.push("/document/" + res.data.id);
                } else {
                    this.$bvToast.toast(res.message, {
                        variant: "danger",
                        title: "Error creating new document"
                    });
                }


                this.$store.dispatch('profile/refreshOnBoardingStats');
            });
        } else if (this.profile.temporaryUser) {
            createDocument(null, this.locale).then((res) => {
                if (res.success) {
                    this.$router.push("/document/" + res.data.id);
                } else {
                    this.$bvToast.toast(res.message, {
                        variant: "danger",
                        title: "Error creating new document"
                    });
                }


                this.$store.dispatch('profile/refreshOnBoardingStats');
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
            'Are you sure you want to delete the document "' + doc.metadata.title + '"?'
        );
        if (confirm) {
            const res = await deleteDocument(doc.id);
            if (res.success) {
                this.reloadDocuments();
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Failed to Delete Drawing"
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
                variant: "danger",
                title: "Failed to Restore Drawing"
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
                    variant: "danger",
                    title: "Error Making Copy"
                });
            }
        } else {
            this.$bvToast.toast("You need to be part of an organization to store drawings", {
                variant: "danger",
                title: "Cannot Make Copy"
            });
        }
    }

    async getChangeLogs() {
        const res = await getChangeLogMessages(this.profile.lastNoticeSeenOn);
        if (res.success && res.data.length > 0) {
            this.hasNewChangeLogs = true;
            this.compiledChangeLogs = res.data;
            this.$bvModal.show('modal-1');
            setTimeout(() => {
                updateLastNoticeSeen();
                this.profile.lastNoticeSeenOn = new Date();
            }, 10000); // wait for client to update before claiming that it was updated.
        }
    }

    changeLogModalHidden() {
        updateLastNoticeSeen();
        this.profile.lastNoticeSeenOn = new Date();
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

.isEmailVerification {
    height: calc(100vh - 102px) !important;
}
</style>
