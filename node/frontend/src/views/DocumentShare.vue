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
import Vue from "vue";
import Component from "vue-class-component";
import { closeDocument, openDocumentShare } from "../api/document";
import { loadCatalogShare } from "../api/catalog";
import { MainEventBus } from "../store/main-event-bus";
import { DocumentState } from "../store/document/types";
import DrawingCanvas from "../../src/components/editor/DrawingCanvas.vue";
import LoadingScreen from "../../src/views/LoadingScreen.vue";
import { customEntityShareData } from "../api/custom-entity";
import { EntityType } from "../../../common/src/api/document/entities/types";

@Component({
    components: {
        LoadingScreen,
        DrawingCanvas,
    },
    props: {
        documentSharedId: {
            required: true,
            type: String,
        }
    }
})
export default class DocumentShare extends Vue {
    closeExpected: boolean = false;
    uiMouseDisabled: boolean = false;

    mounted() {
        openDocumentShare(
            this.$props.documentSharedId,
            (op) => {
                this.$store.dispatch("document/setIsLoading", true);
                setTimeout(() => this.$store.dispatch("document/applyRemoteOperation", op), 2000);
            },
            () => {
                this.$bvToast.toast('The document has been deleted', {
                    title: "Error!",
                    variant: "danger"
                });
            },
            () => {
                MainEventBus.$emit("drawing-loaded");
            },
            (msg) => {
                if (!this.closeExpected) {
                    this.$bvToast.toast(
                        "The connection to the server was lost, please refresh. " +
                        "Changes from now will not be saved.\n" +
                        "reason: " + msg,
                        {
                            title: "Connection Error",
                            variant: "danger",
                        }
                    );
                }
            },
        );

        loadCatalogShare(this.$props.documentSharedId).then((catalog) => {
            if (catalog.success) {
                this.$store.dispatch("catalog/setDefault", catalog.data);
            } else {
                this.$bvToast.toast(catalog.message, {
                    title: "Error retrieving catalog",
                    variant: "danger",
                });
            }
        });

        customEntityShareData({id: this.$props.documentSharedId, type: EntityType.LOAD_NODE}).then(res => {
            if (res.success) {
                this.$store.dispatch("customEntity/setNodes", res.data);
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Error retrieving nodes",
                    variant: "Danger"
                });
            }
        });

        MainEventBus.$on("disable-ui-mouse", this.disableUiMouse);
        MainEventBus.$on("enable-ui-mouse", this.enableUiMouse);
    }

    destroyed() {
        // kill the socket
        this.closeExpected = true;
        closeDocument(this.$props.documentSharedId);

        MainEventBus.$off("disable-ui-mouse", this.disableUiMouse);
        MainEventBus.$off("enable-ui-mouse", this.enableUiMouse);
    }

    disableUiMouse() {
        this.uiMouseDisabled = true;
    }

    enableUiMouse() {
        this.uiMouseDisabled = false;
    }

    get catalogLoaded(): boolean {
        return this.$store.getters["catalog/loaded"];
    }

    get isLoading(): boolean {
        return !this.catalogLoaded || this.document.isLoading;
    }

     get document(): DocumentState {
        return this.$store.getters["document/document"];
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
