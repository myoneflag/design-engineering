<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import BootstrapVue from 'bootstrap-vue'
  import MainNavBar from "./components/MainNavBar.vue";
  import Component from 'vue-class-component';

  import 'bootstrap/dist/css/bootstrap.css'
  import 'bootstrap-vue/dist/bootstrap-vue.css'


  // @ts-ignore
  import VueResize from 'vue-resize'
  import 'vue-resize/dist/vue-resize.css'

  // @ts-ignore
  import VueInputAutowidth from 'vue-input-autowidth';
  // @ts-ignore
  import VueAwesome from 'vue-awesome';


  Vue.use(VueInputAutowidth);
  Vue.use(BootstrapVue);
  Vue.use(VueResize)
  Vue.component('v-icon', VueAwesome);

  @Component({
    components: {
      MainNavBar,
    },
  })

  export default class App extends Vue {};
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
