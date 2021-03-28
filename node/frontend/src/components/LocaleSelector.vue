<template>
    <div class="locale-selector">
        <img v-if="isActiveLocale('uk')"
             class="flag active"
             :src="require('../assets/flags/UK.svg')"
        />

        <img v-if="!isActiveLocale('uk')"
             class="flag"
             :src="require('../assets/flags/UK.svg')"
             v-b-tooltip="'Change locale to UK'"
             @click="changeLocale('uk')"
        />
        <img v-if="isActiveLocale('au')"
             class="flag active"
             :src="require('../assets/flags/AU.svg')"
        />
        <img v-if="!isActiveLocale('au')"
             class="flag"
             :src="require('../assets/flags/AU.svg')"
             v-b-tooltip="'Change locale to AU'"
             @click="changeLocale('au')"
        />
        <img v-if="isActiveLocale('us')"
             class="flag active"
             :src="require('../assets/flags/US.svg')"
        />

        <img v-if="!isActiveLocale('us')"
             class="flag"
             :src="require('../assets/flags/US.svg')"
             v-b-tooltip="'Change locale to US'"
             @click="changeLocale('us')"
        />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from "vue-class-component";
import {User} from "../../../common/src/models/User";
import { LOCALE_NAMES, SupportedLocales } from "../../../common/src/api/locale";

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

    isActiveLocale(locale: string) {
        return locale === this.locale;
    }

    changeLocale(locale: SupportedLocales) {
        this.$bvToast.toast(
            `New projects will now be created with defaults for ${LOCALE_NAMES[locale]}`,
            {variant: 'success', title: "Home set to " + LOCALE_NAMES[locale]}
        )
        this.locale = locale;
    }
}
</script>

<style scoped lang="less">
    .locale-selector {
        position: fixed;
        display: block;
        left: 0;
        .flag {
            width: 70px;
            padding: 5px;
            display: none;
            &.active {
                display: inline-block;
                transition: all 0.5s;
            }
        }

        &:hover {
            z-index: 1000;
            margin-top: -1px;
            img.flag {
                filter: grayscale(80%);
                display: inline-block;
                &:hover, &.active {
                    filter: none;
                }
                &.active {
                    outline: 1px solid blue;
                }
            }
        }
    }
</style>