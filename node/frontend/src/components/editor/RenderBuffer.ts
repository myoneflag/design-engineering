import * as TM from "transformation-matrix";

export class Buffer {
    canvas: HTMLCanvasElement;
    transform: TM.Matrix;
    excluded: Set<string>;
    included: string[] = [];

    constructor(width: number, height: number, transform: TM.Matrix, reactive: Set<string>) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.transform = transform;
        this.excluded = reactive;
    }

    drawOnto(ctx: CanvasRenderingContext2D, newTransform: TM.Matrix) {
        const appliedTransform = TM.transform(newTransform, TM.inverse(this.transform));
        ctx.setTransform(appliedTransform);
        ctx.drawImage(this.canvas, 0, 0);
    }

    get ctx() {
        return this.canvas.getContext("2d")!;
    }
}
