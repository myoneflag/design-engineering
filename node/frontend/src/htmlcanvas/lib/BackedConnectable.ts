import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete,
    hasExplicitSystemUid,
    isConnectableEntity,
    isConnectableEntityType
} from "../../../../common/src/api/document/entities/concrete-entity";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import { getDragPriority } from "../../../src/store/document";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { Matrix } from "transformation-matrix";
import { Coord } from "../../../../common/src/api/document/drawing";
import { determineConnectableSystemUid } from "../../store/document/entities/lib";
import { SystemNodeEntity } from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { flowSystemsCompatible } from "./utils";
import { Direction } from "../types";

// TODO: this entire abstract class is obsolete and should be encapsulated in the ConnectableObject
// decorator.
export default abstract class BackedConnectable<T extends ConnectableEntityConcrete> extends BackedDrawableObject<T> {
    entity: T;
    abstract minimumConnections: number;
    abstract maximumConnections: number | null;

    /**
     * Entity with higher drag priority is kept when dragging one connectable onto another.
     */
    abstract dragPriority: number;

    prepareDeleteConnection(uid: string, context: CanvasContext): BaseBackedObject[] {
        // Remove 0 Way Fittings and Tee from Deleted Pipes
        if (
            !this.globalStore.getConnections(this.entity.uid).length ||
            (this.globalStore.getConnections(this.entity.uid).length == 2 && this.isStraight(1))
        ) {
            return this.prepareDelete(context);
        } else {
            return [];
        }
    }

    flowSystemsCompatible(a: string, b: string) {
        return flowSystemsCompatible(a, b, this.document.drawing);
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        let allowAllSystemUid = false;
        if (this.entity.type === EntityType.SYSTEM_NODE) {
            if ((this.entity as SystemNodeEntity).allowAllSystems) {
                allowAllSystemUid = true;
            }
        }

        switch (interaction.type) {
            case InteractionType.INSERT:
                if (
                    isConnectableEntityType(interaction.entityType) &&
                    getDragPriority(interaction.entityType) >= this.dragPriority
                ) {
                    if (hasExplicitSystemUid(this.entity) && interaction.systemUid) {
                        if (!this.flowSystemsCompatible(interaction.systemUid, this.entity.systemUid) && !allowAllSystemUid) {
                            return null;
                        }
                    }
                    return [this.entity];
                }
                return null;
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE: {
                const resultingConnections = this.globalStore.getConnections(this.entity.uid).length + 1;
                if (this.numConnectionsInBound(resultingConnections)) {
                    if (hasExplicitSystemUid(this.entity)) {
                        if (!this.flowSystemsCompatible(interaction.system.uid, this.entity.systemUid) && !allowAllSystemUid) {
                            return null;
                        }
                        // load nodes can't do two of the same type.
                    }
                    return [this.entity];
                } else {
                    return null;
                }
            }
            case InteractionType.MOVE_ONTO_RECEIVE: {
                if (interaction.src.uid === this.uid) {
                    return null;
                }
                if (isConnectableEntity(interaction.src)) {
                    if (getDragPriority(interaction.src.type) >= this.dragPriority) {
                        return [this.entity];
                    }
                    if (
                        this.numConnectionsInBound(
                            this.numConnectionsAfterMerging(interaction.src as ConnectableEntityConcrete)
                        )
                    ) {
                        if (hasExplicitSystemUid(this.entity) && hasExplicitSystemUid(interaction.src)) {
                            if (!this.flowSystemsCompatible(interaction.src.systemUid, this.entity.systemUid) && !allowAllSystemUid) {
                                return null;
                            }
                        }
                        return [this.entity];
                    }
                    return null;
                } else {
                    return null;
                }
            }
            case InteractionType.MOVE_ONTO_SEND: {
                if (interaction.dest.uid === this.uid) {
                    return null;
                }
                if (isConnectableEntity(interaction.dest)) {
                    if (getDragPriority(interaction.dest.type) > this.dragPriority) {
                        return [this.entity];
                    }
                    if (
                        this.numConnectionsInBound(
                            this.numConnectionsAfterMerging(interaction.dest as ConnectableEntityConcrete)
                        )
                    ) {
                        if (hasExplicitSystemUid(this.entity) && hasExplicitSystemUid(interaction.dest)) {
                            if (!this.flowSystemsCompatible(interaction.dest.systemUid, this.entity.systemUid) && !allowAllSystemUid) {
                                return null;
                            }
                        }
                        return [this.entity];
                    }
                    return null;
                } else if (interaction.dest.type === EntityType.PIPE) {
                    if (this.globalStore.getConnections(this.entity.uid).includes(interaction.dest.uid)) {
                        return null;
                    }
                    if (this.numConnectionsInBound(this.globalStore.getConnections(this.entity.uid).length + 2)) {
                        return [this.entity];
                    }
                }
                return null;
            }
            case InteractionType.EXTEND_NETWORK:
                let isSystemCorrect: boolean = false;
                const entity = this.entity as ConnectableEntityConcrete;

                if (entity.type === EntityType.DIRECTED_VALVE || entity.type === EntityType.LOAD_NODE) {
                    const suid = determineConnectableSystemUid(this.globalStore, entity);
                    isSystemCorrect = interaction.systemUid === null || flowSystemsCompatible(interaction.systemUid, suid!, this.document.drawing);
                } else {
                    isSystemCorrect =
                        allowAllSystemUid ||
                        interaction.systemUid === null ||
                        this.flowSystemsCompatible(interaction.systemUid, entity.systemUid);
                }

                if (isSystemCorrect) {
                    if (this.numConnectionsInBound(this.globalStore.getConnections(this.entity.uid).length + 1)) {
                        return [this.entity];
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
        }
    }

    numConnectionsAfterMerging(other: ConnectableEntityConcrete): number {
        let resultingConnections =
            this.globalStore.getConnections(other.uid).length + this.globalStore.getConnections(this.entity.uid).length;
        const inCommon = this.globalStore.getConnections(other.uid).filter((puid) => {
            return this.globalStore.getConnections(this.entity.uid).indexOf(puid) !== -1;
        }).length;
        resultingConnections -= inCommon;
        return resultingConnections;
    }

    numConnectionsInBound(num: number): boolean {
        if ((this.maximumConnections === null || num <= this.maximumConnections) && num >= this.minimumConnections) {
            return true;
        }
        return false;
    }

    getAngleOfRad(connection: string): number {
        throw new Error("Method not implemented");
    }

    getAngleDiffs(): number[] {
        throw new Error("Method not implemented.");
    }

    isStraight(tolerance?: number): boolean {
        throw new Error("Method not implemented.");
    }

    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> {
        /* */
        throw new Error("Method not implemented.");
    }

    connect(uid: string) {
        //
    }

    disconnect(uid: string) {
        //
    }

    dragByBackConnectableEntity(context: CanvasContext, pipeUid: string, point: Coord, originCenter: Coord, direction?: Direction, skip?: boolean) {
        //
    }

    get position(): Matrix {
        throw new Error("Method not implemented - use @Connectable");
    }
}

export type BaseBackedConnectable = BackedConnectable<ConnectableEntityConcrete>;
