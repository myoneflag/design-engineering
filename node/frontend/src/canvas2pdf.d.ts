declare module "canvas2svg" {
    export default class C2S extends CanvasRenderingContext2D {
        constructor(width: number, height: number);
        getSerializedSvg(): string;
    }
}
