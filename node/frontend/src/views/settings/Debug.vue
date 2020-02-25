<template>
    <div>
        <b-row>
            <b-col>
                <h4>Debug Info</h4>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-form-group label="Document">
                    <b-textarea v-model="drawingJson" rows="30" style="font-size: 12px"></b-textarea>
                </b-form-group>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-btn-group>
                    <b-btn variant="success" @click="save">Save</b-btn>
                </b-btn-group>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-btn-group>
                    <b-btn variant="secondary" @click="log">Document</b-btn>
                    <b-btn variant="secondary" @click="logLive">Document (VueX)</b-btn>
                    <b-btn variant="secondary" @click="logCatalog">Catalog</b-btn>
                </b-btn-group>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { deleteDocument, getDocument, getDocuments, resetDocument } from "../../api/document";
import { Document as IDocument } from "../../../../common/src/models/Document";
import { AccessLevel, User } from "../../../../common/src/models/User";
import { DocumentState } from "../../store/document/types";
import CatalogState from "../../store/catalog/types";

@Component({})
export default class Debug extends Vue {
    drawingJson: string = "";

    mounted() {
        this.drawingJson = JSON.stringify(this.document.drawing, null, 2);
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get catalog(): CatalogState {
        return this.$store.getters["catalog/default"];
    }

    async save() {
        const newDoc = JSON.parse(this.drawingJson);
        Object.assign(this.document.drawing, newDoc);
        await this.$store.dispatch("document/commit");
        //window.location.reload();
    }

    log() {
        console.log(JSON.parse(JSON.stringify(this.document)));
    }

    logLive() {
        console.log(this.document);
    }

    logCatalog() {
        console.log(JSON.parse(JSON.stringify(this.catalog)));
    }
}
</script>

<style lang="less"></style>
