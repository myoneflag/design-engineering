<template>
  <div id="app">
    <MainNavBar/>
    <router-view/>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import BootstrapVue from 'bootstrap-vue'
  import MainNavBar from "@/components/MainNavBar.vue";
  import Component from 'vue-class-component';

  import 'bootstrap/dist/css/bootstrap.css'
  import 'bootstrap-vue/dist/bootstrap-vue.css'

  // @ts-ignore
  import VueInputAutowidth from 'vue-input-autowidth'

  Vue.use(VueInputAutowidth);
  Vue.use(BootstrapVue);

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
