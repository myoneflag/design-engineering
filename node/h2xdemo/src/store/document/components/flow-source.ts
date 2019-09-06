import {Coord, DrawableEntity} from '@/store/document/types';

export default interface FlowSource extends DrawableEntity {
    center: Coord;
    maximumVelocity: number | null; // null means default
    heightAboveFloor: number;
    material: string | null;
    spareCapacity: number | null;
    color: string | null;
    temperature: number | null;
    pressureAtSourceKPA: number;
    systemUid: string;
}
