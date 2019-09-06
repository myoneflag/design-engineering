<template>
    <b-dropdown size="md" id="dropdown-1" :text="selectedSystem.name" variant="outline-dark" class="float-left" :style="'border-radius: 5px; background-color: ' + lighten(selectedSystem.color.hex, 30)">
        <b-dropdown-item
                v-for="(system, index) in flowSystems"
                @click="selectSystem(index)"
                :key="system.uid"
                style="padding-right: 25px"
        >
                        <span :style="'float: left; width:20px; height:20px; margin-right:10px; background-color: ' + system.color.hex">
                        </span>
            {{system.name}}
        </b-dropdown-item>
    </b-dropdown>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";

    @Component({
        props: {
            flowSystems: Array,
            selectedSystem: Object,
        }
    })
    export default class FlowSystemPicker extends Vue {
        selectSystem(index: number) {
            this.$emit('selectSystem', index);
        }


        lighten(col: string, amt: number) {

            var usePound = false;

            if (col[0] == "#") {
                col = col.slice(1);
                usePound = true;
            }

            var num = parseInt(col,16);

            var r = (num >> 16) + amt;

            if (r > 255) r = 255;
            else if  (r < 0) r = 0;

            var b = ((num >> 8) & 0x00FF) + amt;

            if (b > 255) b = 255;
            else if  (b < 0) b = 0;

            var g = (num & 0x0000FF) + amt;

            if (g > 255) g = 255;
            else if (g < 0) g = 0;

            return 'rgba(' + r + ', ' + b + ', ' + g + ', 0.5)';
            //return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);

        }
    }

</script>

<style>

</style>
