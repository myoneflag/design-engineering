import {Coord, Dimensions} from '@/store/document/types';

export default abstract class DrawableObject {
    center: Coord = {x: 0, y: 0};
    dimensions: Dimensions = {w: 0, h: 0};

    toObjectCoord(world: Coord) {
        return {x: world.x - this.center.x, y: world.y - this.center.y};
    }

    toWorldCoord(object: Coord) {
        return {x: object.x + this.center.x, y: object.y + this.center.y };
    }
}
