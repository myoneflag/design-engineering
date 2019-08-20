import {ViewPort} from '@/Drawings/2DViewport';

export const fillRect = (ctx: CanvasRenderingContext2D, vp: ViewPort,
                         wx: number, wy: number, ww: number, wh: number) => {
    const [x, y] = vp.toScreenCoord(wx, wy);
    const w = vp.toScreenLength(ww);
    const h = vp.toScreenLength(wh);
    ctx.fillRect(x, y, w, h);
};

export const rect = (ctx: CanvasRenderingContext2D, vp: ViewPort,
                         wx: number, wy: number, ww: number, wh: number) => {
    const [x, y] = vp.toScreenCoord(wx, wy);
    const w = vp.toScreenLength(ww);
    const h = vp.toScreenLength(wh);
    ctx.beginPath();
    ctx.strokeRect(x, y, w, h);
    ctx.stroke();
};
