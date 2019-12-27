import {CenteredEntity, Color, DocumentState, DrawableEntity, FlowSystemParameters} from "../types";
import {DirectedValveConcrete, ValveType} from "./directed-valves/valve-types";
import {FieldType, PropertyField} from "./property-field";
import {assertUnreachable} from "../../../config";
import {cloneSimple} from "../../../lib/utils";
import DirectedValveEntity, {determineConnectableSystemUid} from "./directed-valves/directed-valve-entity";
import {ObjectStore} from "../../../htmlcanvas/lib/types";
import {EntityType} from "./types";

export default interface LoadNodeEntity extends DrawableEntity, CenteredEntity {
    type: EntityType.LOAD_NODE;
    systemUidOption: string | null;
    color: Color | null;
    loadingUnits: number;
    designFlowRateLS: number;
    continuousFlowLS: number;
    calculationHeightM: number | null;
}

export function makeLoadNodesFields(
    systems: FlowSystemParameters[],
): PropertyField[] {
    const fields: PropertyField[] = [
        { property: 'systemUidOption', title: 'Flow System', hasDefault: false, isCalculated: false,
            type: FieldType.FlowSystemChoice, params: { systems },  multiFieldId: 'systemUid' },

        { property: 'color', title: 'Color:', hasDefault: true, isCalculated: false,
            type: FieldType.Color, params: null,  multiFieldId: 'color' },

        { property: 'loadingUnits', title: 'Loading Units', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'loadingUnits' },

        { property: 'designFlowRateLS', title: 'Design Flow Rate (L/s)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'designFlowRateLS' },

        { property: 'continuousFlowLS', title: 'Continuous Flow (L/s)', hasDefault: false, isCalculated: false,
            type: FieldType.Number, params: { min: 0, max: null },  multiFieldId: 'continuousFlowLS' },

    ];

    return fields;
}

export function fillDefaultLoadNodeFields(
    doc: DocumentState,
    objectStore: ObjectStore,
    value: LoadNodeEntity
) {
    const result = cloneSimple(value);

    const systemUid = determineConnectableSystemUid(objectStore, value);
    const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === systemUid);

    result.systemUidOption = system ? system.uid : null;

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        if (result.color == null) {
            result.color = {hex: '#888888'};
        }
    }

    return result;
}
