import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete, isConnectableEntity, isConnectableEntityType
} from "../../../src/store/document/entities/concrete-entity";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import { getDragPriority} from "../../../src/store/document";
import { EntityType } from "../../../src/store/document/entities/types";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { Coord } from "../../../src/store/document/types";
import { determineConnectableSystemUid } from "../../../src/store/document/entities/directed-valves/directed-valve-entity";
import { Matrix } from "transformation-matrix";
import * as TM from "transformation-matrix";

// TODO: this entire abstract class is obsolete and should be encapsulated in the ConnectableObject
// decorator.
export default abstract class BackedConnectable<T extends ConnectableEntityConcrete> extends BackedDrawableObject<T> {
    abstract minimumConnections: number;
    abstract maximumConnections: number | null;

    /**
     * Entity with higher drag priority is kept when dragging one connectable onto another.
     */
    abstract dragPriority: number;

    prepareDeleteConnection(uid: string, context: CanvasContext): BaseBackedObject[] {
        if (this.objectStore.getConnections(this.entity.uid).length < this.minimumConnections) {
            return this.prepareDelete(context);
        } else {
            return [];
        }
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        switch (interaction.type) {
            case InteractionType.INSERT:
                if (
                    isConnectableEntityType(interaction.entityType) &&
                    getDragPriority(interaction.entityType) >= this.dragPriority
                ) {
                    return [this.entity];
                }
                return null;
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE: {
                const resultingConnections = this.objectStore.getConnections(this.entity.uid).length + 1;
                if (this.numConnectionsInBound(resultingConnections)) {
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
                        return [this.entity];
                    }
                    return null;
                } else if (interaction.dest.type === EntityType.PIPE) {
                    if (this.objectStore.getConnections(this.entity.uid).includes(interaction.dest.uid)) {
                        return null;
                    }
                    if (this.numConnectionsInBound(this.objectStore.getConnections(this.entity.uid).length + 2)) {
                        return [this.entity];
                    }
                }
                return null;
            }
            case InteractionType.EXTEND_NETWORK:
                let isSystemCorrect: boolean = false;
                const entity = this.entity as ConnectableEntityConcrete;

                if (entity.type === EntityType.DIRECTED_VALVE || entity.type === EntityType.LOAD_NODE) {
                    const suid = determineConnectableSystemUid(this.objectStore, entity);
                    isSystemCorrect = interaction.systemUid === null || interaction.systemUid === suid;
                } else {
                    isSystemCorrect = interaction.systemUid === null || interaction.systemUid === entity.systemUid;
                }

                if (isSystemCorrect) {
                    if (this.numConnectionsInBound(this.objectStore.getConnections(this.entity.uid).length + 1)) {
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
            this.objectStore.getConnections(other.uid).length + this.objectStore.getConnections(this.entity.uid).length;
        const inCommon = this.objectStore.getConnections(other.uid).filter((puid) => {
            return this.objectStore.getConnections(this.entity.uid).indexOf(puid) !== -1;
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

    get position(): Matrix {
        throw new Error("Method not implemented - use @Connectable");
    }
}

export type BaseBackedConnectable = BackedConnectable<ConnectableEntityConcrete>;
