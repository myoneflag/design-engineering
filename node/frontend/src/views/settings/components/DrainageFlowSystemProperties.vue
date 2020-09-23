<template>
    <b-row>
        <b-col>
            <b-form-group
                    v-for="field in fields"
                    :key="field[0]"
                    :id="'input-group-' + field[0]"
                    :label="field[2].startsWith('title') ? '' : field[1]"
                    :label-for="'input-' + field[0]"
                    label-cols="4"
            >
                <b-form-textarea
                        v-if="field[2] === 'textarea'"
                        :value="getReactiveData(field[0])"
                        @input="setReactiveData(field[0], $event)"
                        :id="'input-' + field[0]"
                        rows="5"
                        :placeholder="'Enter ' + field[1]"
                ></b-form-textarea>
            </b-form-group>
        </b-col>
    </b-row>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";

    @Component({
        components: {},
        props: {

        }
    })
    export default class DrainageFlowSystemProperties extends Vue {

    }
</script>

<style lang="less">

</style>