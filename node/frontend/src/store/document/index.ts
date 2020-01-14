import { Module } from "vuex";
import { getters } from "./getters";
import { actions } from "./actions";
import { mutations } from "./mutations";
import { DocumentState, initialDocumentState } from "./types";
import { RootState } from "../types";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { assertUnreachable } from "../../../../common/src/api/config";
import { cloneSimple } from "../../../../common/src/lib/utils";

export const state: DocumentState = cloneSimple(initialDocumentState);

const namespaced: boolean = true;

export const document: Module<DocumentState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
};

// Higher priority gets replaced less
export function getDragPriority(type: EntityType): number {
    switch (type) {
        case EntityType.SYSTEM_NODE:
        case EntityType.LOAD_NODE:
            return 100;
        case EntityType.FLOW_SOURCE:
            return 50;
        case EntityType.DIRECTED_VALVE:
            return 30;
        case EntityType.RISER:
        case EntityType.RETURN:
            return 10;
        case EntityType.FITTING:
            return 5;
        case EntityType.BIG_VALVE:
        case EntityType.FIXTURE:
        case EntityType.PLANT:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            throw new Error("not a connectable");
    }
    assertUnreachable(type);
}
