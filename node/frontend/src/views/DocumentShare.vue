<template>
    <div>
        <template v-if="isLoading">
             <LoadingScreen />
        </template>
       
        <template v-else>
            <drawing-canvas />
        </template>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { AccessLevel, User } from "../../../common/src/models/User";
import { Document } from "../../../common/src/models/Document";
import { APIResult, Success, Failure } from "../../../common/src/api/document/types";
import { openDocument, closeDocument, getDocument } from "../api/document";
import { loadCatalog } from "../api/catalog";
import { MainEventBus } from "../store/main-event-bus";
import { DocumentState } from "../store/document/types";
import MainNavBar from "../../src/components/MainNavBar.vue";
import LoadingScreen from "../../src/views/LoadingScreen.vue";
import DrawingCanvas from "../../src/components/editor/DrawingCanvas.vue";
import { Catalog } from "../../../common/src/api/catalog/types";

@Component({
    components: {
        MainNavBar,
        LoadingScreen,
        DrawingCanvas,
    }
})
export default class DocumentShare extends Vue {
    closeExpected = false;

    uiMouseDisabled: boolean = false;

    mounted() {
        this.$store.dispatch("document/setId", Number(this.$route.params.documentSharedId));
        openDocument(
            Number(this.$route.params.documentSharedId),
            (op) => {
                this.$store.dispatch("document/applyRemoteOperation", op);
            },
            () => {
                this.deleteFile();
            },
            () => {
                this.$store.dispatch("document/loaded", true);

                this.document.uiState.viewOnly = false;

                getDocument(Number(this.$route.params.documentSharedId)).then((res) => {
                    if (res.success) {
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

        loadCatalog(Number(this.$route.params.documentSharedId)).then((catalog) => {
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
</script>

<style lang="less" scoped>
    #loading-wrapper {
        max-width: 600px;
        position: absolute;
        transform: translate(-50%, -50%);
        left: 50%;
        top: 50%;
        padding: 20px;
    }
</style>
