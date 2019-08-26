<template>
    <div class="propertiesWindow">
        <b-container>
            <b-row style="margin-top: 10px">
                <b-col>
                    <h6>Properties</h6>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";

    @Component
    export default class PropertiesWindow extends Vue {

    }
</script>

<style lang="less">
    .propertiesWindow {
        position: fixed;
        top: 180px;
        right: 20px;
        width: 250px;
        height: 500px;
        background: white;
        border: gray solid 1px;
        border-radius: 5px;
    }
</style>
