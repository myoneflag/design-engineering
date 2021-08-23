<template>
    <div>
        <b-row>
            <b-col>
                <b-form-group label="Debug Info">
                    <b-button @click="showDocument = !showDocument">{{showDocument ? "Hide" : "Show"}}</b-button> <br/>
                    <b-button v-if="showDocument" variant="primary" @click="paste">Paste from clipboard</b-button> &nbsp;
                    <b-button v-if="showDocument" variant="warning" @click="getJson()">Revert</b-button> &nbsp;   
                    <b-button v-if="showDocument" variant="danger" @click="save">Save</b-button>
                    <b-textarea v-if="showDocument" v-model="drawingJson" rows="30" style="font-size: 12px"></b-textarea>
                </b-form-group>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-button variant="success" @click="download">Download</b-button> &nbsp;
                <b-button variant="primary" @click="copy">Copy to clipboard</b-button> &nbsp;
                <b-button variant="danger" @click="generateAnError">Generate an error</b-button>
            </b-col>
        </b-row>
        <br/>
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
import { DrawingState } from "../../../../common/src/api/document/drawing";

@Component({})
export default class Debug extends Vue {
    drawingJson: string = "";
    showDocument: boolean = false;

    mounted() {
        this.getJson()
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

    getJson() {
        this.drawingJson = JSON.stringify(this.document.drawing, null, 2);        
    }

    async download() {
        const blob = new Blob([this.drawingJson], { type: "text/plain" });
        const e = document.createEvent("MouseEvents"),
            a = document.createElement("a");
        a.download = `debug_${this.document.drawing.metadata.generalInfo.title}.json`;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
        e.initEvent("click", true, false);
        a.dispatchEvent(e);
    }

    async copy() {
        await navigator.clipboard.writeText(this.drawingJson)
    }

    async paste() {
        await navigator.clipboard.readText().then(text => this.drawingJson = text);    
    }

    async save() {
        const newDoc = JSON.parse(this.drawingJson) as DrawingState;
        Object.assign(this.document.drawing, newDoc);
        await this.$store.dispatch("document/commit", {skipUndo: true, diffAll: true});
        //window.location.reload();
    }
    generateAnError(){
        throw new Error('this is sample error');  
    }
    log() {
        // tslint:disable-next-line:no-console
	    console.log(JSON.parse(JSON.stringify(this.document)));
    }

    logLive() {
        // tslint:disable-next-line:no-console
        console.log(this.document);
    }

    logCatalog() {
        // tslint:disable-next-line:no-console
        console.log(JSON.parse(JSON.stringify(this.catalog)));
    }
}
</script>

<style lang="less"></style>
