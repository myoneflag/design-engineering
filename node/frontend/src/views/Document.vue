<template>
    <div>
        <LoadingScreen v-if="isLoading" />
        <RouterView v-else></RouterView>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import DrawingNavBar from "../components/DrawingNavBar.vue";
import DrawingCanvas from "../../src/components/editor/DrawingCanvas.vue";
import { loadCatalog } from "../../src/api/catalog";
import LoadingScreen from "../../src/views/LoadingScreen.vue";
import { DocumentState } from "../../src/store/document/types";
import { closeDocument, getDocument, openDocument } from "../../src/api/document";
import { MainEventBus } from "../store/main-event-bus";
import { AccessLevel, User } from "../../../common/src/models/User";
import { Catalog } from "../../../common/src/api/catalog/types";

@Component({
    components: { LoadingScreen, DrawingCanvas, DrawingNavBar },
    props: {
        id: {
            required: true,
            type: Number,
        }
    }
})
export default class Document extends Vue {
    closeExpected = false;
    uiMouseDisabled: boolean = false;

    mounted() {
        this.$store.dispatch("document/setId", this.$props.id);
        
        openDocument(
            this.$props.id,
            (op) => {
                this.$store.dispatch("document/applyRemoteOperation", op);
            },
            () => {
                this.deleteFile();
            },
            () => {
                this.$store.dispatch("document/loaded", true);

                this.document.uiState.viewOnly = false;

                getDocument(this.$props.id).then((res) => {
                    if (res.success) {
                        res.data.shareDocument?.token  && this.$store.dispatch("document/setShareToken", res.data.shareDocument.token);
                        
                        if (
                            this.profile &&
                            res.data.createdBy.username !== this.profile.username &&
                            this.profile.accessLevel <= AccessLevel.ADMIN
                        ) {
                            this.document.uiState.viewOnly = true;
                            this.document.uiState.viewOnlyReason =
                                "Superusers view documents in View Only mode by default (click to edit)";
                        }
                    } else {
                        this.$bvToast.toast(res.message, {
                            title: "Error Getting Document Metadata",
                            variant: "Danger"
                        });
                    }
                });

                MainEventBus.$emit("drawing-loaded");
            },
            (msg) => {
                if (!this.closeExpected) {
                    this.$bvToast.toast(
                        "The connection to the server was lost, please refresh. " +
                            "Changes from now will not be saved.\n" +
                            "reason: " +
                            msg,
                        {
                            variant: "danger",
                            title: "Connection Error"
                        }
                    );

                    this.document.uiState.viewOnly = true;
                    this.document.uiState.viewOnlyReason = "Lost connection to the server - Please Refresh";
                    this.$store.dispatch("document/revert");
                }
            }
        );

        loadCatalog(this.$props.id).then((catalog) => {
            if (catalog.success) {
                this.$store.dispatch("catalog/setDefault", catalog.data);
            } else {
                this.$bvToast.toast(catalog.message, {
                    title: "Error retrieving catalog",
                    variant: "Danger"
                });
            }
        });

        MainEventBus.$on("disable-ui-mouse", this.disableUiMouse);
        MainEventBus.$on("enable-ui-mouse", this.enableUiMouse);
    }

    disableUiMouse() {
        this.uiMouseDisabled = true;
    }

    enableUiMouse() {
        this.uiMouseDisabled = false;
    }

    deleteFile() {
        window.alert("The document has been deleted");
    }

    destroyed() {
        // kill the socket
        this.closeExpected = true;
        closeDocument(this.document.documentId).then(() => {
            this.$store.dispatch("document/reset").then(() => this.$store.dispatch("document/loaded", false));
        });

        MainEventBus.$off("disable-ui-mouse", this.disableUiMouse);
        MainEventBus.$off("enable-ui-mouse", this.enableUiMouse);
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get catalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get catalogLoaded(): boolean {
        return this.$store.getters["catalog/loaded"];
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get isLoading() {
        return !this.catalogLoaded || !this.document.uiState.loaded;
    }
}
/*

     */
</script>

<style>
.disableMouseEvents {
    pointer-events: none;
}
</style>
