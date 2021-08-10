<template>
    <b-row style="position:fixed; left:300px; top:80px;">
        <b-col>
            <b-button-group>
                <b-button
                    variant="outline-dark"
                    class="insertFloorPlanBtn source btn-sm"
                    @click="uploadFloorPlanClicked"
                    ><b-col></b-col
                    ><v-icon name="upload" scale="1.3" style="float:left; margin-top:5px"></v-icon> Upload Floor Plan
                    (PDF)</b-button
                >
                <b-button
                    :class="
                        floorLockStatus
                            ? 'btn-light border border-dark text-dark'
                            : 'btn-dark text-white border border-dark'
                    "
                    class="source btn-sm"
                    @click="$emit('lock-unlock-floor')"
                    ><v-icon :name="floorLockStatus ? 'unlock' : 'lock'"    
                     v-b-tooltip.hover.right="{ title: `Click to ${floorLockStatus?'Lock':'Unlock'} the PDF` }" 
                     class=" mx-2" scale="1.3"></v-icon>
                </b-button>
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
import Vue from "vue";
import Component from "vue-class-component";

@Component({
    props: {
        floorLockStatus: Boolean
    }
})
export default class FloorPlanInsertPanel extends Vue {
    uploadFloorPlanClicked() {
        (this.$refs.uploadPdfButton as any).click();
    }

    floorPlanChosen(file: Event) {
        if ((file.target as any).files[0]) {
            this.$emit("insert-floor-plan", (file.target as any).files[0]);
        }
    }
}
</script>

<style lang="less">
.insertFloorPlanBtn {
    height: 45px;
    width: 130px;
    font-size: 12px;
    background-color: white;
}
</style>
