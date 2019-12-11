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
import {submitErrorReport, updateErrorReport} from "./api/error-report";
Vue.config.productionTip = false;
Vue.use(VueDragDrop);

Vue.use(VueCookies);

Vue.use(VueInputAutowidth);
Vue.use(BootstrapVue);
Vue.use(VueResize);
Vue.component('v-icon', VueAwesome);

const sentErrors = new Set<string>();

async function reportError(message: string, error: Error) {
    if (sentErrors.has(message.toString())) {
        return;
    }
    sentErrors.add(message.toString());
    submitErrorReport(
        store.getters.appVersion,
        message ? message.toString() : "[No Message]",
        error.name,
        error.stack || "No Stack",
        window.location.href
    ).then((res) => {
        if (res.success) {
            StackTrace.fromError(error).then((trace) => {
                updateErrorReport(
                    res.data.id,
                    undefined,
                    trace.map(
                        (frame) => frame.functionName + ' ' +
                            frame.fileName + ':' +
                            frame.columnNumber + ':' +
                            frame.lineNumber
                    ).join("\n")
                );
            });
            const msgstr = "An error occurred: " + message.toString() + ". Our developers have been notified and " +
                "will find a fix as soon as they can. You should perhaps refresh the page - if you don't, the " +
                "document may become unreliable. If the issue persists and is preventing you from working, " +
                "please contact our team and we will assist immediately. Thank you for your patience.";

            if (vue) {
                vue.$bvModal.msgBoxOk(msgstr);
            } else {
                window.alert(msgstr);
            }
        } else {
            const msgstr = "An error occurred, but we couldn't even report the error! D'oh! If this is not a " +
                "network issue, please contact the developers. Message: " + message.toString() + " and why we " +
                "couldn't report it: " + res.message.toString();
            if (vue) {
                vue.$bvModal.msgBoxOk(msgstr);
            } else {
                window.alert(msgstr);
            }
        }
    });
}

Vue.config.errorHandler = async (err, vm, msg) => {
    await reportError('From Vue: ' + msg, err);
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
  render: (h) => h(App),
}).$mount('#app');
