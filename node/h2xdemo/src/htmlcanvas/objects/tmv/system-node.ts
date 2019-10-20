import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import {ConnectableObject} from '@/htmlcanvas/lib/object-traits/connectable';
import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {InvisibleNode} from '@/htmlcanvas/objects/invisible-node';
import Flatten from '@flatten-js/core';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {lighten} from '@/lib/utils';
import {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {getDragPriority} from '@/store/document';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';

@ConnectableObject
export default class SystemNode extends InvisibleNode<SystemNodeEntity> {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.SYSTEM_NODE, SystemNode);
    }

    minimumConnections = 0;
    maximumConnections = 1;
    dragPriority = getDragPriority(EntityType.SYSTEM_NODE);

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        switch (interaction.type) {
            case InteractionType.STARTING_PIPE:
            case InteractionType.CONTINUING_PIPE:
                if (this.entity.connections.length > 0) {
                    return null;
                }
                if (interaction.system.uid !== this.entity.systemUid) {
                    return null;
                }
                break;
            case InteractionType.MOVE_ONTO_RECEIVE:
                if (this.entity.connections.length > 0) {
                    return null;
                }
                break;
            case InteractionType.MOVE_ONTO_SEND:
                return null;
            case InteractionType.EXTEND_NETWORK:
                return null;
        }
        return super.offerInteraction(interaction);
    }


    system(doc: DocumentState) {
        const system = doc.drawing.flowSystems.find((s) => s.uid === this.entity.systemUid);
        if (system) {
            return system;
        } else {
            throw new Error('System does\'t exist');
        }
    }


    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> { /* */
    }

    drawInternal(context: DrawingContext, layerActive: boolean, selected: boolean): void {
        if (selected) {
            context.ctx.fillStyle = lighten(this.system(context.doc).color.hex, 50, 0.7);
            context.ctx.beginPath();
            context.ctx.arc(0, 0, 50, 0, Math.PI * 2);
            context.ctx.fill();
        }
    }

    inBounds(objectCoord: Coord, objectRadius: number): boolean {
        if (objectRadius) {
            if (Flatten.vector(objectCoord.x, objectCoord.y).length <= objectRadius) {
                return true;
            }
        }
        return false;
    }
    rememberToRegister(): void {
        //
    }
}
