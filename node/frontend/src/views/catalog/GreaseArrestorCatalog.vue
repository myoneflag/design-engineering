<template>
    <b-row>
        <b-col cols="12">
            <h4 style="text-align: left">
                <router-link :to="navigateLink()">
                    Grease Arrestor
                </router-link>
                <span v-if="!$route.params.prop">
                    <b-button
                        v-b-toggle="'collapse'"
                        class="float-right"
                        size="sm"
                        variant="primary"
                    >
                        Show / Hide
                    </b-button>
                </span>
            </h4>
        </b-col>
        <b-col cols="12">
            <b-collapse id="collapse" v-if="!$route.params.prop">
                <b-form-group 
                    :label-cols="3" 
                    label="Manufacturer"
                    class="manufacturer-field mt-4"
                >
                    <b-button 
                        v-for="manufacturer in catalog.manufacturer" :key="manufacturer.name"
                        size="sm" 
                        class="manufacturer-item-btn"
                        :variant="manufacturer.uid === selectedManufacturer 
                            ? 'primary' 
                            : 'outline-primary'"
                        @click="(e) => handleSelectManufacturerClick(manufacturer.uid)"
                    >
                        {{ manufacturer.name }}
                    </b-button> 
                </b-form-group>
                <b-table
                    striped
                    responsive
                    selectable
                    select-mode="single"
                    style="margin-top:25px"
                    :items="locationItems"
                    :fields="['Location']"
                    @row-selected="(rowProp) => handleSelectLocationClick(rowProp[0]._key)"
                >
                </b-table>
            </b-collapse>
            <template v-else>
                <div class="catalog-container">
                    <b-form-group label="Manufacturer" v-slot="{ ariaDescribedby }">
                        <b-form-radio-group
                            buttons
                            name="manufacturer"
                            button-variant="outline-primary"
                            :aria-describedby="ariaDescribedby"
                            :options="catalog.manufacturer.map(i => ({text: i.name, value: i.uid}))"
                            v-model="form.manufacturer"
                            @change="handleSelectManufacturerClick"
                        ></b-form-radio-group>
                    </b-form-group>
                    <b-form-group label="Location" v-slot="{ ariaDescribedby }">
                        <b-form-radio-group
                            buttons
                            name="location"
                            button-variant="outline-primary"
                            :aria-describedby="ariaDescribedby"
                            :options="catalog.location.map(i => ({text: i.name, value: i.uid}))"
                            v-model="form.location"
                            @change="handleSelectLocationClick"
                        ></b-form-radio-group>
                    </b-form-group>
                    <b-table
                        striped
                        responsive
                        style="margin-top:25px"
                        :items="items.belowGround"
                        :fields="fields"
                    >
                        <template #thead-top>
                            <b-tr>
                                <b-th class="text-center" colspan="5" variant="warning">Below Ground</b-th>
                            </b-tr>
                        </template>
                    </b-table>
                    <b-table
                        striped
                        responsive
                        style="margin-top:25px"
                        :items="items.aboveGround"
                        :fields="fields"
                    >
                        <template #thead-top>
                            <b-tr>
                                <b-th class="text-center" colspan="5" variant="warning">Above Ground</b-th>
                            </b-tr>
                        </template>
                    </b-table>
                </div>
            </template>
        </b-col>
    </b-row>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { DocumentState } from '../../store/document/types';
import { GreaseArrestor } from '../../../../common/src/api/catalog/types';
import { DrawingState } from '../../../../common/src/api/document/drawing';

@Component
export default class GreaseArrestorCatalog extends Vue {
    fields = [
        { key: 'size', label: 'Size' },
        { key: 'lengthMM', label: 'Length(mm)' },
        { key: 'widthMM', label: 'Width(mm)' },
        { key: 'result', label: 'Result' },
        { key: 'result2', label: '' },
    ];

    form = {
        manufacturer: '',
        location: '',
    }

    mounted() {
        this.form.manufacturer = this.selectedManufacturer;
        this.form.location = this.$route.params.prop !== 'greaseArrestor' 
            && this.$route.params.prop?.replace('greaseArrestor.','') 
            || 'nsw';
    }
    
    get document(): DocumentState {
        return this.$store.getters['document/document'];
    }

    get metadata(): DrawingState['metadata'] {
        return this.document.drawing.metadata;
    }
    
    get catalog(): GreaseArrestor {
        return this.$store.getters["catalog/default"].greaseArrestor;
    }

    get selectedManufacturer(): string {
        return this.document.drawing.metadata.catalog.greaseArrestor[0]?.manufacturer || 'generic';
    }
    
    get locationItems(): Array<{ [key: string]: string; _key: string }> {
        return this.catalog.location.map(location => ({
            _key: location.uid,
            'Location': location.name,
        }));
    }

    get items() {
        return {
            belowGround: this.resolveItem('belowGround'),
            aboveGround: this.resolveItem('aboveGround'),
        };
    }

    resolveItem(position: 'belowGround' | 'aboveGround') {
        return this.form.location 
            ? Object.values(this.catalog.size[this.selectedManufacturer][this.form.location][position])
                .map(value => {
                    let item = {};
                    this.fields.forEach(field => {
                        if (field.key === 'result') {
                            item[field.key] = value[field.key][0];
                        } else if (field.key === 'result2') {
                            item[field.key] = value['result'][1];
                        } else {
                            item[field.key] = value[field.key];
                        }
                    })
                    return item;
                })
            : [];
    }

    navigateLink(location = null) {
        let prop = 'greaseArrestor';
        if (location) prop += `.${location}`;

        return {
            name: "settings/catalog",
            params: {
                prop
            }
        };
    }

    handleSelectManufacturerClick(manufacturer: string) {
        this.form.manufacturer = manufacturer;
        this.metadata.catalog.greaseArrestor.splice(0, 1, {uid: 'greaseArrestor', manufacturer, selected: null});
        this.$emit('save');
    }

    handleSelectLocationClick(location: string) {
        this.form.location = location;
        this.$router.push(this.navigateLink(location));
    }
}
</script>
<style>
    .manufacturer-item-btn {
        display: block;
        width: 100%;
        margin-bottom: 6px;
    }

    .manufacturer-field .col {
        text-align: left;
    }

    .catalog-container {
        text-align: initial;
        margin-top: 25px;
    }
</style>