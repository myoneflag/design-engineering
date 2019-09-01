<template>
    <div ref="overlaydiv" class="fullFrame" style="background-color: rebeccapurple; opacity: 0.5; position: fixed; top: 65px; left: 0px; pointer-events: none"

    >

    </div>
</template>

<script lang="ts">
    // The purpose of this is to capture events above the UI and pass them to the canvas when necessary.
    import Vue from 'vue';
    import Component from "vue-class-component";
    import FloorPlanProperties from '@/components/editor/FloorPlanProperties.vue';

    @Component({
        props: {

        },
    })
    export default class Overlay extends Vue {

        mounted() {
            window.addEventListener('click', () => {
                console.log("mouseup");
            });
            window.addEventListener('mousedown', () => {
                console.log("mousedown " + arguments[0]);
            });
            window.addEventListener('mouseup', () => {
                console.log("mouseup");
            });
            window.addEventListener('mousemove', () => {
                console.log("mousemove");
            });
            (this.$refs["overlaydiv"] as any).addEventListener('click', () => {
                console.log("clicked");
            });
            (this.$refs["overlaydiv"] as any).addEventListener('click', () => {
                console.log("mouseup");
            });
            (this.$refs["overlaydiv"] as any).addEventListener('click', () => {
                console.log("moved");
                return false;
            });
        }

        onMouseDown(event: MouseEvent) {
            this.$emit('onmousedown', event);
        }
        onMouseUp(event: MouseEvent) {
            this.$emit('onmouseup', event);
        }
        onMouseMove(event: MouseEvent) {
            this.$emit('onmousemove', event);
        }
    }
</script>

<style lang="css">
</style>
