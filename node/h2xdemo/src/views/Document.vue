<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <DrawingCanvas :document="document"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import DrawingNavBar from "../components/DrawingNavBar.vue";
    import DrawingSetup from '@/components/DrawingSetup.vue';
    import DrawingCanvas from '@/components/canvas/DrawingCanvas.vue';
    import sockjs from 'sockjs-client';
    import Stomp, {Message} from "stompjs";
    import {State} from "vuex-class";
    import {DocumentState} from '@/store/document/types';

    @Component({
        components: {DrawingCanvas, DrawingSetup, DrawingNavBar},
    })
    export default class Document extends Vue {

        get document() {
            return this.$store.getters["document/document"];
        }

        mounted() {
            let socket = sockjs('/api/websocket');
            console.log("Connecting to websocket");
            let connection = Stomp.over(socket);
            connection.connect({}, () => {

                    console.log("Connected to websocket");

                    connection.subscribe('/user/document', (payload: Message) => {
                        console.log("Got message from websocket: " + JSON.stringify(payload));
                        this.$store.dispatch('document/applyRemoteOperation', JSON.parse(payload.body));
                    })
                }
            );

        }
    }
/*

 */
</script>

