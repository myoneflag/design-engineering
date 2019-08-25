<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <DrawingCanvas/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import DrawingNavBar from "../components/DrawingNavBar.vue";
    import DrawingSetup from '@/components/DrawingSetup.vue';
    import DrawingCanvas from '@/components/DrawingCanvas.vue';
    import sockjs from 'sockjs-client';
    import Stomp, {Message} from "stompjs";

    @Component({
        components: {DrawingCanvas, DrawingSetup, DrawingNavBar},
    })
    export default class Document extends Vue {
        mounted() {
            let socket = sockjs('/api/websocket');
            console.log("Connecting to websocket");
            let connection = Stomp.over(socket);
            connection.connect({}, () => {

                    console.log("Connected to websocket");

                    connection.subscribe('/user/document', (payload: Message) => {
                        this.$store.dispatch('document/applyRemoteOperation', JSON.parse(payload.body));
                    })
                }
            );

        }
    }
/*

 */
</script>

