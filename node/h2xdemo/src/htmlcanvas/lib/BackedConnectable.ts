import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {ConnectableEntityConcrete, DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import {getDragPriority, isConnectable} from '@/store/document';
import {EntityType} from '@/store/document/entities/types';
import Flatten from '@flatten-js/core';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {FlowNode} from '@/calculations/calculation-engine';
import {CalculationContext} from '@/calculations/types';
import Pipe from '@/htmlcanvas/objects/pipe';
import {Coord} from '@/store/document/types';

// TODO: this entire abstract class is obsolete and should be encapsulated in the ConnectableObject
// decorator.
export default abstract class BackedConnectable<T extends ConnectableEntityConcrete>
    extends BackedDrawableObject<T> {
    abstract minimumConnections: number;
    abstract maximumConnections: number | null;

    /**
     * Entity with higher drag priority is kept when dragging one connectable onto another.
     */
    abstract dragPriority: number;

    prepareDeleteConnection(uid: string, context: CanvasContext): BaseBackedObject[] {
        this.disconnect(uid);
        if (this.entity.connections.length < this.minimumConnections) {
            return this.prepareDelete(context);
        } else {
            return [];
        }
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        switch (interaction.type) {
            case InteractionType.INSERT:
                if (isConnectable(interaction.entityType) &&
                    getDragPriority(interaction.entityType) >= this.dragPriority
                ) {
                    return [this.entity];
                }
                return null;
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE: {
                const resultingConnections = this.entity.connections.length + 1;
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
                if ('connections' in interaction.src) {
                    if (getDragPriority(interaction.src.type) >= this.dragPriority) {
                        return [this.entity];
                    }
                    if (this.numConnectionsInBound(this.numConnectionsAfterMerging(interaction.src))) {
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
                if ('connections' in interaction.dest) {
                    if (getDragPriority(interaction.dest.type) > this.dragPriority) {
                        return [this.entity];
                    }
                    if (this.numConnectionsInBound(this.numConnectionsAfterMerging(interaction.dest))) {
                        return [this.entity];
                    }
                    return null;
                } else if (interaction.dest.type === EntityType.PIPE) {
                    if (this.entity.connections.includes(interaction.dest.uid)) {
                        return null;
                    }
                    if (this.numConnectionsInBound(this.entity.connections.length + 2)) {
                        return [this.entity];
                    }
                }
                return null;
            }
            case InteractionType.EXTEND_NETWORK:
                if (interaction.systemUid === null || interaction.systemUid === this.entity.systemUid) {
                    if (this.numConnectionsInBound(this.entity.connections.length + 1)) {
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
        let resultingConnections = other.connections.length + this.entity.connections.length;
        const inCommon = other.connections.filter((puid) => {
            return this.entity.connections.indexOf(puid) !== -1;
        }).length;
        resultingConnections -= inCommon;
        return resultingConnections;
    }

    numConnectionsInBound(num: number): boolean {
        if ((this.maximumConnections === null || num <= this.maximumConnections) &&
            num >= this.minimumConnections
        ) {
            return true;
        }
        return false;
    }

    shape(): Flatten.Segment | Flatten.Point | Flatten.Polygon | Flatten.Circle | null {
        const point = this.toWorldCoord({x: 0, y: 0});
        return Flatten.circle(Flatten.point(point.x, point.y), 30);
    }

    getAngleOfRad(connection: string): number {
        throw new Error('Method not implemented');
    }

    getAngles(): number[] {
        throw new Error('Method not implemented.');
    }

    isStraight(tolerance?: number): boolean {
        throw new Error('Method not implemented.');
    }

    debase(): void {
        throw new Error('Method not implemented.');
    }

    rebase(context: CanvasContext): void {
        throw new Error('Method not implemented.');
    }

    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> { /* */
        throw new Error('Method not implemented.');
    }

    connect(uid: string) {
        //
    }

    disconnect(uid: string) {
        //
    }


}

