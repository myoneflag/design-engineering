import { FieldType } from "../../../../../common/src/api/document/entities/property-field";
import {EntityType} from "../../../store/document/entities/types";
<template>
    <b-container>
        <PropertiesFieldBuilder
                :fields="fields"
                :reactiveData="reactiveData"
                :default-data="defaultData"
                :on-change="onChange"
                :on-commit="onCommit"
        >
        </PropertiesFieldBuilder>

        <b-row>
            <b-col>
                <b-button size="sm" variant="danger" @click="onDelete">
                    Delete
                </b-button>
            </b-col>
        </b-row>
    </b-container>
</template>
<script lang="ts">
    import Vue from "vue";
    import BaseBackedObject from "../../../htmlcanvas/lib/base-backed-object";
    import {
        ChoiceField,
        FieldType,
        PropertyField
    } from "../../../../../common/src/api/document/entities/property-field";
    import { DrawableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
    import { makeBackgroundFields } from "../../../../../common/src/api/document/entities/background-entity";
    import { fillPipeDefaultFields, makePipeFields } from "../../../../../common/src/api/document/entities/pipe-entity";
    import {
        fillValveDefaultFields,
        makeValveFields
    } from "../../../../../common/src/api/document/entities/fitting-entity";
    import Component from "vue-class-component";
    import { EntityType } from "../../../../../common/src/api/document/entities/types";
    import { DocumentState } from "../../../../src/store/document/types";
    import { fillRiserDefaults, makeRiserFields } from "../../../../../common/src/api/document/entities/riser-entity";
    import {
        fillDefaultBigValveFields,
        makeBigValveFields
    } from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
    import {
        fillFixtureFields,
        makeFixtureFields
    } from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
    import PropertiesFieldBuilder from "../../../../src/components/editor/lib/PropertiesFieldBuilder.vue";
    import Pipe from "../../../../src/htmlcanvas/objects/pipe";
    import { makeDirectedValveFields } from "../../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
    import { makeLoadNodesFields } from "../../../../../common/src/api/document/entities/load-node-entity";
    import { getPropertyByString, setPropertyByString } from "../../../lib/utils";
    import {
        fillFlowSourceDefaults,
        makeFlowSourceFields
    } from "../../../../../common/src/api/document/entities/flow-source-entity";
    import {
        fillPlantDefaults,
        makePlantEntityFields
    } from "../../../../../common/src/api/document/entities/plant-entity";
    import { assertUnreachable } from "../../../../../common/src/api/config";
    import { Catalog } from "../../../../../common/src/api/catalog/types";
    import { cloneSimple } from "../../../../../common/src/lib/utils";
    import { fillDirectedValveFields } from "../../../store/document/entities/fillDirectedValveFields";
    import { fillDefaultLoadNodeFields } from "../../../store/document/entities/fillDefaultLoadNodeFields";

    @Component({
        components: { PropertiesFieldBuilder },
        props: {
            selectedObjects: Array,
            selectedEntities: Array,
            onChange: Function,
            onDelete: Function,
            objectStore: Map
        }
    })
    export default class MultiFieldBuilder extends Vue {
        get fields() {
            let ret: PropertyField[] = [];
            const seen = new Map<string, PropertyField>();
            const types = new Set<EntityType>();
            let first = true;
            this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                const fields = this.getEntityFields(obj.entity);
                if (first) {
                    fields.forEach((f) => {
                        if (!seen.has(f.multiFieldId!)) {
                            seen.set(f.multiFieldId!, f);
                            ret.push(f);
                        } else {
                            if (f.type === FieldType.Choice) {
                                const op = seen.get(f.multiFieldId!) as ChoiceField;
                                op.params.choices = op.params.choices.filter((c) =>
                                    f.params.choices.find((cc) => cc.key === c.key)
                                );
                            }
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
                const ret = cloneSimple(f);
                ret.property = ret.multiFieldId!;
                return ret;
            });
        }

        getEntityFields(entity: DrawableEntityConcrete): PropertyField[] {
            switch (entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    return makeBackgroundFields().filter((p) => p.multiFieldId);
                case EntityType.FITTING:
                    return makeValveFields(
                        this.$store.getters["catalog/defaultValveChoices"],
                        this.document.drawing.metadata.flowSystems
                    ).filter((p) => p.multiFieldId);
                case EntityType.PIPE:
                    return makePipeFields(
                        entity,
                        this.$store.getters['catalog/default'],
                        this.document.drawing,
                    ).filter((p) => p.multiFieldId);
                case EntityType.RISER:
                    return makeRiserFields(
                        entity,
                        this.$store.getters['catalog/default'],
                        this.document.drawing,
                    ).filter((p) => p.multiFieldId);
                case EntityType.BIG_VALVE:
                    return makeBigValveFields(entity).filter((p) => p.multiFieldId)
                        .filter((p) => p.multiFieldId);
                case EntityType.FIXTURE:
                    return makeFixtureFields(this.document.drawing, entity).filter((p) => p.multiFieldId)
                        .filter((p) => p.multiFieldId);
                case EntityType.DIRECTED_VALVE:
                    return makeDirectedValveFields(
                        entity,
                        this.$store.getters['catalog/default'],
                        this.document.drawing,
                    ).filter(
                        (p) => p.multiFieldId
                    ).filter((p) => p.multiFieldId);
                case EntityType.SYSTEM_NODE:
                    throw new Error("Invalid object in multi select");
                case EntityType.LOAD_NODE:
                    return makeLoadNodesFields(this.document.drawing.metadata.flowSystems, entity)
                        .filter((p) => p.multiFieldId);
                case EntityType.FLOW_SOURCE:
                    return makeFlowSourceFields(
                        this.$store.getters["catalog/defaultPipeMaterialChoices"],
                        this.document.drawing.metadata.flowSystems,
                    ).filter((p) => p.multiFieldId);
                case EntityType.PLANT:
                    return makePlantEntityFields(entity, this.document.drawing.metadata.flowSystems);
            }
            assertUnreachable(entity);
        }

        fillObjectFields(obj: BaseBackedObject): DrawableEntityConcrete {
            switch (obj.entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    return obj.entity;
                case EntityType.FITTING:
                    return fillValveDefaultFields(this.document.drawing, obj.entity);
                case EntityType.PIPE:
                    return fillPipeDefaultFields(this.document.drawing, (obj as Pipe).computedLengthM, obj.entity);
                case EntityType.RISER:
                    return fillRiserDefaults(this.document.drawing, obj.entity);
                case EntityType.SYSTEM_NODE:
                    return obj.entity;
                case EntityType.BIG_VALVE:
                    return fillDefaultBigValveFields(this.defaultCatalog, obj.entity);
                case EntityType.FIXTURE:
                    return fillFixtureFields(this.document.drawing, this.defaultCatalog, obj.entity);
                case EntityType.DIRECTED_VALVE:
                    return fillDirectedValveFields(this.document.drawing, this.$props.objectStore, obj.entity);
                case EntityType.LOAD_NODE:
                    return fillDefaultLoadNodeFields(this.document, obj.globalStore, obj.entity);
                case EntityType.PLANT:
                    return fillPlantDefaults(obj.entity);
                case EntityType.FLOW_SOURCE:
                    return fillFlowSourceDefaults(this.document.drawing, obj.entity);
            }
            assertUnreachable(obj.entity);
        }

        get document(): DocumentState {
            return this.$store.getters["document/document"];
        }

        get defaultCatalog(): Catalog {
            return this.$store.getters["catalog/default"];
        }

        getEmptyValue(type: FieldType) {
            switch (type) {
                case FieldType.TwoPointScale:
                case FieldType.Title:
                case FieldType.Text:
                case FieldType.TextArea:
                case FieldType.Rotation:
                case FieldType.Number:
                    return "";
                case FieldType.Boolean:
                case FieldType.Choice:
                case FieldType.FlowSystemChoice:
                    return "(mixed)";
                case FieldType.Color:
                    return { hex: "#eeeeee" };
                default:
                    assertUnreachable(type);
            }
        }

        isEmptyValue(type: FieldType, value: any) {
            switch (type) {
                case FieldType.TwoPointScale:
                case FieldType.Title:
                case FieldType.Text:
                case FieldType.TextArea:
                case FieldType.Rotation:
                case FieldType.Number:
                    return value === "";
                case FieldType.Boolean:
                case FieldType.Choice:
                case FieldType.FlowSystemChoice:
                    return value === "(mixed)";
                case FieldType.Color:
                    return value.hasOwnProperty('hex') && value.hex === "#eeeeee";
                default:
                    assertUnreachable(type);
            }
        }

        get defaultData() {
            return new Proxy(
                {},
                {
                    get: (target, name, receiver): any => {
                        let concreteValue: any = null;
                        let concreteIdentical = true;
                        let foundField: PropertyField;
                        this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                            const fields = this.getEntityFields(obj.entity);
                            const field = fields.find((f) => f.multiFieldId === name);
                            if (field) {
                                foundField = field;
                                const defVal = getPropertyByString(this.fillObjectFields(obj) as any, field.property);
                                const conVal = getPropertyByString(obj.entity as any, field.property);
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
                    }
                }
            );
        }

        deconstructCurrentValue(name: string | number | symbol) {

            let concreteValue: any;
            let concreteIdentical = true;
            let allDefaultOrCalculated = true;
            let someDefaultOrCalculated = false;
            let foundField!: PropertyField;
            this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                const fields = this.getEntityFields(obj.entity);
                const field = fields.find((f) => f.multiFieldId === name);
                if (field) {
                    foundField = field;
                    const val = getPropertyByString(obj.entity as any, field.property);
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

            return {concreteValue, concreteIdentical, allDefaultOrCalculated, someDefaultOrCalculated, foundField};
        }

        get reactiveData() {


            return new Proxy(
                {},
                {
                    get: (target, name, receiver) => {
                        // Undefined means mixed and input value will be default.
                        // Null means definitely computed or definitely default.
                        // Value means all items were explicit and has same value.

                        const {concreteValue, concreteIdentical, allDefaultOrCalculated, someDefaultOrCalculated, foundField} =
                            this.deconstructCurrentValue(name);

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
                        if (value === undefined) {
                            return true;
                        }


                        const {concreteValue, concreteIdentical, allDefaultOrCalculated, someDefaultOrCalculated, foundField} =
                            this.deconstructCurrentValue(name);

                        // aka. If it is a mixed empty value
                        if (!allDefaultOrCalculated && (someDefaultOrCalculated || !concreteIdentical)) {
                            // only non-empty values.
                            if (this.isEmptyValue(foundField.type, value)) {
                                // This is essentially an "undefault" operation, so we need to restore defaults.
                                this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {

                                    const fields = this.getEntityFields(obj.entity);
                                    const field = fields.find((f) => f.multiFieldId === name);
                                    if (field) {
                                        const val = getPropertyByString(obj.entity as any, field.property);
                                        if (val === null) {
                                            const filled = this.fillObjectFields(obj);
                                            setPropertyByString(obj.entity, field.property, getPropertyByString(filled, field.property));
                                        }
                                    }
                                });
                                return true;
                            }
                        }

                        let success = false;
                        this.$props.selectedObjects.forEach((obj: BaseBackedObject) => {
                            const fields = this.getEntityFields(obj.entity);
                            const field = fields.find((f) => f.multiFieldId === name);
                            if (field) {
                                setPropertyByString(obj.entity as any, field.property, value);
                                success = true;
                            }
                        });
                        return success;
                    }
                }
            );
        }

        onCommit() {
            this.$store.dispatch("document/validateAndCommit");
        }
    }
</script>
