import { Coord, FlowSystemParameters } from "../../../src/store/document/types";
import { EntityType } from "../../../src/store/document/entities/types";
import { DrawableEntityConcrete } from "../../../src/store/document/entities/concrete-entity";
import { FlowConfiguration } from "../../store/document/entities/big-valve/big-valve-entity";

export interface PipeInteraction extends BaseInteraction {
    type: InteractionType.CONTINUING_PIPE | InteractionType.STARTING_PIPE;
    system: FlowSystemParameters;
}

export interface InsertInteraction extends BaseInteraction {
    type: InteractionType.INSERT;
    entityType: EntityType;
}

export interface MovePointToDest extends BaseInteraction {
    type: InteractionType.MOVE_ONTO_RECEIVE;
    src: DrawableEntityConcrete;
}

export interface MovePointToSrc extends BaseInteraction {
    type: InteractionType.MOVE_ONTO_SEND;
    dest: DrawableEntityConcrete;
}

export interface BaseInteraction {
    type: InteractionType;
    worldCoord: Coord;
    worldRadius: number;
}

export interface ExtendNetworkInteraction extends BaseInteraction {
    type: InteractionType.EXTEND_NETWORK;
    systemUid: string | null; // null means any
    configuration: FlowConfiguration;
}

export type Interaction =
    | PipeInteraction
    | InsertInteraction
    | MovePointToDest
    | MovePointToSrc
    | ExtendNetworkInteraction;

export enum InteractionType {
    STARTING_PIPE,
    CONTINUING_PIPE,
    INSERT,
    EXTEND_NETWORK,
    MOVE_ONTO_RECEIVE,
    MOVE_ONTO_SEND
}
