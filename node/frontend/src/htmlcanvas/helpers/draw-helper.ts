import { Side } from "./side";

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
                height: side === Side.TOP || side === Side.BOTTOM ? base / 10 : base,
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