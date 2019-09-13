<template>
    <b-row>
        <b-col>
            <b-button size="lg" variant="danger" @click="deleteDocument">
                <v-icon name="trash-alt"/>Reset Document
            </b-button>
        </b-col>
    </b-row>
</template>

<script lang="ts">

    import Vue from 'vue';
    import Component from 'vue-class-component';
    import axios from 'axios';

    @Component({

    })
    export default class Document extends Vue {
        deleteDocument() {
            if (window.confirm('Are you sure you want to reset this document? This operation cannot be undone.')) {
                axios.post('/api/document/reset').then(() =>
                    window.location.reload(),
                );
            }
        }
    }

</script>

<style lang="less">

</style>
