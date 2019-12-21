import {MutationTree} from 'vuex';
import {
    blankDiffFilter, DiffFilter,
    DocumentState,
    DrawingState,
    initialDocumentState,
    Level
} from './types';
import * as OT from './operation-transforms/operation-transforms';
import {OPERATION_NAMES} from './operation-transforms/operation-transforms';
import {MainEventBus} from '../../../src/store/main-event-bus';
import {applyOtOnState} from '../../../src/store/document/operation-transforms/state-ot-apply';
import {cloneSimple} from '../../../src/lib/utils';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {EntityType} from '../../../src/store/document/entities/types';
import stringify from "json-stable-stringify";
import Vue from 'vue';
import PipeEntity from "./entities/pipe-entity";
import {diffState} from "./operation-transforms/state-differ";
import * as _ from 'lodash';

function logEntityMutation(state: DocumentState, {entityUid, levelUid}: {entityUid: string, levelUid: string | null}) {
    if (levelUid === null) {
        Vue.set(state.diffFilter.shared, entityUid, false);
    } else {
        if (!state.diffFilter.levels.hasOwnProperty(levelUid)) {
            Vue.set(state.diffFilter.levels, levelUid, {});
        }
        if (state.diffFilter.levels[levelUid] === false) {
            // that's ok, the entire level was being manipulated
        } else {
            if (!state.diffFilter.levels[levelUid].hasOwnProperty('entities')) {
                Vue.set(state.diffFilter.levels[levelUid], 'entities', {});
            }
            if (state.diffFilter.levels[levelUid].entities !== false) {
                Vue.set(state.diffFilter.levels[levelUid].entities, entityUid, false);
            }
        }
    }

}

function logLevelMutation(state: DocumentState, levelUid: string) {
    if (!state.diffFilter.levels.hasOwnProperty(levelUid)) {
        Vue.set(state.diffFilter.levels, levelUid, {});
    }
    Object.keys(state.drawing.levels[levelUid]).forEach((key) => {
        if (key !== 'entities') {
            Vue.set(state.diffFilter.levels[levelUid], key, false);
        }
    })
}


export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyOperation(state, operation: OT.OperationTransformConcrete) {
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
                throw new Error('Optimistic operation conflict. TODO: rewind with undo\'s here. New object is: \n' +
                    JSON.stringify(operation) + '\n' +
                    'old object is:\n' +
                    JSON.stringify(state.optimisticHistory[0]),
                );
            }
        } else {
            newData = true;
        }

        const ogFilter = cloneSimple(state.diffFilter);

        if (operation.type === OT.OPERATION_NAMES.COMMITTED_OPERATION) {

            while (state.stagedCommits.length) {
                const toApply = state.stagedCommits[0];
                let handled: boolean = true;
                switch (toApply.type) {
                    case OT.OPERATION_NAMES.DIFF_OPERATION: {
                        applyOtOnState(state.drawing, cloneSimple(toApply));
                        const changes = marshalChanges(state.committedDrawing, state.drawing, toApply.diff);
                        applyOtOnState(state.committedDrawing, cloneSimple(toApply));
                        proxyUpFromStateDiff(state, toApply.diff);
                        changes.forEach(([e, v]) => {
                            MainEventBus.$emit(e, v);
                        });
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
                    throw new Error('Invalid operation: ' + JSON.stringify(toApply));
                }
            }
        } else {
            state.stagedCommits.push(operation);
        }

        Vue.set(state, 'diffFilter', ogFilter);

        if (newData) {
            MainEventBus.$emit('committed', true);
        } // else, the data is already represented on screen
    },

    revert(state, redraw) {
        // TODO: emit a reset-level for every changed level. At the moment, we are just resetting current visible
        // level. This is to allow global state to save state.
        const reverseDiff = diffState(state.drawing, state.committedDrawing, state.diffFilter);

        reverseDiff.forEach((op) => {
            switch (op.type) {
                case OPERATION_NAMES.DIFF_OPERATION:
                    const changes = marshalChanges(state.drawing, state.committedDrawing, op.diff);
                    applyOtOnState(state.drawing, op);
                    proxyUpFromStateDiff(state, op.diff);
                    changes.forEach(([e, v]) => {
                        MainEventBus.$emit(e, v);
                    });
                    break;
                case OPERATION_NAMES.COMMITTED_OPERATION:
                    MainEventBus.$emit('committed', redraw);
                    break;
            }
        });
        Vue.set(state, 'diffFilter', blankDiffFilter());
    },

    reset(state) {
        Object.assign(state, cloneSimple(initialDocumentState));
    },

    loaded(state, loaded) {
        state.uiState.loaded = loaded;
    },

    addEntityOn(state, {entity, levelUid}) {
        if (levelUid === null) {
            Vue.set(state.drawing.shared, entity.uid, entity);
            logEntityMutation(state, {entityUid: entity.uid, levelUid});
        } else {
            Vue.set(state.drawing.levels[levelUid].entities, entity.uid, entity);
            logEntityMutation(state, {entityUid: entity.uid, levelUid});
        }
        MainEventBus.$emit('add-entity', {entity, levelUid});
    },

    addEntity(state, entity: DrawableEntityConcrete) {

        if (entity.type === EntityType.RISER) {
            entity = proxyEntity(entity, entityHandler(state, null, entity.uid));
            Vue.set(state.drawing.shared, entity.uid, entity);
            logEntityMutation(state, {entityUid: entity.uid, levelUid: null});
            MainEventBus.$emit('add-entity', {entity, levelUid: null});
        } else {
            entity = proxyEntity(entity, entityHandler(state, state.uiState.levelUid!, entity.uid));
            Vue.set(state.drawing.levels[state.uiState.levelUid!].entities, entity.uid, entity);
            logEntityMutation(state, {entityUid: entity.uid, levelUid: state.uiState.levelUid});
            MainEventBus.$emit('add-entity', {entity, levelUid: state.uiState.levelUid!});
        }
    },

    setId(state, id: number) {
        state.documentId = id;
    },

    deleteEntity(state, entity) {
        if (entity.type === EntityType.RISER) {
            if (entity.uid in state.drawing.shared) {
                Vue.delete(state.drawing.shared, entity.uid);
                MainEventBus.$emit('delete-entity', {entity, levelUid: null});
            } else {
                throw new Error('Deleted an entity that doesn\'t exist ' + JSON.stringify(entity));
            }

            logEntityMutation(state, {entityUid: entity.uid, levelUid: null});
        } else if (entity.uid in state.drawing.levels[state.uiState.levelUid!].entities) {
            Vue.delete(state.drawing.levels[state.uiState.levelUid!].entities, entity.uid);

            logEntityMutation(state, {entityUid: entity.uid, levelUid: state.uiState.levelUid});
            MainEventBus.$emit('delete-entity', {entity, levelUid: state.uiState.levelUid!});
        } else {
            throw new Error('Deleted an entity that doesn\'t exist ' + JSON.stringify(entity));
        }
    },

    deleteEntityOn(state, {entity, levelUid}) {
        if (levelUid === null) {
            if (entity.type !== EntityType.RISER) {
                throw new Error('Deleting a non shared object from the shared level ' + levelUid + ' ' + JSON.stringify(entity));
            }
            Vue.delete(state.drawing.shared, entity.uid);
            logEntityMutation(state, {entityUid: entity.uid, levelUid: null});
        } else if (entity.uid in state.drawing.levels[levelUid].entities) {
            Vue.delete(state.drawing.levels[levelUid].entities, entity.uid);
            logEntityMutation(state, {entityUid: entity.uid, levelUid: null});
        } else {
            throw new Error('Deleted an entity that doesn\'t exist ' + JSON.stringify(entity) + ' on level ' + levelUid);
        }

        logEntityMutation(state, {entityUid: entity.uid, levelUid});
        MainEventBus.$emit('delete-entity', {entity, levelUid});
    },

    addLevel(state, level: Level) {
        level = proxyLevel(level, state, level.uid);
        Object.keys(level.entities).forEach((key) => {
            proxyEntity(level.entities[key], entityHandler(state, level.uid, key));
        });
        logLevelMutation(state, level.uid);
        Vue.set(state.drawing.levels, level.uid, level);
        MainEventBus.$emit('add-level', level);
    },

    deleteLevel(state, level: Level) {
        if (level.uid in state.drawing.levels) {
            Vue.delete(state.drawing.levels, level.uid);
        } else {
            throw new Error('Deleted a level that doesn\'t exist ' + JSON.stringify(level));
        }
        logLevelMutation(state, level.uid);
        MainEventBus.$emit('delete-level', level);
        if (level.uid === state.uiState.levelUid) {
            state.uiState.levelUid = null;
            MainEventBus.$emit('current-level-changed');
        }
    },

    setCurrentLevelUid(state, levelUid) {
        state.uiState.levelUid = levelUid;
        MainEventBus.$emit('current-level-changed');
    },

    updatePipeEndpoints(state, {entity, endpoints}: { entity: PipeEntity, endpoints: [string, string] }) {
        entity.endpointUid[0] = endpoints[0];
        entity.endpointUid[1] = endpoints[1];
        MainEventBus.$emit('update-pipe-endpoints', {entity, endpoints});
    },

};

function entityHandler(state: DocumentState, levelUid: string | null, entityUid: string) {
    const handler = {
        get(target: any, key: string): any {
            if (key === '__custom_proxy__') {
                return true;
            }
            return target[key];
        },
        set(target: any, key: string, value: any) {
            if (value !== target[key]) {

                logEntityMutation(state, {entityUid, levelUid});


                if (_.isObject(value as any) && value.__custom_proxy__ !== true) {
                    target[key] = proxyEntity(value, this);
                } else {
                    target[key] = value;
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
            if (key === '__custom_proxy__') {
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
        const proxy = new Proxy(obj, handler);
        Object.keys(obj).forEach((k) => {
            proxy[k] = proxyEntity(proxy[k], handler);
        });
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
                state.drawing.shared[uid] =
                    proxyEntity(state.drawing.shared[uid], entityHandler(state, null, uid));
            }
        });
    }

    if (diff.levels && state.drawing.levels) {
        Object.keys(diff.levels).forEach((lvlUid) => {
            if (state.drawing.levels[lvlUid] && state.drawing.levels[lvlUid].entities) {
                Object.keys(diff.levels[lvlUid].entities).forEach((uid) => {
                    if (state.drawing.levels[lvlUid].entities.hasOwnProperty(uid)) {
                        state.drawing.levels[lvlUid].entities[uid] =
                            proxyEntity(state.drawing.levels[lvlUid].entities[uid], entityHandler(state, lvlUid, uid));
                    }
                });
                state.drawing.levels[lvlUid] = proxyLevel(state.drawing.levels[lvlUid], state, lvlUid);
            }
        })
    }
}

// Call this before destroying the current state to figure out what we need to alert changes for.
function marshalChanges(from: DrawingState, to: DrawingState, diff: any): Array<[string, any]> {
    const res: Array<[string, any]> = [];
    if (diff.shared && from.shared) {
        Object.keys(diff.shared).forEach((uid) => {
            if (to.shared.hasOwnProperty(uid) && from.shared.hasOwnProperty(uid)) {
                res.push(['update-entity', uid]);
            } else if (from.shared.hasOwnProperty(uid)) {
                res.push(['delete-entity', {entity: from.shared[uid], levelUid: null}]);
            } else if (to.shared.hasOwnProperty(uid)) {
                res.push(['add-entity', {entity: to.shared[uid], levelUid: null}]);
            } else {
                throw new Error('invalid diff state - diffing something that no sides have');
            }
        });
    }

    if (diff.levels && to.levels) {
        Object.keys(diff.levels).forEach((lvlUid) => {
            if (from.levels.hasOwnProperty(lvlUid) && to.levels.hasOwnProperty(lvlUid)) {
                // Diff elements here
                Object.keys(diff.levels[lvlUid].entities).forEach((uid) => {
                    if (to.levels[lvlUid].entities.hasOwnProperty(uid) && from.levels[lvlUid].entities.hasOwnProperty(uid)) {
                        res.push(['update-entity', uid]);
                    } else if (from.levels[lvlUid].entities.hasOwnProperty(uid)) {
                        res.push(['delete-entity', {entity: from.levels[lvlUid].entities[uid], levelUid: lvlUid}]);
                    } else if (to.levels[lvlUid].entities.hasOwnProperty(uid)) {
                        res.push(['add-entity', {entity: to.levels[lvlUid].entities[uid], levelUid: lvlUid}]);
                    } else {
                        throw new Error('invalid diff state - diffing something that no sides have');
                    }
                })
            } else if (from.levels.hasOwnProperty(lvlUid)) {
                res.push(['delete-level', from.levels[lvlUid]]);
            } else if (to.levels.hasOwnProperty(lvlUid)) {
                res.push(['add-level', to.levels[lvlUid]]);
            } else {
                throw new Error('invalid diff state - diffing a level that doesn\'t exist on any');
            }
        });
    }

    // Delete entities first so not to trigger hydraulic layer's sorting edge case crash with missing
    // entities in uid list
    return res.sort((a, b) =>
        (a[0] !== 'delete-entity' ? 1 : 0 ) -
        (b[0] !== 'delete-entity' ? 1 : 0 )
    );
}
