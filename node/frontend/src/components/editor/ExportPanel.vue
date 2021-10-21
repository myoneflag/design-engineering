<template>
  <b-container>
    <b-row class="exportRow" align-v="center">
      <b-col class="exportCol">
        <b-card title="Read-Only Link" img-alt="Image" img-top tag="article" class="mb-2 exportCard">
          <b-button class="exportButton" @click="handleShareClick">Generate</b-button>
          <img src="@/assets/export-icons//chrome.png" width="150" height="150" />
          <b-card-text>
            Share a link with colleagues or project team members so they can review your design
          </b-card-text>
        </b-card>
      </b-col>
      <b-col class="exportCol">
        <b-card title="PDF" img-alt="Image" img-top tag="article" class="mb-2 exportCard">
          <b-button class="exportButton" @click="pdfSnapshot">Download</b-button>
          <img src="@/assets/export-icons//pdf.png" width="150" height="150" />
          <b-card-text>
            Export a full PDF set which includes a cover sheet with your chosen design parameters
          </b-card-text>
        </b-card>
      </b-col>
      <b-col class="exportCol">
        <b-card title="Bill of Materials" img-alt="Image" img-top tag="article" class="mb-2 exportCard">
          <b-button class="exportButton" @click="budgetReport">Download</b-button>
          <img src="@/assets/export-icons//excel.png" width="150" height="150" />
          <b-card-text>
            Download a spreadsheet that contains all the components in your design and their associated cost
          </b-card-text>
        </b-card>
      </b-col>
      <b-col class="exportCol">
        <b-card title="AutoCAD" img-alt="Image" img-top tag="article" class="mb-2 exportCard">
          <b-button class="exportButton" @click="autoCad">Download</b-button>
          <img src="@/assets/export-icons//autocad.png" width="150" height="150" />
          <b-card-text>
            Export an SVG file that can be imported directly into AutoCAD <br />
            <b-button
              variant="light"
              href="https://www.youtube.com/watch?v=WvBhiOxv4vQ"
              target="_blank"
            >
              <v-icon name="play-circle" scale="1.5" /> Watch here
            </b-button>
          </b-card-text>
        </b-card>
      </b-col>
      <b-col class="exportCol">
        <b-card title="Revit" img-alt="Image" img-top tag="article" class="mb-2 exportCard">
          <b-button class="exportButton" @click="handleJsonExport" size="md">Download</b-button>
          <img src="@/assets/export-icons//revit.png" width="150" height="150" />
          <b-card-text>
            Export a JSON file that will generate a 3D Revit model <br />
            <b-button
              variant="light"
              href="https://drive.google.com/file/d/1paqZlZ45_fYAjswlKSisy42Q_I7633Yp/view?usp=sharing"
              target="_blank"
            >
              <v-icon name="book-reader" scale="1.5" /> Read here
            </b-button>
          </b-card-text>
        </b-card>
      </b-col>
    </b-row>
    <b-modal id="bv-modal-example" hide-footer>
      <template v-slot:modal-title>
        Get link
      </template>
      <div class="d-flex" v-if="document.shareToken">
        <div class="flex-fill">
          <b-form-input
            ref="shareLinkInput"
            onClick="this.setSelectionRange(0, this.value.length)"
            :value="shareLink + document.shareToken"
            readonly
          ></b-form-input>
        </div>
        <b-button @click="handleCopyLink" id="copyLink" class="ml-2" variant="light">Copy link</b-button>
      </div>
      <div v-else>
        <b-button @click="handleGenerateShareLink" variant="success" block>
          Generate shareable link
          <b-spinner v-if="generate.isLoading" style="width: 1.0rem; height: 1.0rem;"></b-spinner>
        </b-button>
      </div>
    </b-modal>
  </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { generateShareLink } from "../../api/share-document";
import { exportBudgetReport } from "../../htmlcanvas/lib/budget-report/budget-report";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import { jsonExport } from "../../htmlcanvas/lib/json-export/export-json";
import PdfSnapshotTool from "../../htmlcanvas/tools/pdf-snapshot-tool";
import { globalStore } from "../../store/document/mutations";
import { DocumentState } from "../../store/document/types";
import { MainEventBus } from "../../store/main-event-bus";

@Component({
  props: {
    objects: Array,
    onChange: Function,
    canvasContext: Object
  }
})
export default class ExportPanel extends Vue {
  $bvModal: any;
  $bvToast: any;
  shareLink: string = window.location.origin + "/";
  generate: { isLoading: boolean } = {
    isLoading: false
  };
  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }
  get globalStore(): GlobalStore {
    return globalStore;
  }
  pdfSnapshot() {
    this.configurePdfExport();
    this.$store.dispatch("document/setPreviewMode", true);
    MainEventBus.$emit("redraw");
    MainEventBus.$emit("set-tool-handler", new PdfSnapshotTool());
  }
  autoCad() {
    this.configureAutoCadExport();
    this.$store.dispatch("document/setPreviewMode", true);
    MainEventBus.$emit("redraw");
    MainEventBus.$emit("set-tool-handler", new PdfSnapshotTool());
  }
  configureAutoCadExport() {
    this.document.uiState.exportSettings.borderless = true;
    this.document.uiState.exportSettings.coverSheet = false;
    this.document.uiState.exportSettings.floorPlans = false;
  }
  configurePdfExport() {
    this.document.uiState.exportSettings.borderless = false;
    this.document.uiState.exportSettings.coverSheet = true;
    this.document.uiState.exportSettings.floorPlans = true;
  }
  budgetReport() {
    exportBudgetReport(this.$props.canvasContext);
  }
  handleShareClick() {
    this.$bvModal.show("bv-modal-example");
  }
  handleJsonExport() {
    console.log("this.document.drawing", this.document.drawing);
    const result = jsonExport(this.document, this.globalStore);

    const data = JSON.stringify(result, null, 4);
    const blob = new Blob([data], { type: "text/plain" });
    const e = document.createEvent("MouseEvents"),
      a = document.createElement("a");
    a.download = this.document.drawing.metadata.generalInfo.title + ".json";
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
    e.initEvent("click", true, false);
    a.dispatchEvent(e);
  }

  handleCopyLink() {
    const shareLinkText = <HTMLInputElement>this.$refs.shareLinkInput;

    shareLinkText.select();
    shareLinkText.setSelectionRange(0, 99999);

    document.execCommand("copy");

    this.$bvToast.toast("Link copied", {
      variant: "primary",
      headerClass: "d-none"
    });
  }
  handleGenerateShareLink() {
    this.generate.isLoading = true;

    generateShareLink(this.document.documentId).then((res) => {
      if (res.success) {
        this.$store.dispatch("document/setShareToken", res.data);
      } else {
        this.$bvToast.toast("Generate shareable link failed! Please try again.", {
          variant: "danger",
          title: "Error!"
        });
      }

      this.generate.isLoading = false;
    });
  }
}
</script>

<style lang="less">
.exportCol {
  padding: 0px 5px;
  max-width: 14rem;
  font-weight: bolder;
}
.exportCard {
  border: 2px solid black;
  border-radius: 10px;
  min-height: 28rem;
}
.exportRow {
  position: fixed;
  top: 25%;
  border-radius: 10px;
}
.exportButton {
  width: 10rem;
  margin-bottom: 25px;
}
</style>
