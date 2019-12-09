<template>
    <b-row style="position:fixed; left:300px; top:80px;">
        <b-col>
            <b-button-group>
                <b-button variant="outline-dark" class="insertFloorPlanBtn source btn-sm"
                          @click="uploadFloorPlanClicked"
                ><b-col></b-col><v-icon name="upload" scale="1.3" style="float:left; margin-top:5px"></v-icon> Upload Floor Plan (PDF)</b-button>
                <input
                        ref="uploadPdfButton"
                        type="file"
                        name="name"
                        style="display: none;"
                        accept=".pdf"
                        @input="floorPlanChosen"
                />

            </b-button-group>
        </b-col>
    </b-row>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';

    @Component
    export default class FloorPlanInsertPanel extends Vue {


        uploadFloorPlanClicked() {
            (this.$refs.uploadPdfButton as any).click();
        }

        floorPlanChosen(file: Event) {
            if ((file.target as any).files[0]) {
                this.$emit('insert-floor-plan', (file.target as any).files[0]);
            }
        }
    }
</script>

<style lang="less">
    .insertFloorPlanBtn {
        height: 45px;
        width: 130px;
        font-size: 12px;
        background-color:white;
    }

</style>
