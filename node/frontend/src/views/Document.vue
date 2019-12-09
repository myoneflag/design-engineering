import {FileWebsocketMessageType} from "../../src/api/types";
<template>
    <div>
        <LoadingScreen v-if="isLoading"/>
        <RouterView v-else></RouterView>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import DrawingNavBar from '../components/DrawingNavBar.vue';
    import DrawingCanvas from '../../src/components/editor/DrawingCanvas.vue';


    import sockjs from 'sockjs-client';
    import Stomp, {Client, Message} from 'stompjs';
    import {DocumentWSMessage, DocumentWSMessageType} from '../../../common/src/api/types';
    import {loadCatalog} from '../../src/api/catalog';
    import LoadingScreen from '../../src/views/LoadingScreen.vue';
    import {Catalog} from '../../src/store/catalog/types';
    import {DocumentState} from '../../src/store/document/types';
    import {closeDocument, openDocument} from "../../src/api/document";
    import {MainEventBus} from "../store/main-event-bus";


    @Component({
        components: {LoadingScreen, DrawingCanvas, DrawingNavBar},
    })
    export default class Document extends Vue {
        closeExpected = false;

        uiMouseDisabled: boolean = false;

        mounted() {
            this.$store.dispatch('document/setId', Number(this.$route.params.id));
            openDocument(
                Number(this.$route.params.id),
                (op) => {
                    this.$store.dispatch('document/applyRemoteOperation', op);
                },
                () => {
                    this.deleteFile();
                },
                () => {
                    this.$store.dispatch('document/loaded', true);
                },
                (msg) => {
                    if (!this.closeExpected) {
                        this.$bvToast.toast(
                            'The connection to the server was lost, please refresh. ' +
                            'Changes from now will not be saved.\n' +
                            'reason: ' + msg,
                            {
                                variant: 'danger',
                                title: 'Connection Error',
                            }
                        )
                    }
                }
            );

            loadCatalog(Number(this.$route.params.id)).then((catalog) => {
                if (catalog.success) {
                    console.log('catalog success');
                    this.$store.dispatch('catalog/setDefault', catalog.data);
                } else {
                    console.log('catalog fail');
                    this.$bvToast.toast(catalog.message, {
                        title: 'Error retrieving catalog',
                        variant: 'Danger',
                    });
                }
            });

            MainEventBus.$on('disable-ui-mouse', this.disableUiMouse);
            MainEventBus.$on('enable-ui-mouse', this.enableUiMouse);
        }



        disableUiMouse() {
            this.uiMouseDisabled = true;
        }

        enableUiMouse() {
            this.uiMouseDisabled = false;
        }


        deleteFile() {
            window.alert('The document has been deleted');
            window.location.reload();
        }

        destroyed() {
            // kill the socket
            this.closeExpected = true;
            closeDocument(this.document.documentId).then(() => {
                this.$store.dispatch('document/reset').then(() =>
                    this.$store.dispatch('document/loaded', false),
                );
            });

            MainEventBus.$off('disable-ui-mouse', this.disableUiMouse);
            MainEventBus.$off('enable-ui-mouse', this.enableUiMouse);
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get catalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        get catalogLoaded(): boolean {
            return this.$store.getters['catalog/loaded'];
        }

        get isLoading() {
            return !this.catalogLoaded || !this.document.uiState.loaded;
        }

    }
/*

 */
</script>

<style>
    .disableMouseEvents {
        pointer-events: none;
    }
</style>

