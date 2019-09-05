<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import BootstrapVue from "bootstrap-vue";
    import MainNavBar from "./components/MainNavBar.vue";
    import Component from "vue-class-component";

    import "bootstrap/dist/css/bootstrap.css";
    import "bootstrap-vue/dist/bootstrap-vue.css";
    import sockjs from 'sockjs-client';
    import Stomp, {Client, Message} from "stompjs";


    // @ts-ignore
    import VueResize from "vue-resize";
    import "vue-resize/dist/vue-resize.css";

    // @ts-ignore
    import VueInputAutowidth from "vue-input-autowidth";
    // @ts-ignore
    import VueAwesome from "vue-awesome";

    import VueDragDrop from "vue-drag-drop";

    Vue.use(VueDragDrop);

    import VueCookies from "vue-cookies";

    Vue.use(VueCookies);

    Vue.use(VueInputAutowidth);
    Vue.use(BootstrapVue);
    Vue.use(VueResize);
    Vue.component("v-icon", VueAwesome);

    @Component({
        components: {
            MainNavBar,
        },
    })

    export default class App extends Vue {

        connection!: Client;

        mounted() {
            let socket = sockjs('/api/websocket');
            console.log("Connecting to websocket");
            this.connection = Stomp.over(socket);
            this.connection.connect({}, () => {
                    console.log("Connected to websocket");
                    this.connection.subscribe('/user/document', (payload: Message) => {
                        console.log("Got message from websocket: " + JSON.stringify(payload));
                        this.$store.dispatch('document/applyRemoteOperation', JSON.parse(payload.body));
                    })
                }
            );
        }

        destroyed() {
            this.connection.disconnect(() => {
                console.log("Document websocket disconnected");
                this.$store.dispatch('document/reset');
            });
        }

    };
</script>

<style lang="less">

#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    }

    body {
        background-color: #f8f9fa;
    }
</style>
