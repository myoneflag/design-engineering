<template>
    <div>
        <b-row>
            <b-col>
                <b-button variant="warning" @click="upload">Upload</b-button> &nbsp;                
                <b-button variant="success" @click="download">Download</b-button> &nbsp;                
            </b-col>
        </b-row>
        <br/>
        <b-row>
            <b-col>
                <b-form-group label="Advanced Debug">
                    <b-button @click="showDocument = !showDocument">{{showDocument ? "Hide" : "Show"}}</b-button>
                    <br/>
                    <b-button v-if="showDocument" variant="warning" @click="paste">Paste from clipboard</b-button> &nbsp;
                    <b-button v-if="showDocument" variant="primary" @click="copy">Copy to clipboard</b-button> &nbsp;                    
                    <b-button v-if="showDocument" variant="warning" @click="getJson()">Revert</b-button> &nbsp;   
                    <b-button v-if="showDocument" variant="danger" @click="save">Save</b-button>
                    <b-textarea v-if="showDocument" v-model="drawingJson" rows="30" style="font-size: 12px"></b-textarea>
                    <br/>
                    <b-button v-if="showDocument" variant="danger" @click="generateAnError">Generate an error</b-button>                    
                </b-form-group>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-btn-group>
                    <b-btn variant="secondary" @click="log">Document</b-btn>
                    &nbsp;
                    <b-btn variant="secondary" @click="logLive">Document (VueX)</b-btn>
                    &nbsp;
                    <b-btn variant="secondary" @click="logCatalog">Catalog</b-btn>
                </b-btn-group>
            </b-col>
        </b-row>
        <br/>
        <b-row>
            <b-col>
                <hr/>
                <h5>Reporting</h5>
                <b-btn @click="downloadReport()" variant="success">Download document report</b-btn>
                <br/><br/>
                <b-btn @click="triggerReports()" variant="warning">Trigger system wide reports</b-btn>
                <br/><br/>
                <p v-if="documentObject">Status: {{documentReportingStatus}}</p>
                <b-btn @click="includeInReporting()" variant="primary">Include</b-btn>
                &nbsp;
                <b-btn @click="excludeFromReporting()" variant="warning">Exclude</b-btn>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { User } from "../../../../common/src/models/User";
import { Document } from "../../../../common/src/models/Document";
import { DocumentState } from "../../store/document/types";
import CatalogState from "../../store/catalog/types";
import { DrawingState } from "../../../../common/src/api/document/drawing";
import ReportingFilter, { ReportingStatus } from "../../../../common/src/reporting/ReportingFilter";
import { refreshDocumentReport, downloadDocumentReport, triggerSystemManufacturerReport } from "../../api/reports";
import { getDocument } from '../../api/document';

@Component({})
export default class Debug extends Vue {
    drawingJson: string = "";
    showDocument: boolean = false;
    documentObject: Document | null = null;

    async mounted() {
        this.getJson()
        await this.loadDocument();
    }

    async loadDocument() { 
        const getDoc = await getDocument(this.document.documentId);
        if (getDoc.success) {
            this.documentObject = getDoc.data;
            this.$forceUpdate();
        }
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
        a.download = `debug_${this.document.documentId}_${this.document.drawing.metadata.generalInfo.title}.json`;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
        e.initEvent("click", true, false);
        a.dispatchEvent(e);
    }

    async upload() {
        const e = document.createEvent("MouseEvents"),
            i = document.createElement("input");
        i.type = "file";
        e.initEvent("click", true, false);
        //@ts-ignore        
        i.onchange = async function() {
            //@ts-ignore
            const debugText = await i.files[0].text()
            const newDoc = JSON.parse(debugText) as DrawingState;
            //@ts-ignore
            Object.assign(this.document.drawing, newDoc);
            //@ts-ignore
            await this.$store.dispatch("document/commit", {skipUndo: true, diffAll: true});
        }.bind(this);
        i.dispatchEvent(e);
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

    async downloadReport() {
        const refresh = await refreshDocumentReport(this.document.documentId);        
        if (!refresh.success) {
            throw new Error("Error refreshing document report");
        }
        const download = await downloadDocumentReport(this.document.documentId);
        if (!download.success) {
            throw new Error("Error downloading document report");
        }
        const blob = new Blob([download.data], { type: 'test/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `document_report_${this.document.documentId}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    async triggerReports() {
        const trigger = await triggerSystemManufacturerReport();
        if (!trigger.success)
            throw new Error(trigger.message);
    }

    async includeInReporting() {
        this.document.drawing.metadata.generalInfo.reportingStatus = ReportingStatus.Included;
        await this.$store.dispatch("document/commit", {skipUndo: true});
        await this.loadDocument();
    }

    async excludeFromReporting() {
        this.document.drawing.metadata.generalInfo.reportingStatus = ReportingStatus.Excluded;
        await this.$store.dispatch("document/commit", {skipUndo: true});
        await this.loadDocument();
    }

    get documentReportingStatus() {
        if (this.documentObject)
            return ReportingFilter.includedStatusString(this.documentObject);
        else {
            return "...";
        }
    }

}
</script>

<style lang="less"></style>
