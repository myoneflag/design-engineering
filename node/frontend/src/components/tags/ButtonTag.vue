<template>
    <div
        @click="$emit('tag-clicked', item)"
        role="button"
        :class="[classList, { 'btn-primary text-light': selectedTags && selectedTags.indexOf(item) != -1 }]"
        class="d-inline-flex btn-small "
    >
        {{ createTagItem }}
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
    props: {
        item: String,
        startWith: String,
        classList: String,
        selectedTags: []
    }
})
export default class ButtonTag extends Vue {
    get createTagItem() {
        return `${this.$props.startWith}${this.$props.item.slice(0, 1).toUpperCase()}${this.$props.item
            .slice(1)
            .substr(0, 20)} ${this.$props.item.length >= 20? '...' :''}`;
    }
}
</script>