import { MutationTree } from "vuex";
import { blankDiffFilter, DocumentState, EntityParam, EntityParamNullable, initialDocumentState } from "./types";
import * as OT from "../../../../common/src/api/document/operation-transforms";
import { OPERATION_NAMES } from "../../../../common/src/api/document/operation-transforms";
import { MainEventBus } from "../../../src/store/main-event-bus";
import { applyDiffVue, applyOpOntoStateVue } from "../../../src/store/document/operation-transforms/state-ot-apply";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import stringify from "json-stable-stringify";
import Vue from "vue";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import { diffState } from "../../../../common/src/api/document/state-differ";
import * as _ from "lodash";
import { DrawingState, initialDrawing, Level } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import DrawableObjectFactory from "../../htmlcanvas/lib/drawable-object-factory";
import { DrawingMode } from "../../htmlcanvas/types";
import { applyDiffNative } from "../../../../common/src/api/document/state-ot-apply";
import { assertUnreachable } from "../../../../common/src/api/config";

export const globalStore = new GlobalStore();

function logEntityMutation(
    state: DocumentState,
    { entityUid, levelUid }: { entityUid: string; levelUid: string | null }
) {
    if (levelUid === null) {
        Vue.set(state.diffFilter.shared, entityUid, false);
    } else {
        if (!state.diffFilter.levels.hasOwnProperty(levelUid)) {
            Vue.set(state.diffFilter.levels, levelUid, {
                /**/
            });
        }
        if (state.diffFilter.levels[levelUid] === false) {
            // that's ok, the entire level was being manipulated
        } else {
            if (!state.diffFilter.levels[levelUid].hasOwnProperty("entities")) {
                Vue.set(state.diffFilter.levels[levelUid], "entities", {
                    /**/
                });
            }
            if (state.diffFilter.levels[levelUid].entities !== false) {
                Vue.set(state.diffFilter.levels[levelUid].entities, entityUid, false);
            }
        }
    }
}

function logLevelMutation(state: DocumentState, levelUid: string) {
    if (!state.diffFilter.levels.hasOwnProperty(levelUid)) {
        Vue.set(state.diffFilter.levels, levelUid, {

            /**/
        });
    }
    Object.keys(state.drawing.levels[levelUid]).forEach((key) => {
        if (key !== "entities") {
            Vue.set(state.diffFilter.levels[levelUid], key, false);
        }
    });
}

function onAddEntity({ entity, levelUid }: EntityParam, state: DocumentState) {
    try {
        // get entity form drawable
        if (levelUid === null) {
            entity = state.drawing.shared[entity.uid];
        } else {
            entity = state.drawing.levels[levelUid].entities[entity.uid];
        }

        DrawableObjectFactory.buildVisible(entity, globalStore, state, levelUid, {
            onRedrawNeeded: () => MainEventBus.$emit("redraw", entity),
            onInteractionComplete: () => MainEventBus.$emit("interaction-complete", entity),
            onSelect: (e) => MainEventBus.$emit("entity-select", { entity, e })
        });
    } catch (e) {
        // todo: telemetry this
        // tslint:disable-next-line:no-console
    }
}

function onDeleteEntity({ entity, levelUid }: EntityParam, state: DocumentState) {
    if (state.uiState.selectedUids.includes(entity.uid)) {
        state.uiState.selectedUids.splice(state.uiState.selectedUids.indexOf(entity.uid), 1);
    }
    globalStore.delete(entity.uid);
}

function onAddLevel(level: Level, state: DocumentState) {
    if (!globalStore.entitiesInLevel.has(level.uid)) {
        globalStore.entitiesInLevel.set(level.uid, new Set());
    }

    for (let entity of Object.values(level.entities)) {
        entity = proxyEntity(entity, entityHandler(state, level.uid, entity.uid));
        onAddEntity({ entity, levelUid: level.uid }, state);
    }
}

function onDeleteLevel(level: Level, state: DocumentState) {
    Object.keys(level.entities).forEach((uid) => {
        if (state.uiState.selectedUids.includes(uid)) {
            state.uiState.selectedUids.splice(state.uiState.selectedUids.indexOf(uid), 1);
        }
    });

    globalStore.onLevelDelete(level.uid);
}

function onUpdateEntity(uid: string) {
    if (globalStore.has(uid)) {
        globalStore.onEntityChange(uid);
    }
}

function beforeEvent(event: string, args: any, state: DocumentState) {
    if (event === "update-entity") {
        onUpdateEntity(args);
    } else if (event === "add-entity") {
        const { entity, levelUid }: EntityParamNullable = args;
        // entity =
        onAddEntity(args, state);
    } else if (event === "delete-entity") {
        onDeleteEntity(args, state);
    } else if (event === "add-level") {
        onAddLevel(args, state);
    } else if (event === "delete-level") {
        onDeleteLevel(args, state);
    }
}

function deleteEntityOn(state: DocumentState, { entity, levelUid }: EntityParamNullable) {
    if (levelUid === null) {
        if (entity.type !== EntityType.RISER) {
            throw new Error(
                "Deleting a non shared object from the shared level " + levelUid + " " + JSON.stringify(entity)
            );
        }
        Vue.delete(state.drawing.shared, entity.uid);
        logEntityMutation(state, { entityUid: entity.uid, levelUid: null });
    } else if (entity.uid in state.drawing.levels[levelUid].entities) {
        Vue.delete(state.drawing.levels[levelUid].entities, entity.uid);
        logEntityMutation(state, { entityUid: entity.uid, levelUid: null });
    } else {
        throw new Error("Deleted an entity that doesn't exist " + JSON.stringify(entity) + " on level " + levelUid);
    }

    logEntityMutation(state, { entityUid: entity.uid, levelUid });
    beforeEvent("delete-entity", { entity, levelUid }, state);
    MainEventBus.$emit("delete-entity", { entity, levelUid });
}

function addEntityOn(state: DocumentState, { entity, levelUid }: EntityParamNullable) {
    if (levelUid === null) {
        entity = proxyEntity(entity, entityHandler(state, null, entity.uid));
        Vue.set(state.drawing.shared, entity.uid, entity);
        logEntityMutation(state, { entityUid: entity.uid, levelUid });
    } else {
        entity = proxyEntity(entity, entityHandler(state, levelUid, entity.uid));
        Vue.set(state.drawing.levels[levelUid].entities, entity.uid, entity);
        logEntityMutation(state, { entityUid: entity.uid, levelUid });
    }

    beforeEvent("add-entity", { entity, levelUid }, state);
    MainEventBus.$emit("add-entity", { entity, levelUid });
}

function changeDrawing(state: DocumentState, newDrawing: DrawingState, filter: any, redraw: boolean) {
    // newDrawing = cloneSimple(newDrawing);
    const reverseDiff = cloneSimple(diffState(state.drawing, newDrawing, filter));

    reverseDiff.forEach((op) => {
        switch (op.type) {
            case OPERATION_NAMES.DIFF_OPERATION:
                const changes = marshalChanges(state.drawing, newDrawing, op.diff);
                applyOpOntoStateVue(state.drawing, op);
                proxyUpFromStateDiff(state, op.diff);
                changes.forEach(([e, v]) => {
                    beforeEvent(e, v, state);
                });
                changes.forEach(([e, v]) => {
                    MainEventBus.$emit(e, v);
                });
                break;
            case OPERATION_NAMES.COMMITTED_OPERATION:
                MainEventBus.$emit("committed", redraw);
                break;
        }
    });

    Vue.set(state, "diffFilter", blankDiffFilter());
}

function applyDiffs(state: DocumentState, diffs: any[]) {
    try {
        globalStore.suppressSideEffects = true;
        const prevDrawing = cloneSimple(state.drawing);
        for (const diff of diffs) {
            applyDiffVue(state.drawing, diff);
            const changes = marshalChanges(prevDrawing, state.drawing, diff, true);
            proxyUpFromStateDiff(state, diff);
            changes.forEach(([e, v]) => {
                beforeEvent(e, v, state);
            });
            changes.forEach(([e, v]) => {
                MainEventBus.$emit(e, v);
            });

            applyDiffNative(prevDrawing, cloneSimple(diff));
        }
    } finally {
        globalStore.suppressSideEffects = false;
    }
}

function applyDiff(state: DocumentState, diff: any) {
    try {
        globalStore.suppressSideEffects = true;
        const prevDrawing = cloneSimple(state.drawing);
        applyDiffVue(state.drawing, diff);
        const changes = marshalChanges(prevDrawing, state.drawing, diff, true);
        proxyUpFromStateDiff(state, diff);
        changes.forEach(([e, v]) => {
            beforeEvent(e, v, state);
        });
        changes.forEach(([e, v]) => {
            MainEventBus.$emit(e, v);
        });
    } finally {
        globalStore.suppressSideEffects = false;
    }
}

export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyRemoteOperation(state, operation: OT.OperationTransformConcrete) {
        state.history.push(operation);

        let newData = false;

        if (state.optimisticHistory.length) {
            // optimistic history id typically would be 1. We trust the server to give us correct incrementing ids.
            state.optimisticHistory[0].id = operation.id;

            // Stringify both objects as a cheap[shot] way of dealing with float imprecision before comparing
            if (stringify(state.optimisticHistory[0]) === stringify(operation)) {
                // All g.
                state.optimisticHistory.splice(0, 1);
                state.nextId = Math.max(state.nextId, operation.id) + 1;
                if (operation.type !== OPERATION_NAMES.COMMITTED_OPERATION) {
                    return;
                }
            } else {
                // Revert optimistic history (because there is conflict!) and listen to server.
                for (let i = state.optimisticHistory.length - 1; i >= 0; i--) {
                    const op = state.optimisticHistory[i];
                    switch (op.type) {
                        case OPERATION_NAMES.DIFF_OPERATION:
                            applyDiff(state, op.inverse);
                            applyDiffVue(state.committedDrawing, op.inverse);
                            break;
                        case OPERATION_NAMES.COMMITTED_OPERATION:
                            break;
                        default:
                            assertUnreachable(op);
                    }
                }

                state.optimisticHistory.splice(0, state.optimisticHistory.length);

                newData = true;
            }
        } else {
            newData = true;
        }

        const ogFilter = cloneSimple(state.diffFilter);

        if (operation.type === OT.OPERATION_NAMES.COMMITTED_OPERATION) {
            if (state.stagedCommits.length) {
                state.undoStack.splice(0);
                state.undoIndex = 0;
            }
            while (state.stagedCommits.length) {
                const toApply = state.stagedCommits[0];
                let handled: boolean = true;
                switch (toApply.type) {
                    case OT.OPERATION_NAMES.DIFF_OPERATION: {
                        if (state.uiState.drawingMode !== DrawingMode.History) {
                            try {
                                globalStore.suppressSideEffects = true;
                                applyOpOntoStateVue(state.drawing, toApply);
                                proxyUpFromStateDiff(state, toApply.diff);
                                const changes = marshalChanges(state.committedDrawing, state.drawing, toApply.diff);
                                applyOpOntoStateVue(state.committedDrawing, cloneSimple(toApply));
                                changes.forEach(([e, v]) => {
                                    beforeEvent(e, v, state);
                                });
                                changes.forEach(([e, v]) => {
                                    MainEventBus.$emit(e, v);
                                });
                            } finally {
                                globalStore.suppressSideEffects = false;
                            }
                        } else {
                            applyOpOntoStateVue(state.committedDrawing, cloneSimple(toApply));
                        }
                        break;
                    }

                    default:
                        handled = false;
                }

                if (handled) {
                    state.history.push(toApply);
                    state.nextId = Math.max(state.nextId, toApply.id) + 1;
                    state.stagedCommits.splice(0, 1);
                } else {
                    throw new Error("Invalid operation: " + JSON.stringify(toApply));
                }
            }
        } else {
            state.stagedCommits.push(operation);
        }

        Vue.set(state, "diffFilter", ogFilter);

        if (newData) {
            MainEventBus.$emit("committed", true);
        } // else, the data is already represented on screen

        state.isLoading = false;
    },

    applyDiff,

    applyDiffs,

    revert(state, redraw) {
        if (state.uiState.drawingMode === DrawingMode.History) {
            return;
        }
        changeDrawing(state, state.committedDrawing, state.diffFilter, redraw);
    },

    revertFull(state) {
        changeDrawing(state, state.committedDrawing, undefined, true);
    },

    resetDrawing(state) {
        changeDrawing(state, cloneSimple(initialDrawing), undefined, true);
    },

    reset(state) {
        Object.assign(state, cloneSimple(initialDocumentState));
        globalStore.clear();
    },

    loaded(state, loaded) {
        state.uiState.loaded = loaded;
    },

    resetPastes(state) {
        state.uiState.pastesByLevel = {};
    },

    addEntityOn,

    addEntity(state, entity: DrawableEntityConcrete) {
        if (entity.type === EntityType.RISER) {
            addEntityOn(state, { entity, levelUid: null });
        } else {
            addEntityOn(state, { entity, levelUid: state.uiState.levelUid! });
        }
    },

    setId(state, id: number) {
        state.documentId = id;
    },

    deleteEntity(state, entity) {
        if (entity.type === EntityType.RISER) {
            deleteEntityOn(state, { entity, levelUid: null });
        } else {
            deleteEntityOn(state, { entity, levelUid: state.uiState.levelUid! });
        }
    },

    deleteEntityOn,

    addLevel(state, level: Level) {
        level = proxyLevel(level, state, level.uid);
        Object.keys(level.entities).forEach((key) => {
            proxyEntity(level.entities[key], entityHandler(state, level.uid, key));
        });
        Vue.set(state.drawing.levels, level.uid, level);
        logLevelMutation(state, level.uid);
        beforeEvent("add-level", level, state);
        MainEventBus.$emit("add-level", level);
    },

    deleteLevel(state, level: Level) {
        if (level.uid in state.drawing.levels) {
            logLevelMutation(state, level.uid);
            Vue.delete(state.drawing.levels, level.uid);
        } else {
            throw new Error("Deleted a level that doesn't exist " + JSON.stringify(level));
        }
        beforeEvent("delete-level", level, state);
        MainEventBus.$emit("delete-level", level);
        if (level.uid === state.uiState.levelUid) {
            state.uiState.levelUid = null;
            MainEventBus.$emit("current-level-changed");
        }
    },

    setCurrentLevelUid(state, levelUid) {
        state.uiState.levelUid = levelUid;
        MainEventBus.$emit("current-level-changed");
    },

    updatePipeEndpoints(state, { entity, endpoints }: { entity: PipeEntity; endpoints: [string, string] }) {
        entity.endpointUid[0] = endpoints[0];
        entity.endpointUid[1] = endpoints[1];
        MainEventBus.$emit("update-pipe-endpoints", { entity, endpoints });
    },

    setShareToken(state, token: string) {
        state.shareToken = token;
    },

    setIsLoading(state, isLoading: boolean) {
        state.isLoading = isLoading;
    },
};

function entityHandler(state: DocumentState, levelUid: string | null, entityUid: string) {
    const handler = {
        get(target: any, key: string): any {
            if (key === "__custom_proxy__") {
                return true;
            }
            return target[key];
        },
        set(target: any, key: string, value: any) {
            if (value !== target[key]) {
                logEntityMutation(state, { entityUid, levelUid });

                if (_.isObject(value as any) && value.__custom_proxy__ !== true) {
                    target[key] = proxyEntity(value, this);
                } else {
                    target[key] = value;
                }

                if (!globalStore.suppressSideEffects) {
                    beforeEvent("update-entity", entityUid, state);
                    MainEventBus.$emit("update-entity", entityUid);
                }
            }
            return true;
        }
    };

    return handler;
}

function levelHandler(state: DocumentState, levelUid: string) {
    const handler = {
        get(target: any, key: string): any {
            if (key === "__custom_proxy__") {
                return true;
            }
            return target[key];
        },
        set(target: any, key: string, value: any) {
            logLevelMutation(state, levelUid);
            target[key] = value;
            return true;
        }
    };

    return handler;
}

function proxyEntity<T>(obj: T, handler: ProxyHandler<any>): T {
    if (_.isObject(obj)) {
        if ((obj as any).__custom_proxy__) {
            return obj;
        }
        Object.keys(obj).forEach((k) => {
            (obj as any)[k] = proxyEntity((obj as any)[k], handler);
        });
        const proxy = new Proxy(obj, handler);

        return proxy;
    } else {
        return obj;
    }
}

function proxyLevel(lvl: Level, state: DocumentState, levelUid: string) {
    if ((lvl as any).__custom_proxy__) {
        return lvl;
    } else {
        return new Proxy(lvl, levelHandler(state, levelUid));
    }
}

function proxyUpFromStateDiff(state: DocumentState, diff: any) {
    if (diff.shared && state.drawing.shared) {
        Object.keys(diff.shared).forEach((uid) => {
            if (state.drawing.shared.hasOwnProperty(uid)) {
                state.drawing.shared[uid] = proxyEntity(state.drawing.shared[uid], entityHandler(state, null, uid));
            }
        });
    }

    if (diff.levels && state.drawing.levels) {
        Object.keys(diff.levels).forEach((lvlUid) => {
            if (state.drawing.levels[lvlUid] && state.drawing.levels[lvlUid].entities) {
                if (diff.levels[lvlUid] && diff.levels[lvlUid].entities) {
                    Object.keys(diff.levels[lvlUid].entities).forEach((uid) => {
                        if (state.drawing.levels[lvlUid].entities.hasOwnProperty(uid)) {
                            state.drawing.levels[lvlUid].entities[uid] = proxyEntity(
                                state.drawing.levels[lvlUid].entities[uid],
                                entityHandler(state, lvlUid, uid)
                            );
                        }
                    });
                }
                state.drawing.levels[lvlUid] = proxyLevel(state.drawing.levels[lvlUid], state, lvlUid);
            }
        });
    }
}

// Call this before destroying the current state to figure out what we need to alert changes for.
function marshalChanges(from: DrawingState, to: DrawingState, diff: any, fuzzy: boolean = false): Array<[string, any]> {
    const res: Array<[string, any]> = [];
    if (diff.shared && from.shared) {
        Object.keys(diff.shared).forEach((uid) => {
            if (to.shared.hasOwnProperty(uid) && from.shared.hasOwnProperty(uid)) {
                res.push(["update-entity", uid]);
            } else if (from.shared.hasOwnProperty(uid)) {
                res.push(["delete-entity", { entity: from.shared[uid], levelUid: null }]);
            } else if (to.shared.hasOwnProperty(uid)) {
                res.push(["add-entity", { entity: diff.shared[uid], levelUid: null }]);
            } else {
                if (!fuzzy) {
                    throw new Error("invalid diff state - diffing something that no sides have");
                }
            }
        });
    }

    if (diff.levels && to.levels) {
        Object.keys(diff.levels).forEach((lvlUid) => {
            if (from.levels.hasOwnProperty(lvlUid) && to.levels.hasOwnProperty(lvlUid)) {
                // Diff elements here
                if (diff.levels[lvlUid].entities) {
                    Object.keys(diff.levels[lvlUid].entities).forEach((uid) => {
                        if (
                            to.levels[lvlUid].entities.hasOwnProperty(uid) &&
                            from.levels[lvlUid].entities.hasOwnProperty(uid)
                        ) {
                            res.push(["update-entity", uid]);
                        } else if (from.levels[lvlUid].entities.hasOwnProperty(uid)) {
                            res.push([
                                "delete-entity",
                                { entity: from.levels[lvlUid].entities[uid], levelUid: lvlUid }
                            ]);
                        } else if (to.levels[lvlUid].entities.hasOwnProperty(uid)) {
                            res.push(["add-entity", { entity: diff.levels[lvlUid].entities[uid], levelUid: lvlUid }]);
                        } else {
                            if (!fuzzy) {
                                throw new Error("invalid diff state - diffing something that no sides have");
                            }
                        }
                    });
                }
            } else if (from.levels.hasOwnProperty(lvlUid)) {
                res.push(["delete-level", from.levels[lvlUid]]);
            } else if (to.levels.hasOwnProperty(lvlUid)) {
                res.push(["add-level", diff.levels[lvlUid]]);
            } else {
                if (!fuzzy) {
                    throw new Error("invalid diff state - diffing a level that doesn't exist on any");
                }
            }
        });
    }

    // Delete entities first so not to trigger hydraulic layer's sorting edge case crash with missing
    // entities in uid list
    return res.sort((a, b) => (a[0] !== "delete-entity" ? 1 : 0) - (b[0] !== "delete-entity" ? 1 : 0));
}
