import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store/store';
import './registerServiceWorker';
import StackTrace from 'stacktrace-js';

// @ts-ignore
import VueInputAutowidth from 'vue-input-autowidth';
// @ts-ignore
import VueAwesome from 'vue-awesome';

import VueDragDrop from 'vue-drag-drop';
import VueCookies from 'vue-cookies';
import BootstrapVue from 'bootstrap-vue';
// @ts-ignore
import VueResize from 'vue-resize';
import {submitErrorReport} from "./api/error-report";
Vue.config.productionTip = false;
Vue.use(VueDragDrop);

Vue.use(VueCookies);

Vue.use(VueInputAutowidth);
Vue.use(BootstrapVue);
Vue.use(VueResize);
Vue.component('v-icon', VueAwesome);

const sentErrors = new Set<string>();

window.onerror = async function(message, source, lineno, colno, error) {
    if (error) {
        if (sentErrors.has(message.toString())) {
            console.log("Want to send error but one has already been sent: " + message.toString());
            return;
        }
        sentErrors.add(message.toString());
        const betterTrace = await StackTrace.fromError(error);
        await submitErrorReport(store.getters.appVersion, message ? message.toString() : "[No Message]", error.name, JSON.stringify(betterTrace), window.location.href).then((res) => {
            if (res.success) {
                window.alert("An error occurred: " + message.toString() + ". Our developers have been notified and will find a fix as soon as they can. You should perhaps refresh the page - if you don't, the document may become unreliable.\n\nIf the issue persists and is preventing you from working, please contact our team and we will assist immediately. Thank you for your patience.");
            } else {
                window.alert("An error occurred, but we couldn't even report the error! D'oh! If this is not a network issue, please contact the developers. Message: " + message.toString() + " and why we couldn't report it: " + res.message.toString());
            }
        });
    }
};

const vue = new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
