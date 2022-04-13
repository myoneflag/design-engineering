import PointTool, { KeyHandler } from "./point-tool";
import { Coord } from "../../../../common/src/api/document/drawing";
import { KeyCode } from "../utils";
import { DrawingContext } from "../lib/types";
import CanvasContext from "../lib/canvas-context";
import { MouseMoveResult } from "../types";
import Pipe from "../objects/pipe";
import { snapPoint, SnapResult } from "./snap-geometry";
import Flatten from "@flatten-js/core";
import { PAGE_ZOOM } from "../../../src/config";

export const CONNECTABLE_SNAP_RADIUS_PX = 15;

export default class SnappingInsertTool extends PointTool {
    nSnapEvents: number;
    snapTargets: string[];
    snapTargetLocs: Coord[];

    pipeSnapTargets: string[];
    pipeSnapTargetLocs: Coord[][];

    lastSnapHover: string | null;


    constructor(
        onFinish: (interrupted: boolean, displaced: boolean) => void,
        onMove: (worldCoord: Coord, event: MouseEvent) => void,
        onPointChosen: (worldCoord: Coord, event: MouseEvent) => void,
        clickActionName: string,
        keyHandlers: Array<[KeyCode, KeyHandler]> = [],
        getInfoText?: () => string[],
        lastChainUid?: string,
    ) {
        const newOnMove = (worldCoord: Coord, event: MouseEvent) => {
            if (!event.shiftKey) {
                worldCoord = this.snapWorldCoord(worldCoord);
            }
            onMove(worldCoord, event);
        };
        const newOnPointChosen = (worldCoord: Coord, event: MouseEvent) => {
            if (!event.shiftKey) {
                worldCoord = this.snapWorldCoord(worldCoord);
            }
            onPointChosen(worldCoord, event);
        };

        super(onFinish, newOnMove, newOnPointChosen, clickActionName, keyHandlers, getInfoText);
        this.clearSnapHovers();
        this.lastChainUid = lastChainUid;

        this.keyHandlers.push([
            KeyCode.SHIFT,
            {
                name: "+ don't snap",
                fn: () => {
                    this.clearSnapHovers.bind(this)();
                },
            }
        ]);
    }

    lastContext: CanvasContext;

    clearSnapHovers() {
        this.nSnapEvents = 0;
        this.snapTargets = [];
        this.lastSnapHover = null;
        this.snapTargetLocs = [];
        this.pipeSnapTargetLocs = [];
        this.pipeSnapTargets = [];
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        this.lastContext = context;
        context.$store.dispatch("document/revert", false);

        if (!event.shiftKey) {

            const wc = context.viewPort.toWorldCoord({x: event.clientX / PAGE_ZOOM, y: event.clientY / PAGE_ZOOM});
            const uids = context.visibleObjects.sort((a, b) => context.hydraulicsLayer.entitySortOrder(a.entity) - context.hydraulicsLayer.entitySortOrder(b.entity)).map((o) => o.uid).reverse();
            const interactiveUids = context.interactive ? context.interactive.map((o) => o.uid) : [];

            uids.push(...interactiveUids);

            let found = false;

            for (const ouid of uids) {
                
                const o = context.globalStore.get(ouid)!;

                if (o?.snappable) {
                    const r = o.toObjectLength(context.viewPort.toWorldLength(CONNECTABLE_SNAP_RADIUS_PX));
                    if (interactiveUids.includes(o.uid) || o.inBounds(o.toObjectCoord(wc), r)) {
                        found = true;
                        if (o.uid !== this.lastSnapHover) {
                            this.lastSnapHover = o.uid;
                            this.nSnapEvents ++;
                            const thisSnapEvent = this.nSnapEvents;
                            const ouid = o.uid;
                            let locs: Coord[];
                            let loc: Coord;

                            if (o.centered) {
                                loc = o.toWorldCoord();
                            } else if (o instanceof Pipe) {
                                locs = o.worldEndpoints().map((c3d) => ({x: c3d.x, y: c3d.y}));
                            }

                            const fn = () => {
                                if (ouid === this.lastSnapHover && this.nSnapEvents === thisSnapEvent) {

                                    if (o.centered) {
                                        if (!this.snapTargets.includes(ouid)) {
                                            this.snapTargets.splice(0, 0, ouid);
                                            this.snapTargetLocs.splice(0, 0, loc);

                                            if (this.snapTargets.length > 2) {
                                                this.snapTargets.pop();
                                                this.snapTargetLocs.pop();
                                            }

                                            context.scheduleDraw();
                                        }
                                    } else if (o instanceof Pipe) {

                                        if (!this.pipeSnapTargets.includes(ouid)) {
                                            this.pipeSnapTargets.splice(0, 0, ouid);
                                            this.pipeSnapTargetLocs.splice(0, 0, locs);

                                            if (this.pipeSnapTargets.length > 1) {
                                                this.pipeSnapTargets.pop();
                                                this.pipeSnapTargetLocs.pop();
                                            }

                                            context.scheduleDraw();
                                        }
                                    }

                                }
                            };

                            if (o.snapHoverTimeoutMS) {
                                setTimeout(() => {
                                    fn.bind(this)();
                                }, o.snapHoverTimeoutMS);
                            } else {
                                fn.bind(this)();
                            }
                        }
                        break;
                    }
                }
            }

            if (!found) {
                this.lastSnapHover = null;
            }
        }

        return super.onMouseMove(event, context);
    }

    lastSnapResult?: SnapResult;
    lastChainUid: string | undefined;

    snapWorldCoord(wc: Coord): Coord {
        const snapped = snapPoint(this.lastContext, this.snapTargets, this.pipeSnapTargets, wc, this.lastChainUid);


        this.lastSnapResult = snapped;
        if (snapped.wc) {
            return snapped.wc;
        } else {
            return wc;
        }
    }

    draw(context: DrawingContext) {
        super.draw(context);

        const ctx = context.ctx;

        // also draw snap points
        for (let i = 0; i < this.snapTargets.length; i++) {
            const suid = this.snapTargets[i];
            const locs = this.snapTargetLocs[i];
                // draw crosshair
                const wc = locs;
                const sc = context.vp.toScreenCoord(wc);

                ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
                ctx.lineWidth = 3;

                ctx.beginPath();
                ctx.moveTo(sc.x - 10, sc.y);
                ctx.lineTo(sc.x + 10, sc.y);
                ctx.moveTo(sc.x, sc.y - 10);
                ctx.lineTo(sc.x, sc.y + 10);
                ctx.stroke();
        }

        for (let i = 0; i < this.pipeSnapTargets.length; i++) {
            const suid = this.pipeSnapTargets[i];
            const locs = this.pipeSnapTargetLocs[i];

            ctx.strokeStyle = '#002299';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);

            const a = context.vp.toScreenCoord(locs[0]);
            const b = context.vp.toScreenCoord(locs[1]);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (this.lastSnapResult) {
            // draw dotted line for each reference
            if (this.lastSnapResult.references) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);

                for (const l of this.lastSnapResult.references) {
                    if (l instanceof Flatten.Line) {
                        const wc = this.lastContext.viewPort.toScreenCoord(l.pt);
                        const dir = l.norm.rotate90CCW().normalize();


                        const a = {x: wc.x + dir.x * -5000, y: wc.y + dir.y * -5000};
                        const b = {x: wc.x + dir.x * 5000, y: wc.y + dir.y * 5000};

                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
        }
    }

    onMouseDown(event: MouseEvent, context: CanvasContext): boolean {
        if (event.button === 2) {
            this.clearSnapHovers();
        }
        return super.onMouseDown(event, context);
    }
}
