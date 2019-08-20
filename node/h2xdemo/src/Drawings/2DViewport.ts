import {rescaleAnchor} from '@/Drawings/Utils';

export const EPS = 1e-5;

export class ViewPort {
    /**
     * X world coordinate
     */
    centerX: number;
    /**
     * Y world coordinate
     */
    centerY: number;
    width: number;
    height: number;
    scale: number;

    constructor(centerX: number, centerY: number, width: number, height: number, scale: number) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.width = width;
        this.height = height;
        this.scale = scale;
    }

    static from2Points(wx: number, wy: number, sx: number, sy: number,
                wx2: number, wy2: number, sx2: number, sy2: number,
                       width: number, height: number): ViewPort {
        const scale = (sx2 - sx) / (wx2 - wx);
        const scale2 = (sy - sy2) / (wy2 - wy);
        if (Math.abs(scale2 - scale) > EPS) {
            throw new Error('X and Y scales are different');
        }

        return ViewPort.fromPointAndScale(wx, wy, sx, sy, width, height, scale);
    }

    static fromPointAndScale(wx: number, wy: number, sx: number, sy: number,
                             width:number, height:number, scale: number): ViewPort {
        const sdx = sx - width / 2;
        const sdy = height / 2 - sy;
        const wdx = sdx / scale;
        const wdy = sdy / scale;
        const centerX = wx - wdx;
        const centerY = wy - wdy;
        return new ViewPort(centerX, centerY, width, height, scale);
    }

    rescale(newScale: number, anchorX: number, anchorY: number) {
        const [sx, sy] = this.toScreenCoord(anchorX, anchorY);
        this.scale = newScale;
        const [wx, wy] = this.toWorldCoord(sx, sy);
        this.centerX += anchorX - wx;
        this.centerY += anchorY - wy;
    }

    /**
     * Pans the given world coordinates
     * @param dx
     * @param dy
     */
    pan(dx: number, dy: number) {
        this.centerX += dx;
        this.centerY += dy;
    }

    /**
     * Pans the given screen pixels. Note the y coordinates are inverted
     * @param dx
     * @param dy
     */
    panAbs(dx: number, dy: number) {
        this.centerX += dx / this.scale;
        this.centerY -= dy / this.scale;
    }

    /**
     * Take a world coordinate and project to the screen
     * @param x
     * @param y
     */
    toScreenCoord(x: number, y: number): [number, number] {
        const xOffset = x - this.centerX;
        const yOffset = this.centerY - y;

        return [xOffset * this.scale + this.width / 2, yOffset * this.scale + this.height / 2];
    }

    toScreenLength(len: number) {
        return len * this.scale;
    }

    /**
     * Takes a screen coordinate and finds the world coordinate
     * @param x
     * @param y
     */
    toWorldCoord(x: number, y: number): [number, number] {
        const xDiff = (x - this.width / 2) / this.scale;
        const yDiff = (this.height / 2 - y) / this.scale;
        return [xDiff + this.centerX, yDiff + this.centerY];
    }
}
