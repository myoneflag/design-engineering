import {Color, Coord, DrawableEntity} from '@/store/document/types';

export default interface FlowSource extends DrawableEntity {
    center: Coord;
    radiusMM: number;
    maximumVelocityMS: number | null; // null means default
    heightAboveFloorM: number;
    material: string | null;
    spareCapacity: number | null;
    color: Color | null;
    temperatureC: number | null;
    pressureAtSourceKPA: number;
    systemUid: string;
}
