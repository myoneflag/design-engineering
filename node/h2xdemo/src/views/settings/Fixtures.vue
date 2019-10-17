<template>
    <SettingsFieldBuilder
            ref="fields"
            :fields="[]"
            :reactiveData="{availableFixtureUids}"
            :originalData="{availableFixtureUids: document.committedDrawing.availableFixtures}"
            :onSave="save"
            :onBack="back"
            :on-revert="onRevert"
            >
        <b-row>
            <b-col>
                <h5>
                    Click to add / remove
                </h5>
            </b-col>
        </b-row>

        <b-row style="margin-bottom: 20px">
            <b-col cols="6">
                <h4>
                    Disabled Fixtures
                </h4>
                <b-list-group>
                    <b-list-group-item
                            v-for="fixture in unavailableFixtures"
                            @click="makeAvailable(fixture.uid)"
                            href="#"
                    >{{ fixture.name }}</b-list-group-item>
                </b-list-group>
            </b-col>
            <b-col cols="6">
                <h4>
                    Available Fixtures
                </h4>
                <b-list-group>
                    <b-list-group-item
                            @click="makeUnavailable(fixture.uid)"
                            v-for="fixture in availableFixtures"
                            href="#"
                    >{{ fixture.name }}</b-list-group-item>
                </b-list-group>
            </b-col>
        </b-row>
    </SettingsFieldBuilder>
</template>

<script lang="ts">

    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {DocumentState} from '@/store/document/types';
    import SettingsFieldBuilder from '@/components/editor/lib/SettingsFieldBuilder.vue';
    import {PIPE_SIZING_METHODS, DISPLAY_PSD_METHODS, RING_MAIN_CALCULATION_METHODS, getPsdMethods} from "@/config";
    import {Catalog, FixtureSpec} from "@/store/catalog/types";

    @Component({
        components: {SettingsFieldBuilder},
        beforeRouteLeave(to, from, next) {
            if ((this.$refs.fields as any).leave()) {
                next();
            } else {
                next(false);
            }
        },
    })
    export default class Fixtures extends Vue {


        get fields(): any[][] {
            return [
                ['psdMethod', 'PSD Calculation Method:', 'choice', getPsdMethods(this.$store.getters['catalog/default'])],
                ['pipeSizingMethod', 'Pipe Sizing Method:', 'choice', PIPE_SIZING_METHODS],
                ['ringMainCalculationMethod', 'Ring Main Calculation Method:', 'choice', RING_MAIN_CALCULATION_METHODS],
            ];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get effectiveCatalog(): Catalog {
            return this.$store.getters['effectiveCatalog'];
        }

        get unavailableFixtureUids(): string[] {
            return Object.keys(this.effectiveCatalog.fixtures).filter((f) => this.availableFixtureUids.indexOf(f) === -1);
        }

        get availableFixtureUids(): string[] {
            return this.document.drawing.availableFixtures;
        }

        get availableFixtures(): FixtureSpec[] {
            return this.availableFixtureUids.map((i) => this.effectiveCatalog.fixtures[i]);
        }

        get unavailableFixtures(): FixtureSpec[] {
            return this.unavailableFixtureUids.map((i) => this.effectiveCatalog.fixtures[i]);
        }

        makeAvailable(fuid: string) {
            this.document.drawing.availableFixtures.push(fuid);
        }

        makeUnavailable(fuid: string) {
            const index = this.document.drawing.availableFixtures.indexOf(fuid);
            this.document.drawing.availableFixtures.splice(index, 1);
        }

        onRevert() {
            this.document.drawing.availableFixtures.splice(0);
            this.document.drawing.availableFixtures.push(...this.document.committedDrawing.availableFixtures);
        }

        save() {
            this.$store.dispatch('document/commit').then(() => {
                this.$bvToast.toast('Saved successfully!', {variant: 'success', title: 'Success'});
            });
        }

        back() {
            this.$router.push({ name: 'drawing'});
        }
    }

</script>

<style lang="less">

</style>
