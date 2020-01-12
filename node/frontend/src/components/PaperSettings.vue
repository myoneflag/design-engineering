<template>
    <b-row style="margin-top: 20px">
        <b-col cols="2">
            <label>{{ this.$props.title }}</label>
        </b-col>
        <b-col cols="1">
            <PaperSizeSelector :initial-size="this.paperSize" :onchange="setPaperSize" :disabled="disabled" />
        </b-col>
        <b-col> </b-col>
        <b-col cols="3">
            <b-form-input
                id="input-1"
                type="range"
                v-model="rangeValue"
                :disabled="disabled"
                min="0"
                :max="sensibleScales().length - 1"
                step="1"
            />
        </b-col>
        <b-col cols="2">
            <b-form-input :disabled="disabled" type="text" v-model="scaleText" />
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import PaperSizeSelector from "../views/CalculationOverview.vue";
import { PaperSize, SENSIBLE_SCALES } from "../../../common/src/paper-config";

@Component({
    props: {
        title: String,
        onPaperSizeChange: Function,
        onScaleChange: Function,
        disabled: Boolean,

        paperSize: String,
        scale: String
    },
    components: { PaperSizeSelector }
})
export default class PaperSettings extends Vue {
    internalScaleText: string = "1:100";
    internalRangeValue: number = 8;

    sensibleScales() {
        return SENSIBLE_SCALES;
    }

    setPaperSize(size: PaperSize) {
        if (this.$props.onPaperSizeChange) {
            this.$props.onPaperSizeChange(size);
        }
    }

    get scaleText() {
        return this.internalScaleText;
    }

    set scaleText(text: string) {
        const match: RegExpMatchArray | null = text ? text.match("^([0-9]+):([0-9]+)$") : null;
        if (match) {
            const a = parseInt(match[1], 10);
            const b = parseInt(match[2], 10);

            if (b !== 0 && a !== 0) {
                const ratio = a / b;

                // find closest ratio
                for (let i = 0; i < SENSIBLE_SCALES.length; i++) {
                    const iRatio = SENSIBLE_SCALES[i][0] / SENSIBLE_SCALES[i][1];
                    this.internalRangeValue = i;
                    if (iRatio >= ratio) {
                        break;
                    }
                }

                this.internalScaleText = text;
                if (this.$props.onScaleChange) {
                    this.$props.onScaleChange(a, b);
                }
            }
        }
    }

    mounted() {
        this.scaleText = this.$props.scale;
    }

    get rangeValue() {
        return this.internalRangeValue;
    }

    set rangeValue(value: number) {
        const [l, r] = SENSIBLE_SCALES[value];
        this.scaleText = l + ":" + r;
        this.internalRangeValue = value;
        if (this.$props.onScaleChange) {
            this.$props.onScaleChange(l, r);
        }
    }
}
</script>
