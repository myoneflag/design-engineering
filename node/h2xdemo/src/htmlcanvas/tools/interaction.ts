import {Coord} from '@/store/document/types';

export interface Interaction {
    type: InteractionType;
    wc: Coord;
}

export enum InteractionType {
    STARTING_PIPE,
    CONTINUING_PIPE,
    INSERT,
}
