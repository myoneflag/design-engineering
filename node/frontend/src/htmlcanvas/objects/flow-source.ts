import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import RiserEntity from "../../../../common/src/api/document/entities/riser-entity";
import * as TM from "transformation-matrix";
import { DocumentState } from "../../../src/store/document/types";
import { matrixScale } from "../../../src/htmlcanvas/utils";
import { color2rgb, lighten, rgb2style } from "../../../src/lib/utils";
import Connectable, { ConnectableObject } from "../../../src/htmlcanvas/lib/object-traits/connectable";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import {CostBreakdown, DrawingContext} from "../../../src/htmlcanvas/lib/types";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import BackedConnectable from "../../../src/htmlcanvas/lib/BackedConnectable";
import { getDragPriority } from "../../../src/store/document";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import { CenteredObject, CenteredObjectNoParent } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode, FLOW_SOURCE_EDGE } from "../../../src/calculations/calculation-engine";
import { DrawingArgs, EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { Calculated, CalculatedObject } from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import CanvasContext from "../lib/canvas-context";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete
} from "../../../../common/src/api/document/entities/concrete-entity";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import FlowSourceEntity from "../../../../common/src/api/document/entities/flow-source-entity";
import FlowSourceCalculation from "../../store/document/calculations/flow-source-calculation";
import { Coord, FlowSystemParameters, NetworkType } from "../../../../common/src/api/document/drawing";
import { cloneSimple, EPS } from "../../../../common/src/lib/utils";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import useColors = Mocha.reporters.Base.useColors;
import { getHighlightColor } from "../lib/utils";
import {assertUnreachable, isDrainage} from "../../../../common/src/api/config";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject()
@CenteredObject
@SnappableObject
export default class FlowSource extends BackedConnectable<FlowSourceEntity> implements Connectable, Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.FLOW_SOURCE, FlowSource);
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

    pressureDrainageActive(): boolean {
        const systemUid = this.entity.systemUid;
        switch (this.document.uiState.pressureOrDrainage) {
            case "pressure":
                return !isDrainage(systemUid);
            case "drainage":
                return isDrainage(systemUid);
        }
        assertUnreachable(this.document.uiState.pressureOrDrainage);
    }

    drawEntity({ ctx, doc, vp }: DrawingContext, { layerActive, selected, overrideColorList }: EntityDrawingArgs): void {
        this.lastDrawnWorldRadius = 0;

        const scale = vp.currToSurfaceScale(ctx);
        // Minimum screen size for them.

        const rawDiameter = 300;
        const screenMin = vp.surfaceToWorldLength(10);
        this.lastDrawnDiameterW = Math.max(rawDiameter, screenMin);

        const screenSize = vp.toSurfaceLength(this.lastDrawnDiameterW / 2);

        ctx.lineWidth = 0;

        if (selected || overrideColorList.length) {
            // we want to draw a pixel sized dark halo around a selected component
            const haloSize = (Math.max(this.MINIMUM_RADIUS_PX, screenSize) + 5) / scale;

            ctx.fillStyle = rgb2style(getHighlightColor(selected, overrideColorList, this.color(doc)), 0.5);
            if (!this.pressureDrainageActive()) {
                ctx.fillStyle = '#777777';
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

        // draw white yin
        ctx.beginPath();
        ctx.fillStyle = "#FFFFFF";

        ctx.moveTo(0, -this.lastDrawnDiameterW * 0.45);
        ctx.arc(0, 0, this.lastDrawnDiameterW * 0.45, -Math.PI / 2, Math.PI / 2, true);

        ctx.arc(
            -this.lastDrawnDiameterW * Math.sin(Math.PI / 3) * 0.45,
            +this.lastDrawnDiameterW * Math.cos(Math.PI / 3) * 0.45,
            this.lastDrawnDiameterW * 0.45,
            (Math.PI * 2) / 3 - Math.PI / 2,
            Math.PI / 3 - Math.PI / 2,
            true
        );

        ctx.arc(
            +this.lastDrawnDiameterW * Math.sin(Math.PI / 3) * 0.45,
            -this.lastDrawnDiameterW * Math.cos(Math.PI / 3) * 0.45,
            this.lastDrawnDiameterW * 0.45,
            Math.PI / 3 + Math.PI - Math.PI / 2,
            (Math.PI * 2) / 3 + Math.PI - Math.PI / 2,
            false
        );
        ctx.closePath();
        ctx.fill();
    }

    isActive(): boolean {
        const systemUid = this.entity.systemUid;
        switch (this.document.uiState.pressureOrDrainage) {
            case "pressure":
                return !isDrainage(systemUid);
            case "drainage":
                return isDrainage(systemUid);
        }
        assertUnreachable(this.document.uiState.pressureOrDrainage);
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
        if (!this.isActive()) {
            return {hex: '#777777'};
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
        if (!this.pressureDrainageActive()) {
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
        let sign = 1;
        if (flowLS < 0) {
            const oldFrom = from;
            to = oldFrom;
            flowLS = -flowLS;
            if (signed) {
                sign = -1;
            }
        }

        // Avoid backflow
        if (to.connection === FLOW_SOURCE_EDGE) {
            return sign * (1e10 + flowLS);
        } else {
            return 0;
        }
    }

    prepareDelete(): BaseBackedObject[] {
        return [];
    }

    rememberToRegister(): void {
        //
    }

    getCalculationEntities(context: CalculationContext): DrawableEntityConcrete[] {
        const tower: Array<
            [ConnectableEntityConcrete, PipeEntity] | [ConnectableEntityConcrete]
        > = this.getCalculationTower(context);

        const se = cloneSimple(this.entity);
        se.uid += ".calculation";

        if (isDrainage(this.entity.systemUid)) {
            // Drainage pipe has no height.
            se.heightAboveGroundM = tower[0]?.[0]?.calculationHeightM! || 0;
        }

        se.calculationHeightM = se.heightAboveGroundM;

        if (tower.length === 0) {
            return [se];
        }

        // Insert a flow source into the group somewhere to simulate the riser.

        if (se.heightAboveGroundM! < tower[0][0].calculationHeightM!) {
            // Just plop it at the bottom.
            const pe: PipeEntity = {
                color: null,
                diameterMM: null,
                endpointUid: [se.uid, tower[0][0].uid],
                heightAboveFloorM: 0,
                lengthM: null,
                material: null,
                maximumVelocityMS: null,
                parentUid: null,
                network: NetworkType.RISERS,
                systemUid: this.entity.systemUid,
                type: EntityType.PIPE,
                uid: this.uid + ".-1.p"
            };
            console.log([se, pe, ...tower.flat()]);
            return [se, pe, ...tower.flat()];
        }

        if (se.heightAboveGroundM! > tower[tower.length - 1][0].calculationHeightM!) {
            // Just plop it at the top.
            const pe: PipeEntity = {
                color: null,
                diameterMM: null,
                endpointUid: [se.uid, tower[tower.length - 1][0].uid],
                heightAboveFloorM: 0,
                lengthM: null,
                material: null,
                maximumVelocityMS: null,
                parentUid: null,
                network: NetworkType.RISERS,
                systemUid: this.entity.systemUid,
                type: EntityType.PIPE,
                uid: this.uid + "." + tower.length + ".p"
            };
            return [se, pe, ...tower.flat()];
        }

        for (let i = 0; i < tower.length; i++) {
            if (Math.abs(se.heightAboveGroundM! - tower[i][0].calculationHeightM!) < EPS) {
                // replace that part of the tower
                se.uid = tower[i][0].uid;
                tower[i][0] = se;
                return tower.flat();
            }

            if (se.heightAboveGroundM! < tower[i][0].calculationHeightM!) {
                const p1: PipeEntity = {
                    color: null,
                    diameterMM: null,
                    endpointUid: [se.uid, tower[i][0].uid],
                    heightAboveFloorM: 0,
                    lengthM: null,
                    material: null,
                    maximumVelocityMS: null,
                    parentUid: null,
                    network: NetworkType.RISERS,
                    systemUid: this.entity.systemUid,
                    type: EntityType.PIPE,
                    uid: this.uid + "." + tower.length + ".p"
                };

                const p2: PipeEntity = {
                    color: null,
                    diameterMM: null,
                    endpointUid: [se.uid, tower[i - 1][0].uid],
                    heightAboveFloorM: 0,
                    lengthM: null,
                    material: null,
                    maximumVelocityMS: null,
                    parentUid: null,
                    network: NetworkType.RISERS,
                    systemUid: this.entity.systemUid,
                    type: EntityType.PIPE,
                    uid: this.uid + "." + tower.length + ".p"
                };

                tower[i][1] = p1;

                return [p2, se, ...tower.flat()];
            }
        }

        throw new Error("Numerically, we shouldn't be here");
    }

    collectCalculations(context: CalculationContext): FlowSourceCalculation {
        let calc: FlowSourceCalculation | undefined;
        let calcEntity: FlowSourceEntity | undefined;

        const entities = this.getCalculationEntities(context);
        for (const e of entities) {
            if (e.type === EntityType.FLOW_SOURCE) {
                calc = context.globalStore.getOrCreateCalculation(e);
                calcEntity = e;
            }
        }

        if (calc === undefined) {
            throw new Error("Flow Source Calculations not found");
        }

        // explicitly create this to help with refactors
        const res: FlowSourceCalculation = {
            costBreakdown: null,
            cost: null,
            expandedEntities: null,

            flowRateLS: calc.flowRateLS,
            pressureKPA: calc.pressureKPA, // TODO: differentiate this in different levels
            warning: calc.warning,
            warningLayout: calc.warningLayout,
            staticPressureKPA: calc.staticPressureKPA,
        };

        const tower = this.getCalculationTower(context);

        tower.forEach(([v, p]) => {
            res.warning = res.warning || context.globalStore.getOrCreateCalculation(v).warning;
        });

        return res;
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        return {cost: 0, breakdown: []};
    }
}
