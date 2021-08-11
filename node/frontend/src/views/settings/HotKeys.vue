<template>
    <b-container style="text-align: initial;">
        <div style="position: sticky; top: 0; z-index: 1; background: white; padding-bottom: 20px;">
            <b-alert show variant="info">
                <h4>Note</h4>
                <p>
                    Please see valid formats
                    <br>
                    * Combination of CTRL/SHIFT/ALT followed by plus sign (+) after each key and your desired key e.g. <b-badge variant="light">CTRL+ALT+F</b-badge>
                    <br>
                    * Without CTRL/SHIFT/ALT keys format should follow one space each key e.g. <b-badge variant="light">g i</b-badge>
                </p>
            </b-alert>
        </div>
        
        <b-form-group
            v-for="([field, props]) in Object.entries(formFields())"
            :key="field"
            label-cols-sm="4"
            label-align="center"
            :label="props.name"
            :label-for="'input-' + field"
        >
            <b-form-input 
                :id="'input-' + field"
                :disabled="isLoading"
                :value="getReactiveData(field)"
                @input="setReactiveData(field, $event)"
            ></b-form-input>
        </b-form-group>

        <b-row class="sticky-bottom">
            <b-col sm="4" offset-sm="8" class="text-center">
                <b-button variant="success" style="margin-right: 20px" @click="save" v-if="!isUnchanged" :disabled="isLoading">
                    Save <b-spinner v-if="isLoading" style="width: 1.0rem; height: 1.0rem;"></b-spinner>
                </b-button>
                <b-button v-if="isUnchanged" @click="back">Back to Project</b-button>
                <b-button v-else @click="revert" :disabled="isLoading">Revert</b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from "vue-class-component";
import * as _ from "lodash";
import { getPropertyByString, setPropertyByString } from '../../lib/utils';
import { cloneSimple } from '../../../../common/src/lib/utils';
import { initialHotKey } from '../../../../common/src/api/initialHotKey';
import { User } from '../../../../common/src/models/User';
import { add, update } from '../../api/hot-keys';

@Component({
    beforeRouteLeave(to, from, next) {
        if ((this as any).leave()) {
            next();
        } else {
            next(false);
        }
    }
})
export default class HotKeys extends Vue {
    hotKeyState: { [key: string]: string };
    isLoading: boolean;

    data() {
        return {
            hotKeyState: {},
            isLoading: false,
        }
    }

    created() {
        this.hotKeyState = cloneSimple(this.committedHotKeyState);
    }

    get committedHotKeyState(): { [key: string]: string } {
        return this.$store.getters["hotKey/setting"];
    }

    get isUnchanged() {
        return _.isEqual(this.hotKeyState, this.committedHotKeyState);
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    formFields() {
        return initialHotKey;
    }

    getReactiveData(prop: string) {
        return getPropertyByString(this.hotKeyState, prop);
    }

    setReactiveData(prop: string, value: any) {
        return setPropertyByString(this.hotKeyState, prop, value);
    }

    back() {
        this.$router.push({ name: "drawing" });
    }

    revert() {
        this.hotKeyState = cloneSimple(this.committedHotKeyState);
    }

    leave(): boolean {
        if (this.isUnchanged) {
            return true;
        } else {
            if (window.confirm("Leaving now will discard your changes. Are you sure?")) {
                return true;
            } else {
                return false;
            }
        }
    }

    async save() {
        this.isLoading = true;

        if (this.profile.hot_key) {
            await update({id: this.profile.hot_key.id, setting: this.hotKeyState}).then(res => {
                if (res.success) {
                    this.$store.dispatch("hotKey/setSetting", res.data);
                    this.hotKeyState = cloneSimple(this.committedHotKeyState);
                } else {
                    this.$bvToast.toast(res.message, {
                        variant: "danger",
                        title: "Error saving"
                    });
                }
            });
        } else {
            await add(this.hotKeyState).then(res => {
                if (res.success) {
                    this.$store.dispatch("profile/setProfile", res.data.user);
                    this.$store.dispatch("hotKey/setSetting", res.data.setting);
                    this.hotKeyState = cloneSimple(this.committedHotKeyState);
                } else {
                    this.$bvToast.toast(res.message, {
                        variant: "danger",
                        title: "Error saving"
                    });
                }
            });
        }

        this.isLoading = false;
    }
}
</script>

<style lang="css" scoped>
.sticky-bottom {
    position: -webkit-sticky;
    position: sticky;
    bottom: 0;
    padding: 15px 0px 12px 80px;
    background: #ffffff;
}
</style>
