<template>
    <div id='app'>
        <router-view/>
        <version-number/>
    </div>
</template>

<script lang='ts'>
    import Vue from 'vue';
    import BootstrapVue from 'bootstrap-vue';
    import MainNavBar from './components/MainNavBar.vue';
    import Component from 'vue-class-component';

    import 'bootstrap/dist/css/bootstrap.css';
    import 'bootstrap-vue/dist/bootstrap-vue.css';
    // @ts-ignore
    import VueResize from 'vue-resize';
    import 'vue-resize/dist/vue-resize.css';
    // @ts-ignore
    import VueInputAutowidth from 'vue-input-autowidth';
    // @ts-ignore
    import VueAwesome from 'vue-awesome';

    import VueDragDrop from 'vue-drag-drop';
    import VueCookies from 'vue-cookies';
    import VersionNumber from '@/components/VersionNumber.vue';
    import {MainEventBus} from '@/store/main-event-bus';
    import {registerObjectBuilders} from '@/htmlcanvas/objects';

    Vue.use(VueDragDrop);

    Vue.use(VueCookies);

    Vue.use(VueInputAutowidth);
    Vue.use(BootstrapVue);
    Vue.use(VueResize);
    Vue.component('v-icon', VueAwesome);

    registerObjectBuilders();

    @Component({
        components: {
            VersionNumber,
            MainNavBar,
        },
    })

    export default class App extends Vue {
        mounted() {
            document.onkeydown = (evt) => {
                if (document.activeElement === null || document.activeElement.nodeName.toLowerCase() !== 'input') {
                    MainEventBus.$emit('keydown', evt);
                }

                let isEscape = false;
                if ('key' in evt) {
                    isEscape = (evt.key === 'Escape' || evt.key === 'Esc');
                }
                if (isEscape) {
                    MainEventBus.$emit('escape-pressed');
                }
                if (evt.key === 'Delete' || evt.key === 'Del' || evt.key === 'Backspace') {
                    if (document.activeElement === null || document.activeElement.nodeName.toLowerCase() !== 'input') {
                        MainEventBus.$emit('delete-pressed');
                    }
                }
            };
        }
    }
</script>

<style lang='less'>

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
