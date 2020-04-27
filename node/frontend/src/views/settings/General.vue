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
import {
    LENGTH_MEASUREMENT_CHOICES,
    PRESSURE_MEASUREMENT_CHOICES,
    TEMPERATURE_MEASUREMENT_CHOICES, VOLUME_MEASUREMENT_CHOICES
} from "../../../../common/src/api/document/drawing";
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
            ["title", "Project Title", "text"],
            ["projectNumber", "Project No.", "text"],
            ["projectStage", "Project Stage", "text"],
            ["designer", "Designer", "text"],
            ["reviewed", "Reviewed by", "text"],
            ["approved", "Approved by", "text"],
            ["revision", "Revision No.", "number"],
            ["client", "Client", "text"],
            ["description", "Description", "textarea"]
        ];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get generalInfo() {
        return this.document.drawing.metadata.generalInfo;
    }

    get committedGeneralInfo() {
        return this.document.committedDrawing.metadata.generalInfo;
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
