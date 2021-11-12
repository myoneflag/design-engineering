<template>
    <SettingsFieldBuilder
        ref="fields"
        :fields="fields"
        :reactiveData="generalInfo"
        :originalData="committedGeneralInfo"
        :onSave="save"
        :onBack="back"
    />
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DocumentState } from "../../../src/store/document/types";
import SettingsFieldBuilder from "../../../src/components/editor/lib/SettingsFieldBuilder.vue";
@Component({
    components: { SettingsFieldBuilder },
    beforeRouteLeave(to, from, next) {
        if ((this.$refs.fields as any).leave()) {
            next();
        } else {
            next(false);
        }
    }
})
export default class General extends Vue {
    get fields(): any[] {
        return [
            ["generalInfo.title", "Project Title", "text"],
            ["generalInfo.projectNumber", "Project No.", "text"],
            ["generalInfo.projectStage", "Project Stage", "text"],
            ["generalInfo.designer", "Designer", "text"],
            ["generalInfo.reviewed", "Reviewed by", "text"],
            ["generalInfo.approved", "Approved by", "text"],
            ["generalInfo.revision", "Revision No.", "number"],
            ["generalInfo.client", "Client", "text"],
            ["generalInfo.description", "Description", "textarea"],
            ["locale", "Project Locale", "locale"],
        ];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get generalInfo() {
        return { generalInfo: this.document.drawing.metadata.generalInfo, locale: this.document.locale };
    }

    get committedGeneralInfo() {
        return { generalInfo: this.document.committedDrawing.metadata.generalInfo, locale: this.document.locale };
    }

    save() {
        this.$store.dispatch("document/commit", {skipUndo: true}).then(() => {
            this.$bvToast.toast("Saved successfully!", { variant: "success", title: "Success" });
        });
    }

    back() {
        this.$router.push({ name: "drawing" });
    }
}
</script>

<style lang="less"></style>
