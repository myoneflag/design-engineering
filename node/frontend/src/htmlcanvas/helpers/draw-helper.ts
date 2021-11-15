import BaseBackedObject from "../lib/base-backed-object";
import { Side } from "./side";
const inactiveColor="rgba(150, 150, 150, 0.65)"
export function drawPipeCap(ctx: CanvasRenderingContext2D, point: Point, side: Side, strokeStyle: string = "#000") {
        const base:number=50;
        const rectangles: Rectangle[] = [
            {
                point:
                    side === Side.TOP
                        ? { top: point.top - base / 2, left: point.left - base / 2 }
                        : side === Side.BOTTOM
                        ? { top: point.top + base / 2, left: point.left - base / 2 }
                        : point,
                width: side === Side.TOP || side === Side.BOTTOM ? base : base / 10,
                height: side === Side.TOP || side === Side.BOTTOM ? base / 10: base+5,
                strokeStyle
            },
            {
                point:
                    side === Side.LEFT
                        ? point
                        : side === Side.TOP
                        ? { top: point.top - base / 2, left: point.left - base / 2 }
                        : side === Side.BOTTOM
                        ? { top: point.top, left: point.left - base / 2 }
                        : { top: point.top, left: point.left - base / 2 },
                width: side === Side.TOP || side === Side.BOTTOM ? base / 10 : base / 2,
                height: side === Side.TOP || side === Side.BOTTOM ? base / 2 : base / 10,
                strokeStyle
            },
            {
                point:
                    side === Side.LEFT
                        ? { top: point.top + base, left: point.left }
                        : side === Side.TOP
                        ? { top: point.top - base / 2, left: point.left - base / 2 + base }
                        : side === Side.BOTTOM
                        ? { top: point.top, left: point.left - base / 2 + base }
                        : { top: point.top + base, left: point.left - base / 2 },
                width: side === Side.TOP || side === Side.BOTTOM ? base / 10 : base / 2,
                height: side === Side.TOP || side === Side.BOTTOM ? base / 2 : base / 10,
                strokeStyle
            }
        ];
        drawRectangles(ctx, rectangles);
        
    }
export function drawRectangles(ctx: CanvasRenderingContext2D, rectangles: Rectangle[]) {

  ctx.beginPath();
  rectangles.forEach((rectangle:Rectangle)=>{
    ctx.strokeStyle= rectangle.strokeStyle || '#000';
    ctx.rect(rectangle.point.left, rectangle.point.top, rectangle.width, rectangle.height);    
  })
  ctx.stroke();
}

/* Draw Round Rectangle */
export function drawRoundRectangle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: boolean = true,
    stroke: boolean = false
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

/* Draw Warning Icon */
export function drawWarningIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
) {
    // Triangle
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
    // Exclamation mark
    ctx.font = `bold ${height}px serif`;
    ctx.fillText("!", x + width / 2 - 5, y + height - 2);
}

export function prepareStroke(entity:BaseBackedObject,ctx: CanvasRenderingContext2D){
    if(!entity.isActive())    
        ctx.strokeStyle = inactiveColor;
}
export function prepareFill(entity:BaseBackedObject,ctx: CanvasRenderingContext2D){
    if(!entity.isActive())    
        ctx.fillStyle = inactiveColor;
}