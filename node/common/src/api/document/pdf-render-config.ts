// Remember to change the parallel settings in the javascript lambda function pdf-renderer, which actually
// does the exporting work.
export enum RenderSize {
    SMALL,
    MEDIUM,
    LARGE
}

export interface RenderSizeOptions {
    id: RenderSize;
    density: number;
    suffix: string;
}

export const RENDER_SIZES: RenderSizeOptions[] = [
    {id: RenderSize.SMALL, density: 20, suffix: '-small'},
    {id: RenderSize.MEDIUM, density: 72, suffix: '-medium'},
    {id: RenderSize.LARGE, density: 200, suffix: '-large'},
]

