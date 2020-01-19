'<template>
    <b-row style="margin-top: 10px">
        <b-col>
            <b-button variant="primary" @click="$emit('input', !value)" :disabled="readonly">
                {{ value ? "True" : "False" }}
            </b-button>
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
    props: {
        value: Boolean,
        disabled: Boolean,
        readonly: Boolean,
    }
})
export default class BooleanPicker extends Vue {
    /**/
}
</script>

<style lang="less"></style>
