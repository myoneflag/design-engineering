<template>
    <div>

        <b-row v-if="document" style="margin-top: 30px">
            <b-col>
                <b-button
                    size="md"
                    variant="danger"
                    @click="deleteDocument"
                    :disabled="!canDelete"
                    :v-b-tooltip.hover.title="canDelete ? '' : 'You don\'t have permission to delete'"
                >
                    <v-icon name="trash" scale="1" />&nbsp;Delete Document
                </b-button>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { deleteDocument, getDocument } from "../../api/document";
import { canUserDeleteDocument, Document as IDocument } from "../../../../common/src/models/Document";
import { AccessLevel, User } from "../../../../common/src/models/User";

@Component({
    watch: {
        $route(to, from) {
            (this as Document).updateId(to.params.id);
        }
    }
})
export default class Document extends Vue {
    document: IDocument | null = null;

    mounted() {
        this.updateId(this.$route.params.id);
    }

    updateId(id: string) {
        getDocument(Number(id)).then((res) => {
            if (res.success) {
                this.document = res.data;
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Document failed to load",
                    variant: "danger"
                });
            }
        });
    }

    deleteDocument() {
        if (window.confirm("Are you sure you want to delete this document forever? This operation cannot be undone.")) {
            deleteDocument(Number(this.$route.params.id)).then((res) => {
                if (res.success) {
                    this.$bvModal.msgBoxConfirm("The document has been deleted.").then(() => {
                        this.$router.push("/");
                    });
                } else {
                    this.$bvToast.toast(res.message, {
                        title: "Failed to delete document",
                        variant: "danger"
                    });
                }
            });
        }
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get canDelete(): boolean {
        if (!this.document) {
            return false;
        }

        if (!this.profile) {
            return false;
        }

        return canUserDeleteDocument(this.document, this.profile);
    }
}
</script>

<style lang="less"></style>
