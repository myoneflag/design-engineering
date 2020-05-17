<template>
    <b-modal id="feedback-modal" scrollable title="Give us some feedback!" okTitle="Save" @ok="onSubmitFeedback"
             @cancel="onCloseFeedback" @close="onCloseFeedback" v-model="internalShow">
        <b-form-textarea
                id="t" v-model="message" placeholder="Anything you want to talk about." rows="8">
        </b-form-textarea>
        <b-form-select v-model="selected" :options="options"></b-form-select>
        <b-alert variant="danger" :show="showAlert">
            {{ errorMessage }}
        </b-alert>
    </b-modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { submitFeedback } from "../api/feedback-message";

    @Component({
        props: {
            value: Boolean
        }
    })
    export default class FeedbackModal extends Vue {

        options = [
            {value: '', text: 'Please select a category'},
            {value: 'feature', text: 'feature request'},
            {value: 'bug', text: 'bug'},
            {value: 'suggestion', text: 'suggestion'},
            {value: 'other', text: 'other'}
        ];

        showAlert: boolean = false;
        selected: string = '';
        errorMessage: string = "";
        message: string = "";

        onSubmitFeedback(bvModalEvt: any) {
            bvModalEvt.preventDefault()
            if (this.selected === ""){
                this.showAlert = true;
                this.errorMessage = "Please select a category for the feedback."
            }
            else if (this.message === ""){
                this.showAlert = true;
                this.errorMessage = "Please write a feedback."
            }
            else{
                submitFeedback(this.selected, this.message)
                    .then((res)=>{
                        this.internalShow = false;
                    })
            }
        }

        get internalShow() {
            console.log(this.$props.value);
            return this.$props.value;
        }

        set internalShow(val: boolean) {
            this.$emit('input', val);
        }

        onCloseFeedback(bvModalEvt: any) {
            this.selected = "";
            this.message = "";
            this.errorMessage = "";
            this.showAlert = false;
        }
    }
</script>
