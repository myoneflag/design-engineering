<template>
    <b-modal id="feedback-modal" size="lg" centered scrollable 
            :title="feedbackType === 'help' ? 
                'Request help' : 'Send us your feedback!'" 
            okTitle="Send" 
            @ok="onSubmitFeedback"
            @cancel="onCloseFeedback" 
            @close="onCloseFeedback" 
            :ok-disabled="showConfirmation"
            v-model="internalShow">
        <b-form-select v-model="selected" :options="options"></b-form-select>
        <br/><br/>
        <b-form-textarea
            id="t" v-model="message" 
            :placeholder="selected ? 
                    ( selected === FeedbackCategory.Bug || selected === FeedbackCategory.Help ) ? 
                        'Please provide details about the issue you are encountering and include relevant information such as the floor level, flow system, error type etc.': 
                        'Please help us improve the product.':
                    'Please select the type of issue you are reporting.'"
                rows="8"
                :disabled="!selected">
        </b-form-textarea>
        <br/>
        <b-alert variant="danger" :show="showAlert">
            {{ errorMessage }}
        </b-alert>
        <b-alert variant="success" :show="showConfirmation">
            Thank you for your message. We will respond within 1 business day.
        </b-alert>
    </b-modal>            
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { submitFeedback } from "../api/feedback-message";
    import { FeedbackCategory } from "../../../common/src/models/FeedbackMessage";

    @Component({
        props: {
            value: Boolean, 
            feedbackType: String
        }
    })
    export default class FeedbackModal extends Vue {

        get FeedbackCategory() {
            return FeedbackCategory;
        }

        options = [
            {value: FeedbackCategory.Bug, text: 'Report an issue'},
            {value: FeedbackCategory.Help, text: 'Get help with the design'},
            {value: FeedbackCategory.Feature, text: 'Feature request'},
            {value: FeedbackCategory.Other, text: 'Other'}
        ];

        showAlert: boolean = false;
        showConfirmation: boolean = false;
        selected: string = '';
        errorMessage: string = "";
        message: string = "";
        document: { url: string, id: string | null } | null = null;

        onSubmitFeedback(bvModalEvt: any) {
            bvModalEvt.preventDefault();
            this.showAlert = false;
            if (this.selected === "") {
                this.showAlert = true;
                this.errorMessage = "Please select a category for the feedback.";
            } else if (this.message === "") {
                this.showAlert = true;
                this.errorMessage = "Please write a feedback.";
            } else {
                this.document = { 
                    url: window.location.origin + this.$route.fullPath,
                    id: this.$route.params["id"] ? this.$route.params["id"] : null
                }
                submitFeedback(this.selected, this.message, this.document)
                    .then((res) => {
                        this.showConfirmation = true;
                        setTimeout( () => {
                            this.internalShow = false;
                            this.onCloseFeedback(null);
                        }, 2000)
                    });
            }

            this.$store.dispatch('profile/refreshOnBoardingStats');
        }

        get internalShow() {
            return this.$props.value;
        }

        set internalShow(val: boolean) {
            this.$emit('input', val);
        }

        onCloseFeedback(bvModalEvt: any) {
            this.selected = "";
            this.message = "";
            this.errorMessage = "";
            this.document = null;
            this.showAlert = false;
            this.showConfirmation = false;
        }
    }
</script>

<style scoped>
    .modal-content {
        width: 450px;
    }
</style>
