<template>
    <FieldBuilder
            ref="fields"
            :fields="fields"
            :reactiveData="generalInfo"
            :originalData="committedGeneralInfo"
            :onSave="save"
            :onBack="back"
    />
</template>

<script lang="ts">

    import Vue from 'vue'
    import Component from "vue-class-component";
    import {DocumentState} from '@/store/document/types';
    import * as _ from 'lodash';
    import FieldBuilder from '@/components/FieldBuilder.vue';

    @Component({
        components: {FieldBuilder},
        beforeRouteLeave(to, from, next) {
            if ((this.$refs.fields as any).leave()) {
                next();
            } else {
                next(false);
            }
        },
    })
    export default class General extends Vue {


        get fields(): Array<[string, string, string]> {
            return [
                ["title", "Project Title:", "text"],
                ["projectNumber", "Project No.", "text"],
                ["projectStage", "Project Stage:", "text"],
                ["designer", "Designer:", "text"],
                ["reviewed", "Reviewed by:", "text"],
                ["approved", "Approved by:", "text"],
                ["revision", "Revision No.:", "number"],
                ["client", "Client:", "text"],
                ["description", "Description:", "textarea"]
            ]
        }

        get document(): DocumentState {
            console.log("Refreshing document");
            return this.$store.getters["document/document"];
        }

        get generalInfo() {
            return this.document.drawing.generalInfo;
        }

        get committedGeneralInfo() {
            return this.document.committedDrawing.generalInfo;
        }


        save() {
            this.$store.dispatch('document/commit').then(() => {
                this.$bvToast.toast("Saved successfully!", {variant: "success", title: "Success"});
            });
        }

        back() {
            this.$router.push({ name: 'document'});
        }
    }

</script>

<style lang="less">

</style>
