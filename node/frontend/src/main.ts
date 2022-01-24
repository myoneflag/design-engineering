import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store/store";
import "./registerServiceWorker";

import VueYouTubeEmbed from "vue-youtube-embed";
import filters from "./views/filters";
Vue.use(filters);
// @ts-ignore
import VueInputAutowidth from "vue-input-autowidth";
// @ts-ignore
import VueAwesome from "vue-awesome";

import VueDragDrop from "vue-drag-drop";
import VueCookies from "vue-cookies";
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import { InputGroupPlugin } from 'bootstrap-vue';
// @ts-ignore
import VueResize from "vue-resize";
Vue.config.productionTip = false;
Vue.use(VueDragDrop);

Vue.use(VueCookies);

Vue.use(VueInputAutowidth);
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.use(InputGroupPlugin);
Vue.use(VueResize);
Vue.use(VueYouTubeEmbed);
Vue.component("v-icon", VueAwesome);

import { reportError } from "./api/error-report";


Vue.config.errorHandler = async (err, vm, msg) => {
    await reportError(msg.toString(), err);
    throw err;
};

window.onerror = async (message, source, lineno, colno, error) => {
    if (error) {
        await reportError(message.toString(), error);
        throw error;
    }
};

const vue = new Vue({
    router,
    store,
    render: (h) => h(App)
}).$mount("#app");

// @ts-ignore
document.vue = vue;
// @ts-ignore
document.store = store;
