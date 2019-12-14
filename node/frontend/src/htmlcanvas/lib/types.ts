import {ViewPort} from '../../../src/htmlcanvas/viewport';
import {DocumentState} from '../../../src/store/document/types';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import Popup from '../../../src/htmlcanvas/objects/popup';
import {ValveType} from '../../../src/store/document/entities/directed-valves/valve-types';
import {Catalog} from '../../../src/store/catalog/types';
import Vue from 'vue';
import {EntityType} from "../../store/document/entities/types";
import {ConnectableEntityConcrete, DrawableEntityConcrete} from "../../store/document/entities/concrete-entity";
import BackedConnectable from "./BackedConnectable";
import PipeEntity from "../../store/document/entities/pipe-entity";
import DrawableObjectFactory from "./drawable-object-factory";

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
    catalog: Catalog;
}


// Manages objects, and also keeps track of connections. This basic one is to
// record visible objects only.
export class ObjectStore extends Map<string, BaseBackedObject> {
    vm: Vue;
    private connections = new Map<string, string[]>();
    private oldEndpoints = new Map<string, [string, string]>();

    constructor(vm: Vue) {
        super();
        this.vm = vm;
    }

    getConnections(uid: string): string[] {
        return this.connections.get(uid) || [];
    }

    get(key: string) {
        const res = super.get(key);
        //console.log('getting ' + key + ' result ' + JSON.stringify(res ? res.entity : res));
        return res;
    }

    private detachEndpoints(entity: PipeEntity) {
        this.oldEndpoints.get(entity.uid)!.forEach((oldVal) => {
            if (oldVal === undefined) {
                return;
            }
            const arr = this.connections.get(oldVal);
            if (!arr) {
                throw new Error('old value didn\'t register a connectable. ' + oldVal);
            }
            const ix = arr.indexOf(entity.uid);
            if (ix === -1) {
                throw new Error('connections are in an invalid state');
            }
            arr.splice(ix, 1);
        });
        this.oldEndpoints.delete(entity.uid);
    }

    private attachEndpoints(entity: PipeEntity) {
        entity.endpointUid.forEach((newVal) => {
            if (newVal === undefined) {
                return;
            }
            if (!this.connections.has(newVal)) {
                this.connections.set(newVal, []);
            }
            if (this.get(newVal)) {
                (this.get(newVal) as BackedConnectable<ConnectableEntityConcrete>).connect(entity.uid);
            }
            this.connections.get(newVal)!.push(entity.uid);
        });
        this.oldEndpoints.set(entity.uid, [entity.endpointUid[0], entity.endpointUid[1]]);
    }


    delete(key: string) {
        const val = this.get(key);
        if (val && val.entity.type === EntityType.PIPE) {
            this.detachEndpoints(val.entity);
        }

        return super.delete(key);
    }

    set(key: string, value: BaseBackedObject) {
        if (!(value.entity as any).__ob__) {
            throw new Error('Not reactive');
        }
        if (this.has(key)) {
            const val = this.get(key);
            if (val && val.entity.type === EntityType.PIPE) {
                this.detachEndpoints(val.entity);
            }
        }

        if (value.entity.type === EntityType.PIPE) {
            this.attachEndpoints(value.entity);
        }

        const result = super.set(key, value);
        return result;
    }

    // undefined values only for deleting values. So hacky but we need to hack now.
    updatePipeEndpoints(key: string, endpoints: [string | undefined, string | undefined]) {

        const e = this.get(key)!.entity as PipeEntity;
        this.detachEndpoints(e);
        e.endpointUid.splice(0, 2, ...(endpoints as [string, string]));
        this.attachEndpoints(e);
    }
}

// Stores auxillary data and objects for the entire document across all levels.
export class GlobalStore extends ObjectStore {
    entitiesInLevel = new Map<string | null, Set<string>>();
    levelOfEntity = new Map<string, string | null>();

    set(key: string, value: BaseBackedObject, levelUid?: string | null): this {
        if (levelUid === undefined) {
            throw new Error('Need a level to set in global store.');
        }
        if (!this.entitiesInLevel.has(levelUid)) {
            this.entitiesInLevel.set(levelUid, new Set());
        }
        this.entitiesInLevel.get(levelUid)!.add(value.uid);
        this.levelOfEntity.set(value.uid, levelUid);
        return super.set(key, value);
    }

    store(value: DrawableEntityConcrete, levelUid: string): this {
        const o = DrawableObjectFactory.buildGhost(value, this, levelUid);
        // this.set(e.uid, o, levelUid); Already done by buildGhost
        return this;
    }

    delete(key: string): boolean {
        const lvl = this.levelOfEntity.get(key)!;
        this.levelOfEntity.delete(key);
        this.entitiesInLevel.get(lvl)!.delete(key);
        return super.delete(key);
    }

    resetLevel(levelUid: string | null, entities: DrawableEntityConcrete[]) {
        let inLevelNow = new Set<string>();
        if (this.entitiesInLevel.has(levelUid)) {
            inLevelNow = new Set(this.entitiesInLevel.get(levelUid)!);
        }

        const goal = new Set(entities.map((e) => e.uid));
        // Delete gone ones
        inLevelNow.forEach((u) => {
            if (!goal.has(u)) {
                this.delete(u);
            }
        });

        // add new ones
        entities.forEach((e) => {
            if (!inLevelNow.has(e.uid)) {
                const o = DrawableObjectFactory.buildGhost(e, this, levelUid);
                // this.set(e.uid, o, levelUid); Already done by buildGhost
            }
        });

        // update existing ones
        entities.forEach((e) => {
            if (inLevelNow.has(e.uid)) {
                if (e.type === EntityType.PIPE) {
                    this.updatePipeEndpoints(e.uid, e.endpointUid);
                }
            }
        });
    }

    onLevelDelete(levelUid: string) {
        this.entitiesInLevel.get(levelUid)!.forEach((euid) => {
            this.delete(euid);
        })
    }
}

// tslint:disable-next-line:max-classes-per-file
export class MessageStore extends Map<string, Popup> {}

export interface SelectionTarget {
    uid: string | null;
    property?: string;
    message?: string;
    variant?: string;
    title?: string;
    recenter?: boolean;
}

export interface ValveId {
    type: ValveType;
    name: string;
    catalogId: string;
}
