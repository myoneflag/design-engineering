import {ViewPort} from '../../../src/htmlcanvas/viewport';
import {DocumentState} from '../../../src/store/document/types';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import {ValveType} from '../../../src/store/document/entities/directed-valves/valve-types';
import {Catalog} from '../../../src/store/catalog/types';
import Vue from 'vue';
import {EntityType} from "../../store/document/entities/types";
import {
    CalculatableEntityConcrete,
    CalculationConcrete,
    ConnectableEntityConcrete,
    DrawableEntityConcrete
} from "../../store/document/entities/concrete-entity";
import BackedConnectable from "./BackedConnectable";
import PipeEntity from "../../store/document/entities/pipe-entity";
import DrawableObjectFactory from "./drawable-object-factory";
import PipeCalculation, {emptyPipeCalculation} from "../../store/document/calculations/pipe-calculation";
import RiserCalculations, {emptyRiserCalculations, makeRiserCalculationFields} from "../../store/document/calculations/riser-calculations";
import TmvCalculation, {emptyTmvCalculation} from "../../store/document/calculations/tmv-calculation";
import FixtureCalculation, {emptyFixtureCalculation} from "../../store/document/calculations/fixture-calculation";
import FittingCalculation, {emptyFittingCalculation} from "../../store/document/calculations/fitting-calculation";
import DirectedValveCalculation, {emptyDirectedValveCalculation} from "../../store/document/calculations/directed-valve-calculation";
import SystemNodeCalculation, {emptySystemNodeCalculation} from "../../store/document/calculations/system-node-calculation";
import RiserEntity from "../../store/document/entities/riser-entity";
import TmvEntity, {SystemNodeEntity} from "../../store/document/entities/tmv/tmv-entity";
import FittingEntity from "../../store/document/entities/fitting-entity";
import FixtureEntity from "../../store/document/entities/fixtures/fixture-entity";
import DirectedValveEntity from "../../store/document/entities/directed-valves/directed-valve-entity";

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
    catalog: Catalog;
    globalStore: GlobalStore;
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
        if (this.entitiesInLevel.get(levelUid)) {
            this.entitiesInLevel.get(levelUid)!.forEach((euid) => {
                this.delete(euid);
            })
        }
    }

    calculationStore = new Map<string, CalculationConcrete>();

    getOrCreateCalculation(entity: PipeEntity): PipeCalculation;
    getOrCreateCalculation(entity: RiserEntity): RiserCalculations;
    getOrCreateCalculation(entity: TmvEntity): TmvCalculation;
    getOrCreateCalculation(entity: FittingEntity): FittingCalculation;
    getOrCreateCalculation(entity: FixtureEntity): FixtureCalculation;
    getOrCreateCalculation(entity: DirectedValveEntity): DirectedValveCalculation;
    getOrCreateCalculation(entity: SystemNodeEntity): SystemNodeCalculation;
    getOrCreateCalculation(entity: CalculatableEntityConcrete): CalculationConcrete;

    getOrCreateCalculation(entity: CalculatableEntityConcrete): CalculationConcrete {
        if (!this.calculationStore.has(entity.uid)) {
            switch (entity.type) {
                case EntityType.RISER:
                    this.calculationStore.set(entity.uid, emptyRiserCalculations());
                    break;
                case EntityType.PIPE:
                    this.calculationStore.set(entity.uid, emptyPipeCalculation());
                    break;
                case EntityType.TMV:
                    this.calculationStore.set(entity.uid, emptyTmvCalculation());
                    break;
                case EntityType.FITTING:
                    this.calculationStore.set(entity.uid, emptyFittingCalculation());
                    break;
                case EntityType.FIXTURE:
                    this.calculationStore.set(entity.uid, emptyFixtureCalculation());
                    break;
                case EntityType.DIRECTED_VALVE:
                    this.calculationStore.set(entity.uid, emptyDirectedValveCalculation());
                    break;
                case EntityType.SYSTEM_NODE:
                    this.calculationStore.set(entity.uid, emptySystemNodeCalculation());
                    break;
            }
        }

        return this.calculationStore.get(entity.uid)!;
    }

    getCalculation(entity: PipeEntity): PipeCalculation | undefined;
    getCalculation(entity: RiserEntity): RiserCalculations | undefined;
    getCalculation(entity: TmvEntity): TmvCalculation | undefined;
    getCalculation(entity: FittingEntity): FittingCalculation | undefined;
    getCalculation(entity: FixtureEntity): FixtureCalculation | undefined;
    getCalculation(entity: DirectedValveEntity): DirectedValveCalculation | undefined;
    getCalculation(entity: SystemNodeEntity): SystemNodeCalculation | undefined;
    getCalculation(entity: CalculatableEntityConcrete): CalculationConcrete | undefined;

    getCalculation(entity: CalculatableEntityConcrete): CalculationConcrete | undefined {
        return this.calculationStore.get(entity.uid);
    }

    clearCalculations() {
        this.calculationStore.clear();
        const p = {} as DirectedValveEntity;
        const k = this.getOrCreateCalculation(p);

    }
}

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
