<template>
    <b-row>
        <b-col cols="12">
            <h4 style="text-align: left">
                <router-link :to="navigateLink()">
                    Grease Interceptor Trap
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
                            stacked
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
                        style="margin-top:25px;margin-bottom:0px;"
                        :items="items.belowGround"
                        :fields="fields"
                    >
                        <template #thead-top>
                            <b-tr>
                                <b-th class="text-center" colspan="6" variant="warning">Below Ground</b-th>
                            </b-tr>
                        </template>
                    </b-table>
                    <b-table
                        striped
                        responsive
                        :items="items.aboveGround"
                        :fields="fields"
                    >
                        <template #thead-top>
                            <b-tr>
                                <b-th class="text-center" colspan="6" variant="warning">Above Ground</b-th>
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
import { GreaseInterceptorTrap } from '../../../../common/src/api/catalog/types';
import { DrawingState } from '../../../../common/src/api/document/drawing';
import { Watch } from 'vue-property-decorator';

@Component
export default class GreaseInterceptorTrapCatalog extends Vue {
    fields = [
        { key: 'capacity', label: 'Capacity(L)' },
        { key: 'lengthMM', label: 'Length(mm)' },
        { key: 'widthMM', label: 'Width(mm)' },
        { key: 'heightMM', label: 'Height(mm)' },
        { key: 'product', label: 'Product' },
        { key: 'code', label: 'Code' },
    ];

    form = {
        manufacturer: '',
        location: '',
    }

    mounted() {
        this.form.manufacturer = this.selectedManufacturer;
        this.form.location = this.$route.params.prop !== 'greaseInterceptorTrap' 
            && this.$route.params.prop?.replace('greaseInterceptorTrap.','') 
            || 'nsw';

        if (this.selectedManufacturer === 'generic') {
            this.fields.splice(4, 1);
        }
    }
    
    get document(): DocumentState {
        return this.$store.getters['document/document'];
    }

    get metadata(): DrawingState['metadata'] {
        return this.document.drawing.metadata;
    }
    
    get catalog(): GreaseInterceptorTrap {
        return this.$store.getters["catalog/default"].greaseInterceptorTrap;
    }

    get selectedManufacturer(): string {
        return this.document.drawing.metadata.catalog.greaseInterceptorTrap![0]?.manufacturer || 'generic';
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

    @Watch('selectedManufacturer')
    resolveTableFields(val: string) {
        if (this.selectedManufacturer === 'generic') {
            this.fields.splice(4, 1);
        } else {
            this.fields.splice(4, 0, { key: 'product', label: 'Product' });
        }
    }

    resolveItem(position: 'belowGround' | 'aboveGround') {
        return this.form.location 
            ? Object.entries(this.catalog.size[this.selectedManufacturer][this.form.location][position])
                .sort((a, b) => a[1].capacity - b[1].capacity)
                .map(([key, value]) => {
                    let item: {[key: string]: any} = {};
                    this.fields.forEach(field => {
                        if (field.key === 'code') {
                            item[field.key] = value['capacity'];
                        } else if (field.key === 'capacity') {
                             item[field.key] = key;
                        } else {
                            item[field.key] = value[field.key];
                        }
                    })
                    return item;
                })
            : [];
    }

    navigateLink(location = '') {
        let prop = 'greaseInterceptorTrap';
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
        this.metadata.catalog.greaseInterceptorTrap!.splice(0, 1, {uid: 'greaseInterceptorTrap', manufacturer, selected: null});
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