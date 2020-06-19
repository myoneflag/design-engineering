<template>
    <div>
        <LoadingScreen v-if="isLoading" />
        <RouterView v-else></RouterView>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { DocumentState } from "../store/document/types";
import MainNavBar from "../../src/components/MainNavBar.vue";

@Component({
    components: {
        MainNavBar
    }
})
export default class DocumentShare extends Vue {
    get isLoading() {
        return !this.catalogLoaded || !this.document.uiState.loaded;
    }

    get catalogLoaded(): boolean {
        return this.$store.getters["catalog/loaded"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }
}
</script>