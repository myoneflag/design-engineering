import {FileWebsocketMessageType} from "@/api/types";
<template>
    <div>


        <DrawingNavBar :loading="isLoading"></DrawingNavBar>

        <LoadingScreen v-if="isLoading"/>
        <RouterView v-else></RouterView>


    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import DrawingNavBar from "../components/DrawingNavBar.vue";
    import DrawingCanvas from "@/components/editor/DrawingCanvas.vue";


    import sockjs from "sockjs-client";
    import Stomp, {Client, Message} from "stompjs";
    import {FileWebsocketMessage, FileWebsocketMessageType} from "@/api/types";
    import {loadCatalog} from "@/api/catalog";
    import LoadingScreen from "@/views/LoadingScreen.vue";
    import {Catalog} from "@/store/catalog/types";


    @Component({
        components: {LoadingScreen, DrawingCanvas, DrawingNavBar},
    })
    export default class Document extends Vue {

        connection!: Client;
        mounted() {

            const socket = sockjs('/api/websocket');
            this.connection = Stomp.over(socket);
            this.connection.connect({},
                () => {
                    this.connection.subscribe('/user/document', (payload: Message) => {
                        const message: FileWebsocketMessage = JSON.parse(payload.body);
                        if (message.type === FileWebsocketMessageType.OPERATION) {
                            this.$store.dispatch('document/applyRemoteOperation', JSON.parse(message.operation));
                        } else if (message.type === FileWebsocketMessageType.FILE_DELETED) {
                            this.deleteFile();
                        } else if (message.type === FileWebsocketMessageType.FILE_LOADED) {
                            this.$store.dispatch('document/loaded', true);
                        } else {
                            window.alert('We received an unknown message from the server, ' +
                                'perhaps your app version is out of date. Please refresh');
                        }
                    });
                },
                () => {
                    window.alert('You have been disconnected with the server, please refresh');
                },
            );

            loadCatalog((catalog) => {
                this.$store.dispatch("catalog/setDefault", catalog);
            })
        }

        deleteFile() {
            window.alert('The document has been deleted');
            window.location.reload();
        }

        destroyed() {
            // kill the socket
            this.connection.disconnect(() => {
                this.$store.dispatch('document/reset').then(() =>
                    this.$store.dispatch('document/loaded', false)
                );
            });
        }

        get document() {
            return this.$store.getters['document/document'];
        }

        get catalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        get catalogLoaded(): boolean {
            return this.$store.getters['catalog/loaded'];
        }

        get isLoading() {
            return !this.catalogLoaded || !this.document.loaded;
        }

    }
/*

 */
</script>

