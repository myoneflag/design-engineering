import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import RiserEntity from "../../../../common/src/api/document/entities/riser-entity";
import * as TM from "transformation-matrix";
import { DocumentState } from "../../../src/store/document/types";
import { matrixScale } from "../../../src/htmlcanvas/utils";
import { lighten } from "../../../src/lib/utils";
import Connectable, { ConnectableObject } from "../../../src/htmlcanvas/lib/object-traits/connectable";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import BackedConnectable from "../../../src/htmlcanvas/lib/BackedConnectable";
import { getDragPriority } from "../../../src/store/document";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import { CenteredObjectNoParent } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { DrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { Calculated, CalculatedObject } from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import CanvasContext from "../lib/canvas-context";
import { DrawableEntityConcrete, EdgeLikeEntity } from "../../../../common/src/api/document/entities/concrete-entity";
import RiserCalculation from "../../store/document/calculations/riser-calculation";
import Pipe from "./pipe";
import { getFluidDensityOfSystem, head2kpa } from "../../calculations/pressure-drops";
import { Coord, FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import { getEdgeLikeHeightAboveGroundM } from "../lib/utils";
import { GlobalStore } from "../lib/global-store";
import { APIResult } from "../../../../common/src/api/document/types";
import { Interaction, InteractionType } from "../lib/interaction";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject
@CenteredObjectNoParent
export default class Riser extends BackedConnectable<RiserEntity> implements Connectable, Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.RISER, Riser);
    }

    minimumConnections = 0;
    maximumConnections = null;

    dragPriority = getDragPriority(EntityType.RISER);

    MINIMUM_RADIUS_PX: number = 3;
    lastDrawnWorldRadius: number = 0; // for bounds detection
    lastDrawnDiameterW: number = 100;

    get position(): TM.Matrix {
        const scale = 1 / this.fromParentToWorldLength(1);
        return TM.transform(TM.translate(this.entity.center.x, this.entity.center.y), TM.scale(scale, scale));
    }

    drawInternal({ ctx, doc, vp }: DrawingContext, { active, selected }: DrawingArgs): void {
        this.lastDrawnWorldRadius = 0;

        const mat = ctx.getTransform();
        const scale = matrixScale(mat);
        // Minimum screen size for them.

        const rawDiameter = 100;
        const screenMin = vp.toWorldLength(10);
        this.lastDrawnDiameterW = Math.max(rawDiameter, screenMin);

        const screenSize = vp.toScreenLength(this.lastDrawnDiameterW / 2);

        ctx.lineWidth = 0;

        if (selected) {
            // we want to draw a pixel sized dark halo around a selected component
            const haloSize = (Math.max(this.MINIMUM_RADIUS_PX, screenSize) + 5) / scale;

            ctx.fillStyle = lighten(this.color(doc).hex, -90, 1);

            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.globalAlpha = 1;
            ctx.arc(0, 0, haloSize, 0, Math.PI * 2);
            ctx.fill();

            this.lastDrawnWorldRadius = Math.max(this.lastDrawnWorldRadius, haloSize);
        }

        if (active) {
            if (screenSize < this.MINIMUM_RADIUS_PX) {
                // Flow sources are very important and should be visible, even when zoomed out.

                ctx.fillStyle = this.color(doc).hex;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(0, 0, this.MINIMUM_RADIUS_PX / scale, 0, Math.PI * 2);
                ctx.fill();

                this.lastDrawnWorldRadius = Math.max(this.lastDrawnWorldRadius, this.MINIMUM_RADIUS_PX / scale);
            }
        }

        ctx.fillStyle = this.color(doc).hex;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.toObjectLength(this.lastDrawnDiameterW / 2), 0, Math.PI * 2);
        this.lastDrawnWorldRadius = Math.max(
            this.lastDrawnWorldRadius,
            this.toObjectLength(this.lastDrawnDiameterW / 2)
        );
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#000000";
        // draw triangle
        ctx.moveTo(0, -this.lastDrawnDiameterW * 0.45);
        ctx.lineTo(this.lastDrawnDiameterW * 0.38, this.lastDrawnDiameterW * 0.25);
        ctx.lineTo(0, this.lastDrawnDiameterW * 0.1);
        ctx.lineTo(-this.lastDrawnDiameterW * 0.38, this.lastDrawnDiameterW * 0.25);
        ctx.closePath();
        ctx.fill();
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> {
        /* */
    }

    color(doc: DocumentState) {
        return this.entity.color == null ? this.system(doc).color : this.entity.color;
    }

    system(doc: DocumentState): FlowSystemParameters {
        const result = doc.drawing.metadata.flowSystems.find((v) => v.uid === this.entity.systemUid);
        if (result) {
            return result;
        } else {
            throw new Error("Flow system not found for flow source " + JSON.stringify(this.entity));
        }
    }

    refreshObjectInternal(obj: RiserEntity): void {
        //
    }

    inBounds(objectCoord: Coord, radius?: number) {
        const dist = Math.sqrt(objectCoord.x ** 2 + objectCoord.y ** 2);
        return dist <= this.toObjectLength(this.lastDrawnDiameterW / 2) + (radius ? radius : 0);
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean
    ): number {
        throw new Error("This entity shouldn't be part of calculations");
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const conns = context.globalStore.getConnections(this.uid);
        return [
            ...conns.map((uid) => context.globalStore.get(uid)!),
            this,
        ];
    }

    rememberToRegister(): void {
        //
    }

    debase(): void {
        // nada
    }

    rebase(context: CanvasContext): void {
        // nada
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        if (interaction.type === InteractionType.MOVE_ONTO_RECEIVE) {
            return null;
        } else if (interaction.type === InteractionType.MOVE_ONTO_SEND) {
            return null;
        }
        return super.offerInteraction(interaction);
    }

    validate(context: CanvasContext, tryToFix: boolean): APIResult<void> {
        const pres = super.validate(context, tryToFix);
        if (pres && !pres.success) {
            return pres;
        }


        // check the sanity of heights
        if (this.entity.bottomHeightM !== null) {
            if (this.entity.bottomHeightM > this.minPipeHeight(context)) {
                if (tryToFix) {
                    this.entity.bottomHeightM = this.minPipeHeight(context);
                } else {

                    return {
                        success: false,
                        message: "Riser bottom can't be higher than our lowest pipe (" + this.entity.uid + ", " + this.entity.bottomHeightM + ' ' + this.entity.topHeightM + ", " + this.minPipeHeight(context) + ")",
                    };
                }
            }
        }
        if (this.entity.topHeightM !== null) {
            if (this.entity.topHeightM < this.maxPipeHeight(context)) {
                if (tryToFix) {
                    this.entity.topHeightM = this.maxPipeHeight(context);
                } else {
                    return {
                        success: false,
                        message: "Riser top can't be lower than our highest pipe. (" + this.entity.uid + ", " + this.entity.topHeightM + ' ' + this.entity.topHeightM + ", " + this.maxPipeHeight(context) + ")",
                    };
                }
            }
        }
        return {
            success: true,
            data: undefined,
        };
    }

    minPipeHeight(context: CanvasContext): number {
        if (!(this.globalStore instanceof GlobalStore)) {
            throw new Error("minPipeHeight only works in the global context");
        }
        const conns = this.globalStore.getConnections(this.uid);
        if (conns.length === 0) {
            return Infinity;
        }
        const gs = this.globalStore as GlobalStore;
        return Math.min(...conns.map((uid) =>
            getEdgeLikeHeightAboveGroundM(gs.get(uid)!.entity as EdgeLikeEntity, {
                doc: context.document,
                catalog: context.effectiveCatalog,
                globalStore: context.globalStore,
                drawing: context.document.drawing,
            })
        ));
    }

    maxPipeHeight(context: CanvasContext): number {
        if (!(this.globalStore instanceof GlobalStore)) {
            throw new Error("maxPipeHeight only works in the global context");
        }
        const conns = this.globalStore.getConnections(this.uid);
        if (conns.length === 0) {
            return -Infinity;
        }
        const gs = this.globalStore as GlobalStore;
        return Math.max(...conns.map((uid) =>
            getEdgeLikeHeightAboveGroundM(gs.get(uid)!.entity as EdgeLikeEntity, {
                doc: context.document,
                catalog: context.effectiveCatalog,
                globalStore: context.globalStore,
                drawing: context.document.drawing,
            })
        ));
    }

    getCalculationEntities(context: CalculationContext): DrawableEntityConcrete[] {
        const tower = this.getCalculationTower(context);
        // Insert a flow source into the group somewhere to simulate the riser.
        // TODO: Use a separate flow source entity in the future.

        return [...tower.flat()];
    }

    collectCalculations(context: CalculationContext): RiserCalculation {
        // explicitly create this to help with refactors
        const res: RiserCalculation = {
            heights: {},
            warning: null
        };

        const tower = this.getCalculationTower(context);

        const levels = context.doc.drawing.levels;
        const levelUidsByHeight = Object.keys(context.doc.drawing.levels).sort((a, b) => {
            return context.doc.drawing.levels[a].floorHeightM - context.doc.drawing.levels[b].floorHeightM;
        });


        let topOfPipe = 0;
        for (const lvlUid of levelUidsByHeight) {
            res.heights[lvlUid] = {
                flowRateLS: null,
                heightAboveGround: null,
                psdUnits: null,
                pressureKPA: null
            };

            // iterate pipe if need be. Note, we don't want to go over.
            while (
                topOfPipe + 1 < tower.length
                && tower[topOfPipe][0].calculationHeightM! <= levels[lvlUid].floorHeightM
                ) {
                topOfPipe++;
            }


            if (topOfPipe > 0 && tower[topOfPipe][0].calculationHeightM! >= levels[lvlUid].floorHeightM) {
                const calc = context.globalStore.getOrCreateCalculation(tower[topOfPipe][1]!);

                const pipe = context.globalStore.get(tower[topOfPipe][1]!.uid) as Pipe;

                const totalHL = pipe.getFrictionHeadLoss(
                    context,
                    calc.peakFlowRate!,
                    { connectable: tower[topOfPipe - 1][0].uid, connection: pipe.uid },
                    { connectable: tower[topOfPipe][0].uid, connection: pipe.uid },
                    true,
                    null,
                );

                if (totalHL != null) {
                    const totalLength = tower[topOfPipe][0].calculationHeightM! - tower[topOfPipe - 1][0].calculationHeightM!;
                    const partialLength = levels[lvlUid].floorHeightM - tower[topOfPipe - 1][0].calculationHeightM!;
                    const partialHL = totalHL * (partialLength / totalLength);

                    const bottomPressure =
                        context.globalStore.getOrCreateCalculation(tower[topOfPipe - 1][0]).pressureKPA;

                    if (bottomPressure) {
                        res.heights[lvlUid] = {
                            flowRateLS: calc.peakFlowRate,
                            heightAboveGround: levels[lvlUid].floorHeightM,
                            psdUnits: calc.psdUnits,
                            pressureKPA: bottomPressure - head2kpa(
                                partialHL,
                                getFluidDensityOfSystem(pipe.entity.systemUid, context.doc, context.catalog)!,
                                context.doc.drawing.metadata.calculationParams.gravitationalAcceleration
                            )
                        };
                    }
                }
            }
        }

        // TODO:
        return res;
    }
}
