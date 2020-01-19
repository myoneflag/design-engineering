import { DiffOperation } from "../../../../../common/src/api/document/operation-transforms";
import Vue from "vue";
import { applyDiff } from "../../../../../common/src/api/document/state-ot-apply";

export function applyDiffVue(target: any, diff: any): any {
    return applyDiff(target, diff, Vue.set, Vue.delete);
}

export function applyOpOntoStateVue(state: any, ops: DiffOperation) {
    applyDiffVue(state, ops.diff);
}
