<template>
  <div>
  <MainNavBar></MainNavBar>
  <b-container class="home">
    <b-row>
      <b-col>
        <h1 class="title">
          Your Documents
        </h1>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
      <b-card
              :title="documentState.drawing.generalInfo.title"
              img-src="https://conversionxl.com/wp-content/uploads/2013/03/blueprint-architecture.png"
              img-alt="Image"
              img-top
              tag="article"
              style="max-width: 20rem;"
              class="mb-2"
      >
        <b-card-text>
          Description of this file.
        </b-card-text>

        <b-button to="/document" variant="primary">Open Drawing</b-button>
      </b-card>
      </b-col>
    </b-row>
  </b-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MainNavBar from '@/components/MainNavBar.vue';
import { State, Action, Getter } from 'vuex-class';
import {DocumentState} from '@/store/document/types';


@Component({
  components: {
    MainNavBar,
  },
})
export default class Home extends Vue {
  @State('document') documentState!: DocumentState;
}
</script>

<style lang="less">
  h1 {
    padding-top: 50px;
  }
</style>
