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
import RiserCalculation, {emptyRiserCalculations} from "../../store/document/calculations/riser-calculation";
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
import Pipe from "../objects/pipe";
import {cloneSimple} from "../../lib/utils";
import LoadNodeEntity from "../../store/document/entities/load-node-entity";
import LoadNodeCalculation from "../../store/document/calculations/load-node-calculation";

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
    protected connections = new Map<string, string[]>();
    protected oldEndpoints = new Map<string, [string, string]>();
    protected graveyard = new Map<string, BaseBackedObject>();
    protected preserveList = new Set<string>();
    doc: DocumentState;

    dependsOn = new Map<string, Map<string, Set<string>>>();
    dependedBy = new Map<string, Map<string, Set<string>>>();

    constructor(vm: Vue) {
        super();
        this.vm = vm;
    }

    getConnections(uid: string): string[] {
        return this.connections.get(uid) || [];
    }

    get(key: string) {
        const res = super.get(key);
        if (res) {
            return res;
        }
        return this.graveyard.get(key);
    }

    private detatchOldEndpoints(uid: string) {
        this.oldEndpoints.get(uid)!.forEach((oldVal) => {
            if (oldVal === undefined) {
                return;
            }
            this.bustDependencies(oldVal);
            const arr = this.connections.get(oldVal);
            if (!arr) {
                throw new Error('old value didn\'t register a connectable. ' + oldVal);
            }
            const ix = arr.indexOf(uid);
            if (ix === -1) {
                throw new Error('connections are in an invalid state');
            }
            arr.splice(ix, 1);
        });
        this.oldEndpoints.delete(uid);
    }

    private attachEndpoints(entity: PipeEntity) {
        entity.endpointUid.forEach((newVal) => {
            if (newVal === undefined) {
                return;
            }
            this.bustDependencies(newVal);
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

    watchDependencies(uid: string, prop: string, deps: Set<string>) {
        if (!this.dependsOn.has(uid)) {
            this.dependsOn.set(uid, new Map<string, Set<string>>());
        }
        const depends = this.dependsOn.get(uid)!;
        if (!depends.has(prop)) {
            depends.set(prop, deps);
        } else {
            throw new Error('Property ' + uid + ' ' + prop + ' already has deps registered.');
        }

        deps.forEach((dep) => {
            if (!this.dependedBy.has(dep)) {
                this.dependedBy.set(dep, new Map<string, Set<string>>());
            }
            const depended = this.dependedBy.get(dep)!;
            if (!depended.has(uid)) {
                depended.set(uid, new Set<string>());
            }
            if(!depended.get(uid)!.has(prop)) {
                depended.get(uid)!.add(prop);
            } else {
                throw new Error('Dependency ' + dep + ' already has prop ' + uid + ' ' + prop + ' registered.');
            }
        })
    }

    bustDependencies(uid: string) {
        if (this.dependedBy.has(uid)) {
            this.dependedBy.get(uid)!.forEach((props, target) => {
                if (this.has(target)) {
                    const o = this.get(target)!;
                    props.forEach((prop) => {
                        o.cache.delete(prop);
                    });
                }

                const tprops = this.dependsOn.get(target)!;
                Array.from(props).forEach((prop) => {
                    const deps = tprops.get(prop)!;
                    deps.forEach((dep) => {
                        this.dependedBy.get(dep)!.get(target)!.delete(prop);
                        if (!this.dependedBy.get(dep)!.get(target)!.size) {
                            !this.dependedBy.get(dep)!.delete(target);
                        }
                        if (!this.dependedBy.get(dep)!.size) {
                            this.dependedBy.delete(dep);
                        }
                    });

                    if (!this.dependsOn.get(target)!.delete(prop)) {
                        throw new Error('dependency graph inconsistency');
                    }
                    if (this.dependsOn.get(target)!.size === 0) {
                        this.dependsOn.delete(target);
                    }
                });
            })
        }
    }

    onEntityChange(uid: string) {
        this.bustDependencies(uid);
        const o = this.get(uid)!;
        o.onUpdate();
        if (o.type === EntityType.PIPE) {
            this.updatePipeEndpoints(uid);
        }
    }

    preserve(uids: string[]) {
        this.preserveList = new Set<string>(uids);
        this.graveyard.forEach((o, k) => {
            if (!this.preserveList.has(k)) {
                this.graveyard.delete(k);
            }
        })
    }

    delete(key: string) {
        this.bustDependencies(key);
        const val = this.get(key);

        if (this.oldEndpoints.has(key)) {
            this.detatchOldEndpoints(key);
        }

        if (this.preserveList.has(key) && val) {
            this.graveyard.set(key, val);
        }

        return super.delete(key);
    }

    set(key: string, value: BaseBackedObject) {
        this.bustDependencies(key);
        if (this.graveyard.has(key)) {
            value = this.graveyard.get(key)!;
        }

        // __calc__ is an indicator for a calculatable network entity, which is transient and doesn't
        // need to be reactive.
        if (!(value.entity as any).__ob__ && !(value.entity as any).__calc__) {
            throw new Error('Not reactive');
        }
        if (this.has(key)) {
            const val = this.get(key);
            if (val && val.entity.type === EntityType.PIPE) {
                this.detatchOldEndpoints(key);
            }
        }

        if (value.entity.type === EntityType.PIPE) {
            this.attachEndpoints(value.entity);
        }

        const result = super.set(key, value);
        return result;
    }

    // undefined values only for deleting values. So hacky but we need to hack now.
    updatePipeEndpoints(key: string) {
        this.bustDependencies(key);
        const e = this.get(key)!.entity as PipeEntity;
        this.detatchOldEndpoints(key);
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

    delete(key: string): boolean {
        const lvl = this.levelOfEntity.get(key)!;
        this.levelOfEntity.delete(key);
        this.entitiesInLevel.get(lvl)!.delete(key);
        return super.delete(key);
    }

    resetLevel(levelUid: string | null, entities: DrawableEntityConcrete[], doc: DocumentState, vm: Vue) {
        if (this.doc !== doc && this.doc !== undefined) {
            throw new Error('doc is different');
        }
        this.doc = doc;
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
                const o = DrawableObjectFactory.buildGhost(
                    () => {
                        if (levelUid !== null && !doc.drawing.levels.hasOwnProperty(levelUid)) {
                            throw new Error('level not found ' + levelUid);
                        }
                        return levelUid ? doc.drawing.levels[levelUid].entities[e.uid] : doc.drawing.shared[e.uid];
                    },
                    this,
                    levelUid,
                    vm,
                );
                // this.set(e.uid, o, levelUid); Already done by buildGhost
            }
        });

        // update existing ones
        entities.forEach((e) => {
            if (inLevelNow.has(e.uid)) {
                if (e.type === EntityType.PIPE) {
                    this.updatePipeEndpoints(e.uid);
                }
            }
        });
    }

    onLevelDelete(levelUid: string) {
        if (this.entitiesInLevel.get(levelUid)) {
            this.entitiesInLevel.get(levelUid)!.forEach((euid) => {
                this.delete(euid);
            });
        }
        this.entitiesInLevel.delete(levelUid);
    }

    calculationStore = new Map<string, CalculationConcrete>();

    getOrCreateCalculation(entity: PipeEntity): PipeCalculation;
    getOrCreateCalculation(entity: RiserEntity): RiserCalculation;
    getOrCreateCalculation(entity: TmvEntity): TmvCalculation;
    getOrCreateCalculation(entity: FittingEntity): FittingCalculation;
    getOrCreateCalculation(entity: FixtureEntity): FixtureCalculation;
    getOrCreateCalculation(entity: DirectedValveEntity): DirectedValveCalculation;
    getOrCreateCalculation(entity: SystemNodeEntity): SystemNodeCalculation;
    getOrCreateCalculation(entity: LoadNodeEntity): LoadNodeCalculation;
    getOrCreateCalculation(entity: CalculatableEntityConcrete): CalculationConcrete;

    getOrCreateCalculation(entity: CalculatableEntityConcrete): CalculationConcrete {
        if (!this.calculationStore.has(entity.uid)) {
            switch (entity.type) {
                case EntityType.RISER:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyRiserCalculations()));
                    break;
                case EntityType.PIPE:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyPipeCalculation()));
                    break;
                case EntityType.TMV:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyTmvCalculation()));
                    break;
                case EntityType.FITTING:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyFittingCalculation()));
                    break;
                case EntityType.FIXTURE:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyFixtureCalculation(entity)));
                    break;
                case EntityType.DIRECTED_VALVE:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyDirectedValveCalculation()));
                    break;
                case EntityType.SYSTEM_NODE:
                    this.calculationStore.set(entity.uid, cloneSimple(emptySystemNodeCalculation()));
                    break;
                case EntityType.LOAD_NODE:
                    this.calculationStore.set(entity.uid, cloneSimple(emptySystemNodeCalculation()));
                    break;
            }
        }

        return this.calculationStore.get(entity.uid)!;
    }

    getCalculation(entity: PipeEntity): PipeCalculation | undefined;
    getCalculation(entity: RiserEntity): RiserCalculation | undefined;
    getCalculation(entity: TmvEntity): TmvCalculation | undefined;
    getCalculation(entity: FittingEntity): FittingCalculation | undefined;
    getCalculation(entity: FixtureEntity): FixtureCalculation | undefined;
    getCalculation(entity: DirectedValveEntity): DirectedValveCalculation | undefined;
    getCalculation(entity: SystemNodeEntity): SystemNodeCalculation | undefined;
    getCalculation(entity: LoadNodeEntity): LoadNodeCalculation | undefined;
    getCalculation(entity: CalculatableEntityConcrete): CalculationConcrete | undefined;

    getCalculation(entity: CalculatableEntityConcrete): CalculationConcrete | undefined {
        return this.calculationStore.get(entity.uid);
    }

    setCalculation(uid: string, calculation: PipeCalculation): void;
    setCalculation(uid: string, calculation: RiserCalculation): void;
    setCalculation(uid: string, calculation: TmvCalculation): void;
    setCalculation(uid: string, calculation: FittingCalculation): void;
    setCalculation(uid: string, calculation: FixtureCalculation): void;
    setCalculation(uid: string, calculation: DirectedValveCalculation): void;
    setCalculation(uid: string, calculation: SystemNodeCalculation): void;
    setCalculation(uid: string, calculation: CalculationConcrete): void;

    setCalculation(uid: string, calculation: CalculationConcrete) {
        this.calculationStore.set(uid, calculation);
    }

    clearCalculations() {
        this.calculationStore.clear();
    }

    lastDoc: DocumentState | undefined = undefined;

    sanityCheck(doc: DocumentState) {
        if (this.lastDoc !== undefined && doc !== this.lastDoc) {
            throw new Error('Document changed');
        }
        this.lastDoc = doc;

        // test that there is an exact bijection from document to things.

        // 1. Everything in doc must be in us.
        Object.values(doc.drawing.levels).forEach((l) => {
            Object.values(l.entities).forEach((e) => {
                if (!this.has(e.uid)) {
                    throw new Error('entity in document ' + JSON.stringify(e) + ' not found here');
                }

                if (this.get(e.uid)!.entity !== e) {
                    throw new Error('entity in document ' + JSON.stringify(e) + ' not in sync with us ' +
                        JSON.stringify(this.get(e.uid)!.entity));
                }
            })
        });

        Object.values(doc.drawing.shared).forEach((e) => {
            if (!this.has(e.uid)) {
                throw new Error('entity in document ' + JSON.stringify(e) + ' not found here');
            }

            if (this.get(e.uid)!.entity !== e) {
                throw new Error('entity in document ' + JSON.stringify(e) + ' not in sync with us ' +
                    JSON.stringify(this.get(e.uid)!.entity));
            }
        });

        // 2. Everything in us must be in doc.
        this.forEach((o, k) => {
            if (o.entity === undefined) {
                throw new Error('object ' + k + ' is deleted in document but still here');
            }
            const lvlUid = this.levelOfEntity.get(o.entity.uid)!;

            if (lvlUid === null) {
                if (!(o.entity.uid in doc.drawing.shared)) {
                    throw new Error('Entity ' + JSON.stringify(o.entity) + ' not in document');
                }
            } else {
                if (!(lvlUid in doc.drawing.levels)) {
                    throw new Error('Level we have ' + lvlUid + ' doesn\'t exist on document');
                }


                if (!(o.entity.uid in doc.drawing.levels[lvlUid].entities)) {
                    throw new Error('Entity ' + JSON.stringify(o.entity) + ' not in document');
                }
            }
        });

        this.entitiesInLevel.forEach((es, lvlUid) => {
            if (lvlUid === null) {
                return;
            }

            if (!(lvlUid in doc.drawing.levels)) {
                throw new Error('Level we have ' + lvlUid + ' doesn\'t exist on document');
            }


            es.forEach((e) => {
                if (!(e in doc.drawing.levels[lvlUid].entities)) {
                    throw new Error('Entity ' + e + ' not in document');
                }
            });
        });

        // 3. Connections must be accurate
        this.connections.forEach((cons, euid) => {
            cons.forEach((c) => {
                const p = this.get(c) as Pipe;
                if (!p.entity.endpointUid.includes(euid)) {
                    const co = this.get(euid);
                    throw new Error('connection inconsistency in connectable ' + JSON.stringify(co ? co.entity : undefined) + ' to pipe ' + JSON.stringify(p.entity));
                }
            });
        });

        this.forEach((o) => {
            if (o.entity.type === EntityType.PIPE) {
                o.entity.endpointUid.forEach((euid) => {
                    if (!this.connections.get(euid)) {
                        throw new Error('connection ' + euid + ' on pipe ' + JSON.stringify(o.entity) + ' is not found');
                    }
                    if (!this.connections.get(euid)!.includes(o.entity.uid)) {
                        throw new Error('connection inconsistency in pipe ' + JSON.stringify(o.entity) + ' to connectable ' + euid + ' with connections ' + JSON.stringify(this.connections.get(euid)));
                    }
                })
            }
        });
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
