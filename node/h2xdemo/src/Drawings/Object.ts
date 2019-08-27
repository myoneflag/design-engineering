import {Coord, Dimensions} from '@/store/document/types';

export default abstract class DrawableObject {
    center!: Coord;
    dimensions!: Dimensions;

    toObjectCoord(world: Coord) {
        return {x: world.x - this.center.x, y: world.y - this.center.y};
    }

    toWorldCoord(object: Coord) {
        return {x: object.x + this.center.x, y: object.y + this.center.y };
    }
}
