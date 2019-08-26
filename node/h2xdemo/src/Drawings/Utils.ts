import {ViewPort} from '@/Drawings/2DViewport';

export  const createViewportForPaper =
    (ctx: CanvasRenderingContext2D, paperW: number, paperH: number, innerPadding: number = 20)
        : [ViewPort, number] => {
    let width = ctx.canvas.width;
    let height = ctx.canvas.height;

    let ws = ( width - innerPadding * 2 ) / paperW;
    let hs = ( height - innerPadding * 2 ) / paperH;
    let pxPerMm = Math.min(ws, hs);

    return [new ViewPort(
        paperW/2, paperH/2,
        width, height,
        pxPerMm
    ), pxPerMm];
};

export const parseScale = (repr: string) => {
    let match = repr.match('^([0-9]+):([0-9]+)$');
    if (match) {
        let [_, l, r] = match;
        return parseInt(l) / parseInt(r);
    }
    return 1;
};

/*
export const rescaleAnchor = (
    obj: {centerX: number, centerY: number, scale: number},
    newScale: number,
    anchorX: number,
    anchorY: number,
) => {
    // where will the anchor be after the resize?
    const dx = anchorX - obj.centerX;
    const dy = anchorY - obj.centerY;
    const nx = obj.centerX + dx * newScale / obj.scale;
    const ny = obj.centerY + dy * newScale / obj.scale;
    obj.centerX -= anchorX - nx;
    obj.centerY -= anchorY - ny;
    obj.scale = newScale;
};*/
