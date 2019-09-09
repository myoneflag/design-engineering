<template>
    <b-row style="position:fixed; left:20px; top:80px;">
        <b-col>
            <b-button-group>
                <b-button variant="outline-dark" class="modebtn background btn-sm"
                          :pressed="mode === 0"
                          @click="$emit('update:mode', 0)"
                ><v-icon  name="ruler-combined" scale="2"/><br>Floor Plan</b-button>
                <b-button variant="outline-dark" class="modebtn pipes btn-sm"
                          :pressed="mode === 1"
                          @click="$emit('update:mode', 1)"
                ><v-icon  name="wave-square" scale="2.5"/><br>Hydraulics</b-button>
                <b-button variant="outline-dark" class="modebtn results btn-sm"
                          :pressed="mode === 2"
                          @click="$emit('update:mode', 2)"
                ><v-icon  name="calculator" scale="2"/><br>Results</b-button>
            </b-button-group>
        </b-col>
    </b-row>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';

    @Component({
        props: {
            mode: Number,
        },
    })
    export default class ModeButtons extends Vue {}
</script>

<style lang="less">
    .modebtn {
        height: 70px;
        width: 80px;
        font-size: 12px;
        background-color:white;
    }
    /*
    .background {
        background-image: url("https://image.freepik.com/free-vector/blueprint-house-plan-drawing-figure-jotting_70347-1372.jpg");
        background-size: cover;
    }
    .pipes {
        background-image: url("https://st4.depositphotos.com/17253970/20674/v/1600/depositphotos_206740610-stock-illustration-water-pipe-color-illustration-vector.jpg");
        background-size: contain;
    }
    .results {
        background-image: url("https://cdn4.iconfinder.com/data/icons/seo-round-color-shapes/355572/34-512.png");
        background-size: contain;
    }*/

</style>
