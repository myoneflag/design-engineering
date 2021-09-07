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


export function prepareStroke(entity:BaseBackedObject,ctx: CanvasRenderingContext2D){
    if(!entity.isActive())    
        ctx.strokeStyle = inactiveColor;
}
export function prepareFill(entity:BaseBackedObject,ctx: CanvasRenderingContext2D){
    if(!entity.isActive())    
        ctx.fillStyle = inactiveColor;
}