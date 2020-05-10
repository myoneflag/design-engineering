import CanvasContext from "../lib/canvas-context";
import BaseBackedObject from "../lib/base-backed-object";
import Flatten from '@flatten-js/core';
import { Coord } from "../../../../common/src/api/document/drawing";
import Pipe from "../objects/pipe";
import { CONNECTABLE_SNAP_RADIUS_PX } from "./snapping-insert-tool";
import { EPS } from "../../../../common/src/lib/utils";

export enum TraceType {
    None,
    Snap,
    Force,
}

export interface SnapResult {
    wc: Coord | null;
    references: Array<Flatten.Line | Flatten.Point> | null;
    candidates: Array<Flatten.Point | Flatten.Line>;
}

export interface SnapSurface {
    surface: Flatten.Line;
    trace: TraceType;
    references: Array<Flatten.Line | Flatten.Point>;
}

export interface SnapSurfaceResult {
    surfaces: SnapSurface[];
    obviousPoints: Flatten.Point[];
}

// Gets the points and basis vectors to snap onto.
export function getSnapSurfaces(context: CanvasContext, snapTargets: string[], pipeSnapTargets: string[], originUid?: string): SnapSurfaceResult {
    const result: SnapSurface[] = [];
    const obviousPoints: Flatten.Point[] = [];

    const pipeVectors: Array<{vector: Flatten.Vector, references: Array<Flatten.Line | Flatten.Point>}> = [];

    for (const puid of pipeSnapTargets) {
        const o = context.globalStore.get(puid);
        if (!(o instanceof Pipe)) {
            continue;
        }

        const wcs = o.worldEndpoints();
        const pv = Flatten.vector(wcs[1].x - wcs[0].x, wcs[1].y - wcs[0].y);
        const pl = Flatten.line(Flatten.point(wcs[0].x, wcs[0].y), pv.rotate90CCW());
        pipeVectors.push({
            vector: pv,
            references: [pl],
        });
        result.push({
            trace: TraceType.Snap,
            surface: pl,
            references: [pl],
        });
    }

    const effectiveSnapTargets = Array.from(snapTargets);
    if (originUid) {
        effectiveSnapTargets.push(originUid);
    }

    for (const suid of effectiveSnapTargets) {
        const o = context.globalStore.get(suid);
        if (!o) {
            continue;
        }

        const wc = o.toWorldCoord();
        const point = Flatten.point(wc.x, wc.y);
        obviousPoints.push(point);

        let trace = TraceType.None;

        if (originUid === o.uid) {
            trace = TraceType.Force;
        } else if (!originUid) {
            trace = TraceType.Snap;
        }

        let hasNeighbours = false;
        // Pipes immediately connecting it
        const conns = context.globalStore.getConnections(suid);
        for (const puid of conns) {
            const po = context.globalStore.get(puid) as Pipe;
            if (po) {
                const wcs = po.worldEndpoints();
                const pv = Flatten.vector(wcs[1].x - wcs[0].x, wcs[1].y - wcs[0].y);
                const pl = Flatten.line(Flatten.point(wcs[0].x, wcs[0].y), pv.rotate90CCW());
                result.push({
                    surface: Flatten.line(point, pv.rotate90CCW()),
                    trace,
                    references: [pl],
                });
                result.push({
                    surface: Flatten.line(point, pv),
                    trace,
                    references: [pl],
                });

                if (suid === originUid) {
                    result.push({
                        surface: Flatten.line(point, pv.rotate(Math.PI / 4)),
                        trace: TraceType.Snap,
                        references: [pl],
                    });
                    result.push({
                        surface: Flatten.line(point, pv.rotate(Math.PI * 3 / 4)),
                        trace: TraceType.Snap,
                        references: [pl],
                    });
                }
            }
            hasNeighbours = true;
        }

        // coordinate axis
        result.push({
            surface: Flatten.line(point, Flatten.vector(0, 1)),
            trace,
            references: [],
        });
        result.push({
            surface: Flatten.line(point, Flatten.vector(1, 0)),
            trace,
            references: [],
        });

        // Pipes have the option to go 45 degrees
        if (suid === originUid) {
            if (!hasNeighbours) {
                result.push({
                    surface: Flatten.line(point, Flatten.vector(1, 1)),
                    trace: TraceType.Snap,
                    references: [],
                });

                result.push({
                    surface: Flatten.line(point, Flatten.vector(-1, 1)),
                    trace: TraceType.Snap,
                    references: [],
                });
            }
        }

        // Parallel to existing pipes
        for (const pv of pipeVectors) {
            result.push({
                surface: Flatten.line(point, pv.vector.rotate90CCW()),
                trace,
                references: [...pv.references],
            });
        }
    }

    return {surfaces: result, obviousPoints};
}

export function resultWithoutObviousReferences(obviousPoints: Flatten.Point[], result: SnapResult) {
    if (!result.wc) {
        return result;
    }
    const thisPoint = Flatten.point(result.wc.x, result.wc.y);

    let isObvious = false;
    for (const p of obviousPoints) {
        if (thisPoint.distanceTo(p)[0] < EPS) {
            isObvious = true;
        }
    }

    if (isObvious) {
        result.references = [];
    }
    return result;
}

export function snapPoint(context: CanvasContext, snapTargets: string[], pipeSnapTargets: string[], pointWc: Coord, originUid?: string): SnapResult {
    // Sometimes, the chain UID disappears when pipes are initially drawn and their first fitting is deleted by a simultaneous
    // editor.
    // The cheapest way to fix it is to ignore the error here (originUid will not be a correct object) and put it back
    // later in the move handler.
    if (originUid && !context.globalStore.has(originUid)) {
        originUid = undefined;
    }

    const {surfaces, obviousPoints} = getSnapSurfaces(context, snapTargets, pipeSnapTargets, originUid);



    const point = Flatten.point(pointWc.x, pointWc.y);

    // if the current point is obvious, don't waste time drawing lines

    // snap to any of the intersections
    let closestDist: number | null = null;
    const candidates: Array<Flatten.Point | Flatten.Line> = [];
    let closestResult: SnapResult = {
        wc: null,
        references: null,
        candidates,
    };

    for (const a of surfaces) {
        for (const b of surfaces) {
            const it = a.surface.intersect(b.surface);
            if (it.length === 1) {
                candidates.push(it[0]);
                const p = it[0];
                const d = it[0].distanceTo(point);
                if (closestDist === null || d[0] < closestDist) {
                    closestDist = d[0];
                    closestResult = {
                        wc: {x: p.x, y: p.y},
                        references: [a.surface, b.surface, ...a.references, ...b.references],
                        candidates,
                    };
                }
            }
        }
    }

    if (originUid) {
        const owc = context.globalStore.get(originUid)!.toWorldCoord();

        for (const l of surfaces) {
            const projection = l.surface.distanceTo(Flatten.point(owc.x, owc.y))[1].start;


            const it = projection.distanceTo(point);
            if (closestDist === null || it[0] < closestDist) {
                closestDist = it[0];
                candidates.push(it[1].start);
                closestResult = {
                    wc: {x: projection.x, y: projection.y},
                    references: [l.surface, ...l.references],
                    candidates,
                };
            }
        }
    }

    if (closestDist !== null && context.viewPort.toScreenLength(closestDist) < CONNECTABLE_SNAP_RADIUS_PX) {
        return resultWithoutObviousReferences(obviousPoints, closestResult);
    }

    // no point? Then snap to nearest line
    closestDist = null;
    closestResult = {
        wc: null,
        references: null,
        candidates,
    };

    for (const l of surfaces) {
        if (l.trace === TraceType.Snap) {
            const it = l.surface.distanceTo(point);
            if (closestDist === null || it[0] < closestDist) {
                closestDist = it[0];
                candidates.push(it[1].start);
                closestResult = {
                    wc: {x: it[1].start.x, y: it[1].start.y},
                    references: [l.surface, ...l.references],
                    candidates,
                };
            }
        }
    }

    if (closestDist !== null && context.viewPort.toScreenLength(closestDist) < CONNECTABLE_SNAP_RADIUS_PX) {
        return resultWithoutObviousReferences(obviousPoints, closestResult);
    }

    // finally, any forced traces
    closestDist = null;
    closestResult = {
        wc: null,
        references: null,
        candidates,
    };

    for (const l of surfaces) {
        if (l.trace === TraceType.Force) {
            const it = l.surface.distanceTo(point);
            if (closestDist === null || it[0] < closestDist) {
                closestDist = it[0];
                candidates.push(it[1].start);
                closestResult = {
                    wc: {x: it[1].start.x, y: it[1].start.y},
                    references: [l.surface, ...l.references],
                    candidates,
                };
            }
        }
    }

    return resultWithoutObviousReferences(obviousPoints, closestResult);
}
