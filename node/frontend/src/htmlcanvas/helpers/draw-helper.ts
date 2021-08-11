import { Side } from "./side";

export function drawPipeCap(ctx: CanvasRenderingContext2D, point: Point, side: Side, strokeStyle: string = "#000") {
        const base:number=50;
        const rectangles: Rectangle[] = [
            {
                point: point,
                width: base / 10,
                height: base,
                strokeStyle
            },
            {
                point: side === Side.LEFT ? point : { top: point.top, left: point.left - base/2 },
                width: base / 2,
                height: base / 10,
                strokeStyle
            },
            {
                point:
                    side === Side.LEFT
                        ? { top: point.top + base, left: point.left }
                        : { top: point.top + base, left: point.left - base / 2 },
                width: base / 2,
                height: base / 10,
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