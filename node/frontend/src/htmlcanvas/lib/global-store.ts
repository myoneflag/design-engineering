// Stores auxillary data and objects for the entire document across all levels.
import {
    CalculatableEntityConcrete,
    DrawableEntityConcrete
} from "../../../../common/src/api/document/entities/concrete-entity";
import { DocumentState } from "../../store/document/types";
import BaseBackedObject from "./base-backed-object";
import Vue from "vue";
import DrawableObjectFactory from "./drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import PipeCalculation, { emptyPipeCalculation } from "../../store/document/calculations/pipe-calculation";
import RiserEntity from "../../../../common/src/api/document/entities/riser-entity";
import RiserCalculation, { emptyRiserCalculations } from "../../store/document/calculations/riser-calculation";
import BigValveEntity, { SystemNodeEntity } from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
// tslint:disable-next-line:max-line-length
import BigValveCalculation, {
    EmptyBigValveCalculations
} from "../../store/document/calculations/big-valve-calculation";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import FittingCalculation, { emptyFittingCalculation } from "../../store/document/calculations/fitting-calculation";
import FixtureEntity from "../../../../common/src/api/document/entities/fixtures/fixture-entity";
import FixtureCalculation, { emptyFixtureCalculation } from "../../store/document/calculations/fixture-calculation";
import DirectedValveEntity from "../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
// tslint:disable-next-line:max-line-length
import DirectedValveCalculation, {
    emptyDirectedValveCalculation
} from "../../store/document/calculations/directed-valve-calculation";
// tslint:disable-next-line:max-line-length
import SystemNodeCalculation, {
    emptySystemNodeCalculation
} from "../../store/document/calculations/system-node-calculation";
import LoadNodeEntity from "../../../../common/src/api/document/entities/load-node-entity";
import LoadNodeCalculation from "../../store/document/calculations/load-node-calculation";
import Pipe from "../objects/pipe";
import { ObjectStore } from "./object-store";
import FlowSourceEntity from "../../../../common/src/api/document/entities/flow-source-entity";
import FlowSourceCalculation, { emptyFlowSourceCalculation } from "../../store/document/calculations/flow-source-calculation";
import PlantEntity from "../../../../common/src/api/document/entities/plant-entity";
import PlantCalculation, { emptyPlantCalculation } from "../../store/document/calculations/plant-calculation";
import { assertUnreachable } from "../../../../common/src/api/config";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { CalculationConcrete } from "../../store/document/calculations/calculation-concrete";

export class GlobalStore extends ObjectStore {
    entitiesInLevel = new Map<string | null, Set<string>>();
    levelOfEntity = new Map<string, string | null>();

    calculationStore = new Map<string, CalculationConcrete>();

    lastDoc: DocumentState | undefined = undefined;

    set(key: string, value: BaseBackedObject, levelUid?: string | null): this {
        if (levelUid === undefined) {
            throw new Error("Need a level to set in global store.");
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
            throw new Error("doc is different");
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
                            throw new Error("level not found " + levelUid);
                        }
                        return levelUid ? doc.drawing.levels[levelUid].entities[e.uid] : doc.drawing.shared[e.uid];
                    },
                    this,
                    levelUid,
                    vm
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

    getOrCreateCalculation(entity: PipeEntity): PipeCalculation;
    getOrCreateCalculation(entity: RiserEntity): RiserCalculation;
    getOrCreateCalculation(entity: BigValveEntity): BigValveCalculation;
    getOrCreateCalculation(entity: FittingEntity): FittingCalculation;
    getOrCreateCalculation(entity: FixtureEntity): FixtureCalculation;
    getOrCreateCalculation(entity: DirectedValveEntity): DirectedValveCalculation;
    getOrCreateCalculation(entity: SystemNodeEntity): SystemNodeCalculation;
    getOrCreateCalculation(entity: LoadNodeEntity): LoadNodeCalculation;
    getOrCreateCalculation(entity: FlowSourceEntity): FlowSourceCalculation;
    getOrCreateCalculation(entity: PlantEntity): PlantCalculation;
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
                case EntityType.BIG_VALVE:
                    this.calculationStore.set(entity.uid, cloneSimple(EmptyBigValveCalculations(entity)));
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
                case EntityType.FLOW_SOURCE:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyFlowSourceCalculation()));
                case EntityType.PLANT:
                    this.calculationStore.set(entity.uid, cloneSimple(emptyPlantCalculation()));
                    break;
                default:
                    assertUnreachable(entity);
            }
        }

        return this.calculationStore.get(entity.uid)!;
    }

    getCalculation(entity: PipeEntity): PipeCalculation | undefined;
    getCalculation(entity: RiserEntity): RiserCalculation | undefined;
    getCalculation(entity: BigValveEntity): BigValveCalculation | undefined;
    getCalculation(entity: FittingEntity): FittingCalculation | undefined;
    getCalculation(entity: FixtureEntity): FixtureCalculation | undefined;
    getCalculation(entity: DirectedValveEntity): DirectedValveCalculation | undefined;
    getCalculation(entity: SystemNodeEntity): SystemNodeCalculation | undefined;
    getCalculation(entity: LoadNodeEntity): LoadNodeCalculation | undefined;
    getCalculation(entity: FlowSourceEntity): FlowSourceCalculation | undefined;
    getCalculation(entity: PlantEntity): PlantCalculation | undefined;
    getCalculation(entity: CalculatableEntityConcrete): CalculationConcrete | undefined;

    getCalculation(entity: CalculatableEntityConcrete): CalculationConcrete | undefined {
        return this.calculationStore.get(entity.uid);
    }

    setCalculation(uid: string, calculation: CalculationConcrete) {
        this.calculationStore.set(uid, calculation);
    }

    clearCalculations() {
        this.calculationStore.clear();
    }

    sanityCheck(doc: DocumentState) {
        if (this.lastDoc !== undefined && doc !== this.lastDoc) {
            throw new Error("Document changed");
        }
        this.lastDoc = doc;

        // test that there is an exact bijection from document to things.

        // 1. Everything in doc must be in us.
        Object.values(doc.drawing.levels).forEach((l) => {
            Object.values(l.entities).forEach((e) => {
                if (!this.has(e.uid)) {
                    throw new Error("entity in document " + JSON.stringify(e) + " not found here");
                }

                if (this.get(e.uid)!.entity !== e) {
                    throw new Error(
                        "entity in document " +
                            JSON.stringify(e) +
                            " not in sync with us " +
                            JSON.stringify(this.get(e.uid)!.entity)
                    );
                }
            });
        });

        Object.values(doc.drawing.shared).forEach((e) => {
            if (!this.has(e.uid)) {
                throw new Error("entity in document " + JSON.stringify(e) + " not found here");
            }

            if (this.get(e.uid)!.entity !== e) {
                throw new Error(
                    "entity in document " +
                        JSON.stringify(e) +
                        " not in sync with us " +
                        JSON.stringify(this.get(e.uid)!.entity)
                );
            }
        });

        // 2. Everything in us must be in doc.
        this.forEach((o, k) => {
            if (o.entity === undefined) {
                throw new Error("object " + k + " is deleted in document but still here");
            }
            const lvlUid = this.levelOfEntity.get(o.entity.uid)!;

            if (lvlUid === null) {
                if (!(o.entity.uid in doc.drawing.shared)) {
                    throw new Error("Entity " + JSON.stringify(o.entity) + " not in document");
                }
            } else {
                if (!(lvlUid in doc.drawing.levels)) {
                    throw new Error("Level we have " + lvlUid + " doesn't exist on document");
                }

                if (!(o.entity.uid in doc.drawing.levels[lvlUid].entities)) {
                    throw new Error("Entity " + JSON.stringify(o.entity) + " not in document");
                }
            }
        });

        this.entitiesInLevel.forEach((es, lvlUid) => {
            if (lvlUid === null) {
                return;
            }

            if (!(lvlUid in doc.drawing.levels)) {
                throw new Error("Level we have " + lvlUid + " doesn't exist on document");
            }

            es.forEach((e) => {
                if (!(e in doc.drawing.levels[lvlUid].entities)) {
                    throw new Error("Entity " + e + " not in document");
                }
            });
        });

        // 3. Connections must be accurate
        this.connections.forEach((cons, euid) => {
            cons.forEach((c) => {
                const p = this.get(c) as Pipe;
                if (!p.entity.endpointUid.includes(euid)) {
                    const co = this.get(euid);
                    throw new Error(
                        "connection inconsistency in connectable " +
                            JSON.stringify(co ? co.entity : undefined) +
                            " to pipe " +
                            JSON.stringify(p.entity)
                    );
                }
            });
        });

        this.forEach((o) => {
            if (o.entity.type === EntityType.PIPE) {
                o.entity.endpointUid.forEach((euid) => {
                    if (!this.connections.get(euid)) {
                        throw new Error(
                            "connection " + euid + " on pipe " + JSON.stringify(o.entity) + " is not found"
                        );
                    }
                    if (!this.connections.get(euid)!.includes(o.entity.uid)) {
                        throw new Error(
                            "connection inconsistency in pipe " +
                                JSON.stringify(o.entity) +
                                " to connectable " +
                                euid +
                                " with connections " +
                                JSON.stringify(this.connections.get(euid))
                        );
                    }
                });
            }
        });
    }
}
