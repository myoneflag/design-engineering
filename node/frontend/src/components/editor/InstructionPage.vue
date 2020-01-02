<template>
    <div id="instructions-div">
        <ol style="font-size: 20px">
            <li>
                <p>Drag and drop a floor plan, or click "Upload Floor Plan" in Floor Plan View</p>
            </li>
            <li>
                <p>Draw pipes, valves and fixtures</p>
            </li>
            <li>
                <p>Calculate pipe sizes, velocities, pressures, and component schedules</p>
            </li>
        </ol>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class InstructionPage extends Vue {}
</script>

<style lang="less">
#instructions-div {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    pointer-events: none;
}

ol {
    counter-reset: li;
}

#instructions-div > ol > li {
    list-style: none;
}

#instructions-div > ol > li:before {
    content: counter(li);
    counter-increment: li;

    float: left;

    border-radius: 50%;
    margin-left: 20px;
    margin-right: 20px;
    width: 40px;
    height: 40px;
    padding: 8px;
    background: #fff;
    border: 2px solid #666;
    color: #666;
    text-align: center;
    font: 20px Arial, sans-serif;
}
</style>
