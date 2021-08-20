<template>
    <div class="locale-selector  m-2">
        <b-toast id="locale-toast" variant="success" toaster="b-toaster-top-left" toast-class="locale"  solid>
            <template #toast-title >
                <div class="d-flex flex-grow-1 align-items-baseline">
                    <span>Home set to {{ localeName }}</span>
                </div>
            </template>
            <span>
                New projects will now be created with defaults for {{localeName}}. <br/>
                This includes:</span>
            <ul>
                 
                <li>Relevant pipe materials</li>
                <li>{{locale==SupportedLocales.US ? "Imperial": "Metric"}} units 
                    {{locale==SupportedLocales.US ? "(psi, feet, gallons)" : locale==SupportedLocales.UK ? "(bar, meters, litres)" : "(kPa, meters, litres)" }}</li> 
                <li>Industry-standard parameters</li>
                <li>{{currency.symbol}} {{currency.name}} currency </li>
            </ul>
        </b-toast>
        <img v-if="isActiveLocale(SupportedLocales.UK)"
             class="flag active"
             :src="require('../assets/flags/UK.svg')"
        />

        <img v-if="isActiveLocale(SupportedLocales.AU)"
             class="flag active"
             :src="require('../assets/flags/AU.svg')"
        />
        <img v-if="isActiveLocale(SupportedLocales.US)"
             class="flag active"
             :src="require('../assets/flags/US.svg')"
        />

        <img v-if="isActiveLocale(SupportedLocales.UK)"
             class="flag disabled"
             :src="require('../assets/flags/UK.svg')"
        />
        <img
            v-else
             class="flag"
             :src="require('../assets/flags/UK.svg')"
             v-b-tooltip="'Change locale to UK'"
             @click="changeLocale(SupportedLocales.UK)"
        />
        <img v-if="isActiveLocale(SupportedLocales.AU)"
             class="flag disabled"
             :src="require('../assets/flags/AU.svg')"
        />
        <img
            v-else
            class="flag"
             :src="require('../assets/flags/AU.svg')"
             v-b-tooltip="'Change locale to AU'"
             @click="changeLocale(SupportedLocales.AU)"
        />
        <img v-if="isActiveLocale(SupportedLocales.US)"
             class="flag disabled"
             :src="require('../assets/flags/US.svg')"
        />
        <img
            v-else
            class="flag"
             :src="require('../assets/flags/US.svg')"
             v-b-tooltip="'Change locale to US'"
             @click="changeLocale(SupportedLocales.US)"
        />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from "vue-class-component";
import {User} from "../../../common/src/models/User";
import { LOCALE_NAMES, SupportedLocales } from "../../../common/src/api/locale";
    import { I18N } from "@../../../common/src/api/locale/values";

@Component
export default class LocaleSelector extends Vue {
    get auth(): User | null {
        return this.$store.getters['profile/profile'];
    }

    get locale() {
        console.log(this.$store.getters['profile/locale']);
        return this.$store.getters['profile/locale']
    }

    set locale(locale: SupportedLocales) {
        this.$store.dispatch('profile/setLocale', locale)
    }

    get SupportedLocales() {
        return SupportedLocales;
    }
    get currency(){
        return {symbol:I18N.currencySymbol[this.locale],name: I18N.currency[this.locale]}
    }
    isActiveLocale(locale: string) {
        return locale === this.locale;
    }
    get localeName(){
        return LOCALE_NAMES[this.locale];
    }
    changeLocale(locale: SupportedLocales) {
        this.$bvToast.show('locale-toast');
        this.locale=locale;
    }
}
</script>

<style scoped lang="less">
    .locale-selector {
        position: fixed;
        display: block;
        left: 0;
        .flag {
            width: 60px;
            padding: 5px;
            display: none;
            &.active {
                display: inline-block;
                width: 70px;
            }
        }

        &:hover {
            z-index: 1000;
            img.flag {
                filter: opacity(20%);
                display: inline-block;
                &:hover, &.disabled, &.active {
                    filter: none;
                }
                &.disabled {
                    outline: 1px solid blue;
                }
            }
        }
    }
</style>