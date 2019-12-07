import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store/store';
import './registerServiceWorker';

// @ts-ignore
import VueInputAutowidth from 'vue-input-autowidth';
// @ts-ignore
import VueAwesome from 'vue-awesome';

import VueDragDrop from 'vue-drag-drop';
import VueCookies from 'vue-cookies';
import BootstrapVue from 'bootstrap-vue';
// @ts-ignore
import VueResize from 'vue-resize';
Vue.config.productionTip = false;
Vue.use(VueDragDrop);

Vue.use(VueCookies);

Vue.use(VueInputAutowidth);
Vue.use(BootstrapVue);
Vue.use(VueResize);
Vue.component('v-icon', VueAwesome);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');