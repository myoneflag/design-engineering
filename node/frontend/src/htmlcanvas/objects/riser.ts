import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import RiserEntity from "../../../../common/src/api/document/entities/riser-entity";
import * as TM from "transformation-matrix";
import { DocumentState } from "../../../src/store/document/types";
import { lighten, rgb2style } from "../../../src/lib/utils";
import Connectable, { ConnectableObject } from "../../../src/htmlcanvas/lib/object-traits/connectable";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { CostBreakdown, DrawingContext, ValidationResult } from "../../../src/htmlcanvas/lib/types";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import BackedConnectable from "../../../src/htmlcanvas/lib/BackedConnectable";
import { getDragPriority } from "../../../src/store/document";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import { CenteredObjectNoParent } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import { CalculationContext, PressurePushMode } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { Calculated, CalculatedObject } from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import CanvasContext from "../lib/canvas-context";
import { DrawableEntityConcrete, EdgeLikeEntity } from "../../../../common/src/api/document/entities/concrete-entity";
import RiserCalculation, { emptyRiserCalculations } from "../../store/document/calculations/riser-calculation";
import Pipe from "./pipe";
import { getFluidDensityOfSystem, head2kpa } from "../../calculations/pressure-drops";
import { Coord, FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import { getEdgeLikeHeightAboveGroundM, getHighlightColor } from "../lib/utils";
import { GlobalStore } from "../lib/global-store";
import { APIResult } from "../../../../common/src/api/document/types";
import { Interaction, InteractionType } from "../lib/interaction";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { assertUnreachable, isDrainage } from "../../../../common/src/api/config";
import { I18N } from "../../../../common/src/api/locale/values";
import { addWarning, Warning } from "../../../src/store/document/calculations/warnings";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { Direction } from "../types";
import { isSameWorldPX } from "../on-screen-items";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject()
@CenteredObjectNoParent
@SnappableObject
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

    isActive(): boolean {
        const systemUid = this.entity.systemUid;
        switch (this.document.uiState.pressureOrDrainage) {
            case "pressure":
                return !isDrainage(systemUid, this.document.drawing.metadata.flowSystems);
            case "drainage":
                return isDrainage(systemUid, this.document.drawing.metadata.flowSystems);
        }
        assertUnreachable(this.document.uiState.pressureOrDrainage);
    }

    drawEntity({ ctx, doc, vp }: DrawingContext, { selected, layerActive, overrideColorList }: EntityDrawingArgs): void {
        this.lastDrawnWorldRadius = 0;

        const scale = vp.currToSurfaceScale(ctx);
        // Minimum screen size for them.

        const rawDiameter = 100;
        const screenMin = vp.surfaceToWorldLength(10);
        this.lastDrawnDiameterW = Math.max(rawDiameter, screenMin);

        const screenSize = vp.toSurfaceLength(this.lastDrawnDiameterW / 2);

        ctx.lineWidth = 0;

        if (selected || overrideColorList.length) {
            // we want to draw a pixel sized dark halo around a selected component
            const haloSize = (Math.max(this.MINIMUM_RADIUS_PX, screenSize) + 5) / scale;

            ctx.fillStyle = rgb2style(getHighlightColor(
                selected,
                overrideColorList,
                { hex: lighten(this.color(doc).hex, 50) },
            ), 0.5);

            if (!this.isActive()) {
                ctx.fillStyle = 'rgba(150, 150, 150, 0.65)';
            }

            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.globalAlpha = 1;
            ctx.arc(0, 0, haloSize, 0, Math.PI * 2);
            ctx.fill();

            this.lastDrawnWorldRadius = Math.max(this.lastDrawnWorldRadius, haloSize);
        }

        if (layerActive) {
            if (screenSize < this.MINIMUM_RADIUS_PX) {
                // Risers are very important and should be visible, even when zoomed out.

                ctx.fillStyle = this.color(doc).hex;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(0, 0, this.MINIMUM_RADIUS_PX / scale, 0, Math.PI * 2);
                ctx.fill();

                this.lastDrawnWorldRadius = Math.max(this.lastDrawnWorldRadius, this.MINIMUM_RADIUS_PX / scale);
            }
        }

        ctx.fillStyle = this.color(doc).hex;
        if (!this.isActive()) {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.65)';
        }

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

        if (isDrainage(this.entity.systemUid, doc.drawing.metadata.flowSystems) && !this.entity.isVent) {
            // stack. Draw upside down traingle.
            ctx.moveTo(0, this.lastDrawnDiameterW * 0.45);
            ctx.lineTo(this.lastDrawnDiameterW * 0.38, -this.lastDrawnDiameterW * 0.25);
            ctx.lineTo(0, -this.lastDrawnDiameterW * 0.1);
            ctx.lineTo(-this.lastDrawnDiameterW * 0.38, -this.lastDrawnDiameterW * 0.25);
            ctx.closePath();
            ctx.fill();

            const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === this.entity.systemUid);
            if (system) {
                if (system.drainageProperties.stackDedicatedVent) {
                    // draw dedicated vent.
                    const ventColor = system.drainageProperties.ventColor.hex;

                    ctx.beginPath();
                    ctx.fillStyle = ventColor;

                    if (!this.isActive()) {
                        ctx.fillStyle = 'rgba(150, 150, 150, 0.65)';
                    }

                    const ventRadius = this.lastDrawnDiameterW / 4;
                    const ventDiameter = ventRadius * 2;
                    ctx.arc(this.lastDrawnDiameterW, 0, ventRadius, 0, Math.PI * 2);
                    ctx.fill();


                    ctx.beginPath();
                    ctx.fillStyle = '#000000';
                    ctx.moveTo(this.lastDrawnDiameterW, -ventDiameter * 0.45);
                    ctx.lineTo(this.lastDrawnDiameterW + ventDiameter * 0.38, ventDiameter * 0.25);
                    ctx.lineTo(this.lastDrawnDiameterW, ventDiameter * 0.1);
                    ctx.lineTo(this.lastDrawnDiameterW - ventDiameter * 0.38, ventDiameter * 0.25);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        } else {

            // riser. Draw normal triangle.
            ctx.moveTo(0, -this.lastDrawnDiameterW * 0.45);
            ctx.lineTo(this.lastDrawnDiameterW * 0.38, this.lastDrawnDiameterW * 0.25);
            ctx.lineTo(0, this.lastDrawnDiameterW * 0.1);
            ctx.lineTo(-this.lastDrawnDiameterW * 0.38, this.lastDrawnDiameterW * 0.25);
            ctx.closePath();
            ctx.fill();
        }

        // Display Entity Name
        if (this.entity.entityName) {
            const name = this.entity.entityName;
            ctx.font = 70 + "pt " + DEFAULT_FONT_NAME;
            ctx.textBaseline = "top";
            const nameWidth = ctx.measureText(name).width;
            const offsetx = - nameWidth / 2;
            ctx.fillStyle = "#00ff1421";
            // the 70 represents the height of the font
            const textHight = 70;
            const offsetY = this.lastDrawnDiameterW / 2 + textHight;
            ctx.fillRect(offsetx, offsetY, nameWidth, 70);
            ctx.fillStyle = this.color(doc).hex;
            ctx.fillText(name, offsetx, offsetY - 4);
            ctx.textBaseline = "alphabetic";
        }
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
        if (this.entity.isVent) {
            return this.system(doc).drainageProperties.ventColor;
        }
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
        if (!this.isActive()) {
            return false;
        }
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
        return [...conns.map((uid) => context.globalStore.get(uid)!), this];
    }

    rememberToRegister(): void {
        //
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        if (interaction.type === InteractionType.MOVE_ONTO_RECEIVE) {
            return null;
        } else if (interaction.type === InteractionType.MOVE_ONTO_SEND) {
            return null;
        }
        return super.offerInteraction(interaction);
    }

    validate(context: CanvasContext, tryToFix: boolean): ValidationResult {
        const pres = super.validate(context, tryToFix);
        if (pres && !pres.success) {
            return pres;
        }

        // check the sanity of heights
        // let's exclude vent as it should not display on the level below lowest connected pipe's level
        if (this.entity.bottomHeightM !== null && !this.entity.isVent) {
            if (this.entity.bottomHeightM > this.minPipeHeight(context)) {
                if (tryToFix) {
                    this.entity.bottomHeightM = this.minPipeHeight(context);
                } else {
                    return {
                        success: false,
                        message:
                            "Riser bottom can't be higher than our lowest pipe (" +
                            this.entity.uid +
                            ", " +
                            this.entity.bottomHeightM +
                            " " +
                            this.entity.topHeightM +
                            ", " +
                            this.minPipeHeight(context) +
                            ")",
                        modified: false,
                    };
                }
            }
        }
        if (this.entity.topHeightM !== null) {
            if (this.entity.topHeightM < this.maxPipeHeight(context)) {
                if (tryToFix) {
                    this.entity.topHeightM = this.maxPipeHeight(context);
                } else {
                    let messageBase = "Riser top can't be lower than our highest pipe. (";
                    if (this.entity.isVent) {
                        messageBase = "Vent top height must be higher than the highest pipe length. (";
                    }
                    return {
                        success: false,
                        message:
                            messageBase +
                            this.entity.uid +
                            ", " +
                            this.entity.topHeightM +
                            " " +
                            this.entity.topHeightM +
                            ", " +
                            this.maxPipeHeight(context) +
                            ")",
                        modified: false,
                    };
                }
            }
        }
        return {
            success: true,
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
        return Math.min(
            ...conns.map((uid) =>
                getEdgeLikeHeightAboveGroundM(gs.get(uid)!.entity as EdgeLikeEntity, {
                    doc: context.document,
                    priceTable: context.effectivePriceTable,
                    catalog: context.effectiveCatalog,
                    globalStore: context.globalStore,
                    drawing: context.document.drawing,
                    nodes: context.$store.getters["customEntity/nodes"],
                })
            )
        );
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
        return Math.max(
            ...conns.map((uid) =>
                getEdgeLikeHeightAboveGroundM(gs.get(uid)!.entity as EdgeLikeEntity, {
                    doc: context.document,
                    priceTable: context.effectivePriceTable,
                    catalog: context.effectiveCatalog,
                    globalStore: context.globalStore,
                    drawing: context.document.drawing,
                    nodes: context.$store.getters["customEntity/nodes"],
                })
            )
        );
    }

    getCalculationEntities(context: CalculationContext): DrawableEntityConcrete[] {
        const tower = this.getCalculationTower(context);
        // Insert a flow source into the group somewhere to simulate the riser.

        return [...tower.flat()];
    }

    collectCalculations(context: CalculationContext): RiserCalculation {
        const res = emptyRiserCalculations();
        const IAmDrainage = isDrainage(this.entity.systemUid, context.drawing.metadata.flowSystems);

        const tower = this.getCalculationTower(context, true);

        const levels = context.doc.drawing.levels;
        const levelUidsByHeight = Object.keys(context.doc.drawing.levels).sort((a, b) => {
            return context.doc.drawing.levels[a].floorHeightM - context.doc.drawing.levels[b].floorHeightM;
        });

        // Find size of base vent for dedicated vent sizing
        let biggestDedicatedVentSize: number | null = null;
        if (IAmDrainage) {
            for (const segment of tower) {
                const pipe = segment[1];
                if (pipe) {
                    const pcalc = context.globalStore.getOrCreateCalculation(pipe);
                    if (pcalc.stackDedicatedVentSize !== null &&
                        (biggestDedicatedVentSize === null || pcalc.stackDedicatedVentSize > biggestDedicatedVentSize)) {
                        biggestDedicatedVentSize = pcalc.stackDedicatedVentSize;
                    }
                }
            }
        }

        // Collect all levels together
        let topOfPipe = 0;
        for (const lvlUid of levelUidsByHeight) {
            res.heights[lvlUid] = {
                flowRateLS: null,
                heightAboveGround: null,
                psdUnits: null,
                pressureKPA: null,
                staticPressureKPA: null,
                sizeMM: null,
                ventSizeMM: null,
                velocityRealMS: null,
            };

            // iterate pipe if need be. Note, we don't want to go over.
            while (
                topOfPipe + 1 < tower.length &&
                tower[topOfPipe][0].calculationHeightM! <= levels[lvlUid].floorHeightM
            ) {
                topOfPipe++;
            }

            if (topOfPipe > 0 && tower[topOfPipe][0].calculationHeightM! >= levels[lvlUid].floorHeightM) {
                const calc = context.globalStore.getOrCreateCalculation(tower[topOfPipe][1]!);
                const pipe = context.globalStore.get(tower[topOfPipe][1]!.uid) as Pipe;

                const totalHL = pipe.getFrictionHeadLoss(
                    context,
                    calc.totalPeakFlowRateLS!,
                    { connectable: tower[topOfPipe - 1][0].uid, connection: pipe.uid },
                    { connectable: tower[topOfPipe][0].uid, connection: pipe.uid },
                    true,
                    null,
                    PressurePushMode.PSD,
                );

                if (totalHL != null && !IAmDrainage) {
                    const totalLength =
                        tower[topOfPipe][0].calculationHeightM! - tower[topOfPipe - 1][0].calculationHeightM!;
                    const partialLength = levels[lvlUid].floorHeightM - tower[topOfPipe - 1][0].calculationHeightM!;
                    const partialHL = totalHL * (partialLength / totalLength);

                    const bottomPipeCalc = context.globalStore.getOrCreateCalculation(tower[topOfPipe - 1][0]);
                    const bottomPressure = bottomPipeCalc.pressureKPA;
                    const bottomStaticPressure = bottomPipeCalc.staticPressureKPA;

                    const risenSegmentPressureLossKPA = head2kpa(
                        partialHL,
                        getFluidDensityOfSystem(pipe.entity.systemUid, context.doc, context.catalog)!,
                        context.doc.drawing.metadata.calculationParams.gravitationalAcceleration
                    );

                    res.heights[lvlUid] = {
                        flowRateLS: calc.totalPeakFlowRateLS,
                        heightAboveGround: levels[lvlUid].floorHeightM,
                        psdUnits: calc.psdUnits,
                        pressureKPA: bottomPressure ? bottomPressure : 0 - risenSegmentPressureLossKPA,
                        staticPressureKPA: bottomStaticPressure ? bottomStaticPressure : 0 - risenSegmentPressureLossKPA,
                        sizeMM: calc.realNominalPipeDiameterMM,
                        ventSizeMM: null,
                        velocityRealMS: calc.velocityRealMS,
                    };
                } else if (IAmDrainage) {
                    res.heights[lvlUid] = {
                        flowRateLS: null,
                        heightAboveGround: levels[lvlUid].floorHeightM,
                        psdUnits: calc.psdUnits,
                        pressureKPA: null,
                        staticPressureKPA: null,
                        sizeMM: calc.realNominalPipeDiameterMM,
                        ventSizeMM: biggestDedicatedVentSize,
                        velocityRealMS: calc.velocityRealMS,
                    };
                }
            }
        }

        if (IAmDrainage) {
            const system = context.doc.drawing.metadata.flowSystems.find((f) => f.uid === this.entity.systemUid);
            if (system) {
                const overFlowedLevels: string[] = [];
                // Do warnings of max thing per level

                for (let i = 0; i < levelUidsByHeight.length - 1; i++) {
                    const thisLvlUid = levelUidsByHeight[i];
                    const nextLvlUid = levelUidsByHeight[i + 1];
                    const levelRes = res.heights[thisLvlUid];
                    const nextLevelRes = res.heights[nextLvlUid];

                    if (!levelRes || !nextLevelRes) {
                        continue;
                    }


                    let drainageUnitsLimit = (1e10);
                    for (const sizing of system.drainageProperties.stackPipeSizing) {
                        if (sizing.sizeMM === levelRes.sizeMM) {
                            drainageUnitsLimit = sizing.maximumUnitsPerLevel;
                        }
                    }

                    const drainageUnits = (levelRes.psdUnits?.drainageUnits || 0) -
                        (nextLevelRes.psdUnits?.drainageUnits || 0);

                    if (drainageUnits > drainageUnitsLimit) {
                        overFlowedLevels.push(context.doc.drawing.levels[thisLvlUid].name);
                    }
                }

                if (overFlowedLevels.length > 0) {
                    addWarning(this.entity.uid, res, Warning.MAX_PER_LEVEL_EXCEEDED, 'drainage', { value: I18N.loadingUnits[context.doc.locale], level: overFlowedLevels.join(", ") });
                }
            }
        }

        // TODO:
        return res;
    }

    // Here, risers are turned into normal pipes for calculations, and so this function shouldn't be called.
    costBreakdown(context: CalculationContext): CostBreakdown | null {
        // TODO: Riser cost for a level.
        return { cost: 0, breakdown: [] };
    }

    dragByBackConnectableEntity(context: CanvasContext, pipeUid: string, point: Coord, originCenter: Coord, direction?: Direction, skip?: boolean) {
        if (skip) {
            return;
        }
        if ((!direction || direction == Direction.Horizontal) && isSameWorldPX(this.entity.center.x, originCenter.x)) {
            this.debase(context);
            this.entity.center.x += point.x - originCenter.x;
            this.rebase(context);
        } else if ((!direction || direction == Direction.Vertical) && isSameWorldPX(this.entity.center.y, originCenter.y)) {
            this.debase(context);
            this.entity.center.y += point.y - originCenter.y;
            this.rebase(context);
        }
    }
}
