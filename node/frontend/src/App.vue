<template>
    <div id="app">
        <template v-if="upToDate">
            <router-view />
        </template>
        <template v-else>
            <b-spinner style="size: 2em;"></b-spinner> Updating to latest version, please wait...
        </template>
        <version-number />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import MainNavBar from "./components/MainNavBar.vue";
import Component from "vue-class-component";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "vue-resize/dist/vue-resize.css";
import VersionNumber from "../src/components/VersionNumber.vue";
import { MainEventBus } from "../src/store/main-event-bus";
import { registerObjectBuilders } from "../src/htmlcanvas/objects";

registerObjectBuilders();

@Component({
    components: {
        VersionNumber
    }
})
export default class App extends Vue {
    upToDate = true;
    targetVersion: string | null = null;

    mounted() {
        document.onkeydown = (evt) => {
            if (document.activeElement === null || document.activeElement.nodeName.toLowerCase() !== "input") {
                MainEventBus.$emit("keydown", evt);
            }

            let isEscape = false;
            if ("key" in evt) {
                isEscape = evt.key === "Escape" || evt.key === "Esc";
            }
            if (isEscape) {
                MainEventBus.$emit("escape-pressed");
            }
            if (evt.key === "Delete" || evt.key === "Del" || evt.key === "Backspace") {
                if (document.activeElement === null || document.activeElement.nodeName.toLowerCase() !== "input") {
                    MainEventBus.$emit("delete-pressed");
                }
            }
        };

        MainEventBus.$on('update-available', () => {
            this.upToDate = false;
        })
    }
}
</script>

<style lang="less">
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

body {
    background-color: #f8f9fa;
}
</style>
