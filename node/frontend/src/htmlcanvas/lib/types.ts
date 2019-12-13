import {ViewPort} from '../../../src/htmlcanvas/viewport';
import {DocumentState} from '../../../src/store/document/types';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import Popup from '../../../src/htmlcanvas/objects/popup';
import {ValveType} from '../../../src/store/document/entities/directed-valves/valve-types';
import {Catalog} from '../../../src/store/catalog/types';
import Vue from 'vue';
import {EntityType} from "../../store/document/entities/types";
import {ConnectableEntityConcrete} from "../../store/document/entities/concrete-entity";
import BackedConnectable from "./BackedConnectable";
import PipeEntity from "../../store/document/entities/pipe-entity";
import * as _ from 'lodash';
import Pipe from "../objects/pipe";

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
            const arr = this.connections.get(oldVal);
            if (!arr) {
                throw new Error('old value didn\'t register a connectable');
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
            this.delete(key);
        }

        if (value.entity.type === EntityType.PIPE) {
            this.attachEndpoints(value.entity);
        }

        const result = super.set(key, value);
        return result;
    }

    updatePipeEndpoints(key: string, endpoints: [string, string]) {

        console.log('assigning pipe ' + key + ' to have endpoints ' + JSON.stringify(endpoints));
        const e = this.get(key)!.entity as PipeEntity;
        console.log('currently has ' + JSON.stringify(e.endpointUid));
        this.detachEndpoints(e);
        e.endpointUid.splice(0, 2, ...endpoints);
        this.attachEndpoints(e);
        console.log('now has ' + JSON.stringify((this.get(key)!.entity as any).endpointUid));
    }
}
// We will do a more advanced one which will keep track of heights, calculation
// objects and any other auxillary features that shouldn't belong to the underlying
// data structure.

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
