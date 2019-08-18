<template>
    <b-modal id="project-setup-modal" size="xl">
        <b-container>
            <b-row>
                <b-col>
                    <canvas style="background-color:#999999; margin-left: 0px; margin-right: 0px; width: 100%">

                    </canvas>
                </b-col>
            </b-row>
            <b-row style="margin-top: 20px;">
                <b-col cols="3">
                    <label>Imported Size:</label>
                </b-col>
                <b-col cols="3">
                    <b-dropdown size="sm" id="dropdown-1" text="Dropdown Button" variant="secondary">
                        <b-dropdown-item>First Action</b-dropdown-item>
                        <b-dropdown-item>Second Action</b-dropdown-item>
                        <b-dropdown-item>Third Action</b-dropdown-item>
                        <b-dropdown-item>Fourth Action</b-dropdown-item>
                    </b-dropdown>
                </b-col>
            </b-row>
            <b-row style="margin-top: 20px;">
                <b-col cols="3">
                    <label>Our Project Size:</label>
                </b-col>
                <b-col cols="3">
                    <b-dropdown size="sm" id="dropdown-1" text="Dropdown Button" variant="secondary">
                        <b-dropdown-item>First Action</b-dropdown-item>
                        <b-dropdown-item>Second Action</b-dropdown-item>
                        <b-dropdown-item>Third Action</b-dropdown-item>
                        <b-dropdown-item>Fourth Action</b-dropdown-item>
                    </b-dropdown>
                </b-col>
            </b-row>
            <b-row style="margin-top: 20px;">
                <b-col cols="2">
                    <label>Imported Scale:</label>
                </b-col>
                <b-col>
                        <b-form-input
                                id="input-1"
                                type="range"
                        />
                </b-col>
                <b-col cols="2">
                    <b-form-input type="text"/>
                </b-col>
            </b-row>
            <b-row>

            </b-row>
        </b-container>

    </b-modal>
</template>

<script lang="ts">
    import Component from 'vue-class-component';
    import Vue from 'vue';

    @Component
    export default class DrawingSetup extends Vue {}
</script>

<style lang="less">

</style>
