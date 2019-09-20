import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import {StandardFlowSystemUids} from '@/store/catalog';
import {HotRoughInEntity} from '@/store/document/entities/tmv/tmv-entity';
import {InvisibleNode} from '@/htmlcanvas/objects/invisible-node';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import {Coord, DocumentState} from '@/store/document/types';
import Flatten from '@flatten-js/core';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {lighten} from '@/lib/utils';
import {BaseBackedObject} from '@/htmlcanvas/lib/backed-drawable-object';
import {ConnectableObject} from '@/htmlcanvas/lib/object-traits/connectable';

@ConnectableObject
export default class HotRoughIn extends InvisibleNode<HotRoughInEntity> {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.HOT_ROUGH_IN, HotRoughIn);
    }

    offerInteraction(interaction: Interaction): boolean {
        switch (interaction.type) {
            case InteractionType.STARTING_PIPE:
            case InteractionType.CONTINUING_PIPE:
                if (this.entity.connections.length > 1) {
                    return false;
                }
                return interaction.system.uid === StandardFlowSystemUids.HotWater;
            case InteractionType.INSERT:
            default:
                return false;
        }
    }


    rememberToRegister(): void {
        //
    }

    system(doc: DocumentState) {
        const system = doc.drawing.flowSystems.find((s) => s.uid === StandardFlowSystemUids.HotWater);
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
            context.ctx.fillStyle = lighten(this.system(context.doc).color.hex, 50, 0.3);
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
}
