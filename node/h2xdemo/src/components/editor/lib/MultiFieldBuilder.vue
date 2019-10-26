<template>
    <b-container>
        <PropertiesFieldBuilder
                :fields='fields'
                :reactiveData='reactiveData'
                :default-data='defaultData'
                :on-change='onChange'
                :on-commit='onCommit'
        >
        </PropertiesFieldBuilder>


        <b-row>
            <b-col>
                <b-button size='sm' variant='danger' @click='onDelete'>
                    Delete
                </b-button>
            </b-col>
        </b-row>
    </b-container>
</template>
<script lang='ts'>
    import Vue from 'vue';
    import BaseBackedObject from '../../../htmlcanvas/lib/base-backed-object';
    import {FieldType, PropertyField} from '@/store/document/entities/property-field';
    import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
    import {makeBackgroundFields} from '@/store/document/entities/background-entity';
    import {fillPipeDefaultFields, makePipeFields} from '@/store/document/entities/pipe-entity';
    import {fillValveDefaultFields, makeValveFields} from '@/store/document/entities/valve-entity';
    import Component from 'vue-class-component';
    import {EntityType} from '@/store/document/entities/types';
    import {DocumentState} from '@/store/document/types';
    import {Catalog} from '@/store/catalog/types';
    import {fillFlowSourceDefaults, makeFlowSourceFields} from '@/store/document/entities/flow-source-entity';
    import {fillTMVFields, makeTMVFields} from '@/store/document/entities/tmv/tmv-entity';
    import {fillFixtureFields, makeFixtureFields} from "@/store/document/entities/fixtures/fixture-entity";
    import PropertiesFieldBuilder from '@/components/editor/lib/PropertiesFieldBuilder.vue';
    import * as _ from 'lodash';
    import Pipe from '@/htmlcanvas/objects/pipe';

    @Component({
        components: {PropertiesFieldBuilder},
        props: {
            selectedObjects: Array,
            selectedEntities: Array,
            onChange: Function,
            onDelete: Function,
        },
    })
    export default class MultiFieldBuilder extends Vue {
        get fields() {
            let ret: PropertyField[] = [];
            const seen = new Set<string>();
            const types = new Set<EntityType>();
            this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                types.add(obj.entity.type);
            });

            let first = true;
            types.forEach((t) => {
                const fields = this.getEntityFields(t);
                if (first) {
                    fields.forEach((f) => {
                        if (!seen.has(f.multiFieldId!)) {
                            seen.add(f.multiFieldId!);
                            ret.push(f);
                        }
                    });
                } else {
                    const thisSet = new Set<string>(fields.map((f) => f.multiFieldId!));
                    ret = ret.filter((f) => thisSet.has(f.multiFieldId!));
                }
                first = false;
            });
            return this.convertToMultiProperties(ret);
        }

        convertToMultiProperties(fields: PropertyField[]): PropertyField[] {
            return fields.map((f) => {
                const ret =  _.clone(f);
                ret.property = ret.multiFieldId!;
                return ret;
            });
        }

        getEntityFields(type: EntityType): PropertyField[] {
            switch (type) {
                case EntityType.BACKGROUND_IMAGE:
                    return makeBackgroundFields().filter((p) => p.multiFieldId);
                case EntityType.VALVE:
                    return makeValveFields(
                        this.$store.getters['catalog/defaultValveChoices'],
                        this.document.drawing.flowSystems,
                    ).filter((p) => p.multiFieldId);
                case EntityType.PIPE:
                    return makePipeFields(
                        this.$store.getters['catalog/defaultPipeMaterialChoices'],
                        this.document.drawing.flowSystems,
                    ).filter((p) => p.multiFieldId);
                case EntityType.FLOW_SOURCE:
                    return makeFlowSourceFields(
                        this.$store.getters['catalog/defaultPipeMaterialChoices'],
                        this.document.drawing.flowSystems,
                    ).filter((p) => p.multiFieldId);
                case EntityType.TMV:
                    return makeTMVFields().filter((p) => p.multiFieldId);
                case EntityType.FIXTURE:
                    return makeFixtureFields().filter((p) => p.multiFieldId);
                case EntityType.FLOW_RETURN:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.SYSTEM_NODE:
                    throw new Error('Invalid object in multi select');
            }
        }

        fillObjectFields(obj: BaseBackedObject): DrawableEntityConcrete {
            switch (obj.entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    return obj.entity;
                case EntityType.VALVE:
                    return fillValveDefaultFields(this.document, obj.entity);
                case EntityType.PIPE:
                    return fillPipeDefaultFields(this.document.drawing, (obj as Pipe).computedLengthM, obj.entity);
                case EntityType.FLOW_SOURCE:
                    return fillFlowSourceDefaults(this.document, obj.entity);
                case EntityType.SYSTEM_NODE:
                    return obj.entity;
                case EntityType.TMV:
                    return fillTMVFields(this.document, this.defaultCatalog, obj.entity);
                case EntityType.FIXTURE:
                    return fillFixtureFields(this.document, this.defaultCatalog, obj.entity);
                case EntityType.RESULTS_MESSAGE:
                    throw new Error('Unsupported entity');
            }
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get defaultCatalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        getEmptyValue(type: FieldType) {
            switch (type) {
            case FieldType.Text:
            case FieldType.TextArea:
                return '';
            case FieldType.Rotation:
            case FieldType.Number:
                return '';
            case FieldType.Choice:
                return '(mixed)';
            case FieldType.FlowSystemChoice:
                return '(mixed)';
            case FieldType.Color:
                return {hex: '#eeeeee'};
            }
        }

        get defaultData() {
            return new Proxy({}, {
                get: (target, name, receiver): any => {
                    let concreteValue: any = null;
                    let concreteIdentical = true;
                    let foundField: PropertyField;
                    this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                        const fields = this.getEntityFields(obj.type);
                        const field = fields.find((f) => f.multiFieldId === name);
                        if (field) {
                            foundField = field;
                            const defVal = (this.fillObjectFields(obj) as any)[field.property];
                            const conVal = (obj.entity as any)[field.property];
                            const dispVal = conVal === null ? defVal : conVal;
                            if (concreteValue === null || concreteValue === dispVal) {
                                concreteValue = dispVal;
                            } else {
                                concreteIdentical = false;
                            }
                        }
                    });

                    if (concreteIdentical) {
                        return concreteValue;
                    } else {
                        return this.getEmptyValue(foundField!.type);
                    }
                },
            });
        }

        get reactiveData() {
            return new Proxy({}, {

                get: (target, name, receiver) => {
                    // Undefined means mixed and input value will be default.
                    // Null means definitely computed or definitely default.
                    // Value means all items were explicit and has same value.
                    let concreteValue: any;
                    let concreteIdentical = true;
                    let allDefaultOrCalculated = true;
                    let someDefaultOrCalculated = false;
                    let foundField: PropertyField;
                    this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                        const fields = this.getEntityFields(obj.type);
                        const field = fields.find((f) => f.multiFieldId === name);
                        if (field) {
                            foundField = field;
                            const val = (obj.entity as any)[field.property];
                            if (val !== null) {
                                if (concreteValue === undefined || concreteValue === val) {
                                    concreteValue = val;
                                } else {
                                    concreteIdentical = false;
                                }
                                allDefaultOrCalculated = false;
                            } else {
                                someDefaultOrCalculated = true;
                            }
                        }
                    });

                    if (allDefaultOrCalculated) {
                        return null;
                    } else if (someDefaultOrCalculated) {
                        return undefined;
                    } else if (concreteIdentical) {
                        return concreteValue;
                    } else {
                        return this.getEmptyValue(foundField!.type);
                    }
                },
                set: (target, name, value, receiver) => {
                    let success = false;
                    this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                        const fields = this.getEntityFields(obj.type);
                        const field = fields.find((f) => f.multiFieldId === name);
                        if (field) {
                            (obj.entity as any)[field.property] = value;
                            success = true;
                        }
                    });
                    return success;
                },
            });
        }

        onCommit() {
            this.$store.dispatch('document/commit');
        }
    }
</script>
