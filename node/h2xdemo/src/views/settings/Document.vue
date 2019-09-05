<template>
    <b-row>
        <b-col>
            <b-button size="lg" variant="danger" @click="deleteDocument">
                <v-icon name="trash-alt"/> Delete Document
            </b-button>
        </b-col>
    </b-row>
</template>

<script lang="ts">

    import Vue from 'vue'
    import Component from "vue-class-component";

    @Component({

    })
    export default class Document extends Vue {
        deleteDocument() {
            window.alert("The day that we can create documents is the day that we can delete documents.");
        }
    }

</script>

<style lang="less">

</style>
