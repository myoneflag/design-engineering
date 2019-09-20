import {Coord, FlowSystemParameters} from '@/store/document/types';
import {EntityType} from '@/store/document/entities/types';

export interface PipeInteraction {
    type: InteractionType.CONTINUING_PIPE | InteractionType.STARTING_PIPE;
    system: FlowSystemParameters;
}

export interface InsertInteraction {
    type: InteractionType.INSERT;
    entityType: EntityType;
}

export interface BaseInteraction {
    type: InteractionType;
    worldCoord: Coord;
    worldRadius: number;
}

export type Interaction = (PipeInteraction | InsertInteraction) & BaseInteraction;

export enum InteractionType {
    STARTING_PIPE,
    CONTINUING_PIPE,
    INSERT,
}
