<template>
    <div class="currency-selector-buttons">
        <span
            :class="currency.symbol === CurrencySymbol.DOLLARS && 'active'"
            @click="handleClick(CurrencySymbol.DOLLARS)"
            :disabled="disabled"
        >
            {{ CurrencySymbol.DOLLARS }}
        </span>
        <span
            :class="currency.symbol === CurrencySymbol.POUNDS && 'active'"
            @click="handleClick(CurrencySymbol.POUNDS)"
            :disabled="disabled"
        >
            {{ CurrencySymbol.POUNDS }}
        </span>
        <b-input-group append="%" class="ml-2" >
            <b-input type="number" v-model="currency.multiplierPct" v-b-tooltip.bottom="{title: 'multiplier'}" :readonly="disabled"/>
        </b-input-group>
    </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { CurrencySymbol } from "../../../../common/src/lib/measurements";
import { DocumentState } from "../../store/document/types";

@Component({
    props: {
        disabled: Boolean,
    }
})
export default class CurrencySelector extends Vue {
    CurrencySymbol = CurrencySymbol;

    get document(): DocumentState {
        return this.$store.getters['document/document'];
    }

    get currency() {
        return this.document.drawing.metadata.units.currency;
    }

    handleClick(symbol: CurrencySymbol) {
        if (!this.$props.disabled) {
            this.currency.symbol = symbol;
        }
    }
}
</script>
<style scoped lang="less">

.currency-selector-buttons {
    display: flex;
    align-items: center;
    span {
        &:hover:not([disabled]) {
            cursor: pointer;
            background-color: rgba(255, 255, 255, 1);
        }
        width: 60px;
        height: 40px;
        align-items: center;
        justify-content: center;
        display: flex;
        &.active {
            border: 1px solid blue;
            background-color: rgba(0, 0, 255, 0.1);
        }
    }
}

</style>
