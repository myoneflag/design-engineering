import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import * as TM from "transformation-matrix";
import { Matrix } from "transformation-matrix";
import { DocumentState } from "../../../src/store/document/types";
import { lowerBoundNumberTable } from "../../../src/htmlcanvas/utils";
import Flatten from "@flatten-js/core";
import Connectable, { ConnectableObject } from "../../../src/htmlcanvas/lib/object-traits/connectable";
import {
    canonizeAngleRad,
    isRightAngleRad,
    isStraightRad,
    is45AngleRad
} from "../../../src/lib/trigonometry";
import {
    getValveK,
    lighten,
    rgb2style
} from "../../../src/lib/utils";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { CostBreakdown, DrawingContext } from "../../../src/htmlcanvas/lib/types";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import BackedConnectable from "../../../src/htmlcanvas/lib/BackedConnectable";
import { getDragPriority } from "../../../src/store/document";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import { CenteredObject } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import { CalculationContext } from "../../../src/calculations/types";
import { FLOW_SOURCE_EDGE, FlowNode } from "../../../src/calculations/calculation-engine";
import { EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import { Calculated, CalculatedObject } from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import FittingCalculation, { emptyFittingCalculation } from "../../store/document/calculations/fitting-calculation";
import math3d from "math3d";
import PipeEntity, { fillPipeDefaultFields } from "../../../../common/src/api/document/entities/pipe-entity";
import { Coord } from "../../../../common/src/api/document/drawing";
import { EPS, parseCatalogNumberExact } from "../../../../common/src/lib/utils";
import { assertUnreachable, ComponentPressureLossMethod, isDrainage } from "../../../../common/src/api/config";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { getHighlightColor } from "../lib/utils";
import { PipesTable } from "../../../../common/src/api/catalog/price-table";
import { fillValveDefaultFields } from "../../store/document/entities/fillDefaultEntityFields";
import { fittingFrictionLossMH } from "../../../src/calculations/pressure-drops";
import { Direction } from "../types";
import CanvasContext from "../lib/canvas-context";
import { isSameWorldPX } from "../on-screen-items";
import { DEFAULT_FONT_NAME } from "../../../src/config";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject()
@CenteredObject
@SnappableObject
export default class Fitting extends BackedConnectable<FittingEntity> implements Connectable, Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.FITTING, Fitting);
    }

    minimumConnections = 0;
    maximumConnections = null;
    dragPriority = getDragPriority(EntityType.FITTING);

    lastDrawnWidth!: number;
    pixelRadius: number = 5;
    lastDrawnLength!: number;

    TURN_RADIUS_MM = 25;
    FITTING_DIAMETER_PIXELS = 0.75;
    lastRadials!: Array<[Coord, BaseBackedObject]>;

    get position(): Matrix {
        return TM.translate(this.entity.center.x, this.entity.center.y);
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

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.

    drawEntity(context: DrawingContext, { selected, overrideColorList, forExport }: EntityDrawingArgs): void {
        const { ctx, doc, vp } = context;
        try {
            if (forExport) {
                // Fittings are too bulky and not useful on an export (though they are useful during design)
                return;
            }

            this.withWorldScale(context, { x: 0, y: 0 }, () => {

                // asdf
                const scale = vp.currToSurfaceScale(ctx);

                if (this.globalStore.getConnections(this.entity.uid).length === 2) {
                    // TODO: draw an angled arc.
                } // else {

                ctx.lineCap = "round";

                const minJointLength = this.FITTING_DIAMETER_PIXELS / scale;

                const defaultWidth = Math.max(minJointLength, 25);
                this.lastDrawnWidth = defaultWidth;
                this.lastDrawnLength = Math.max(this.toObjectLength(minJointLength), this.toObjectLength(this.TURN_RADIUS_MM));

                this.lastRadials = this.getRadials();

                this.lastRadials.forEach(([wc, pipe]) => {
                    let targetWidth = defaultWidth;
                    if (pipe.entity.type === EntityType.PIPE) {
                        if ((pipe as Pipe).lastDrawnWidth) {
                            targetWidth = Math.max(
                                defaultWidth,
                                (pipe as Pipe).lastDrawnWidth +
                                Math.min((pipe as Pipe).lastDrawnWidth, this.FITTING_DIAMETER_PIXELS / scale / 2)
                            );
                        }
                    }
                    const oc = this.toObjectCoord(wc);
                    const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));

                    let baseColorHex = this.displayEntity(doc).color!.hex;
                    if (vec.length > EPS) {
                        const small = vec
                            .normalize()
                            .multiply(Math.max(minJointLength, this.TURN_RADIUS_MM));
                        if (selected || overrideColorList.length) {
                            ctx.beginPath();
                            ctx.lineWidth = targetWidth + this.FITTING_DIAMETER_PIXELS * 2;

                            this.lastDrawnWidth = defaultWidth + (this.FITTING_DIAMETER_PIXELS * 2) / scale;
                            ctx.strokeStyle = rgb2style(getHighlightColor(
                                selected,
                                overrideColorList,
                                { hex: lighten(baseColorHex, 50) },
                            ), 0.5);
                            ctx.moveTo(0, 0);
                            ctx.lineTo(small.x, small.y);
                            ctx.stroke();
                        }

                        ctx.strokeStyle = baseColorHex;
                        if (!this.isActive()) {
                            ctx.strokeStyle = 'rgba(150, 150, 150, 0.65)';
                        }
                        ctx.lineWidth = targetWidth;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(small.x, small.y);
                        ctx.stroke();
                    }
                });
            });
        } catch (e) {
            ctx.fillStyle = "rgba(255, 100, 100, 0.4)";
            ctx.beginPath();
            ctx.arc(0, 0, this.toObjectLength(vp.surfaceToWorldLength(10)), 0, Math.PI * 2);
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
            const offsetY = - textHight * 1.5;
            ctx.fillRect(offsetx, offsetY, nameWidth, 70);
            ctx.fillStyle = this.displayEntity(doc).color!.hex;
            ctx.fillText(name, offsetx, offsetY - 4);
            ctx.textBaseline = "alphabetic";
        }
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }

    displayEntity(context: DocumentState) {
        return fillValveDefaultFields(context.drawing, this.entity, this.globalStore);
    }

    inBounds(moc: Coord, radius: number = 0): boolean {
        if (!this.isActive()) {
            return false;
        }
        // DEV-301 https://h2xengineering.atlassian.net/browse/DEV-301
        // commented out code since the login of determining if a fitting is being clicked does not make sense
        // if (this.lastRadials && this.lastDrawnLength !== undefined && this.lastDrawnWidth !== undefined) {
        //     let selected = false;
        //     this.lastRadials.forEach(([wc]) => {
        //         const oc = this.toObjectCoord(wc);
        //         const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
        //         if (vec.length > EPS) {
        //             const small = vec.normalize().multiply(this.lastDrawnLength);
        //             if (
        //                 Flatten.segment(Flatten.point(0, 0), Flatten.point(small.x, small.y))
        //                     .distanceTo(Flatten.point(moc.x, moc.y)
        //                 )[0] <=
        //                 this.lastDrawnWidth + radius
        //             ) {
        //                 selected = true;
        //             }
        //         }
        //     });
        //     return selected;
        // } else 
        {
            const l = this.toObjectLength(this.TURN_RADIUS_MM * 1.5);
            return moc.x * moc.x + moc.y * moc.y <= (l + radius) * (l + radius);
        }
    }

    get friendlyTypeName(): string {
        const connections = this.globalStore.getConnections(this.entity.uid);
        if (connections.length === 4) {
            return "Cross fitting";
        } else if (connections.length === 3) {
            return "Tee fitting";
        } else if (connections.length === 2) {
            return "Elbow/Coupling fitting";
        } else if (connections.length === 1) {
            return "Deadleg";
        } else {
            return connections.length + "-way fitting";
        }
    }

    prepareDelete(): BaseBackedObject[] {
        return []; // this was handled by @Connectable
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean
    ): number | null {
        if (from.connection === FLOW_SOURCE_EDGE || to.connection === FLOW_SOURCE_EDGE) {
            throw new Error("I don't like it");
        }

        if (Math.abs(flowLS) < EPS) {
            return 0;
        }

        switch (context.drawing.metadata.calculationParams.componentPressureLossMethod) {
            case ComponentPressureLossMethod.INDIVIDUALLY:
                // Find pressure loss from components
                break;
            case ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE:
                return 0;
            default:
                assertUnreachable(context.drawing.metadata.calculationParams.componentPressureLossMethod);
        }

        const ga = context.drawing.metadata.calculationParams.gravitationalAcceleration;

        let sign = 1;
        if (flowLS < 0) {
            const oldFrom = from;
            from = to;
            to = oldFrom;
            flowLS = -flowLS;
            if (signed) {
                sign = -1;
            }
        }

        // determine smallest diameter pipe on currently computed to-from path
        let smallestDiameterMM: number | undefined;
        let largestDiameterMM: number | undefined;
        let smallestDiameterNominalMM: number | undefined;
        const connections = [from.connection, to.connection];
        connections.forEach((p) => {
            const pipe = this.globalStore.get(p) as Pipe;
            const thisDiameter = parseCatalogNumberExact(
                context.globalStore.getCalculation(pipe.entity)!.realInternalDiameterMM
            )!;
            const thisDiameterNominal = parseCatalogNumberExact(
                context.globalStore.getCalculation(pipe.entity)!.realNominalPipeDiameterMM
            )!;
            if (smallestDiameterMM == null || (thisDiameter != null && thisDiameter < smallestDiameterMM)) {
                smallestDiameterMM = thisDiameter;
                smallestDiameterNominalMM = thisDiameterNominal;
            }
            if (largestDiameterMM == null || (thisDiameter != null && thisDiameter > largestDiameterMM)) {
                largestDiameterMM = thisDiameter;
            }
        });

        if (smallestDiameterMM == null || largestDiameterMM == null || smallestDiameterNominalMM == null) {
            // Neighbouring pipes are unsized.
            return null;
        }

        // determine kValue
        let kValue: number | null = null;
        const fromc = this.get3DOffset(from.connection);
        const toc = this.get3DOffset(to.connection);
        const fromv = new math3d.Vector3(fromc.x, fromc.y, fromc.z);
        const tov = new math3d.Vector3(toc.x, toc.y, toc.z);

        let angle: number = 0;
        if (fromv.magnitude > EPS && tov.magnitude > EPS) {
            angle = Math.abs(canonizeAngleRad(Math.acos(fromv.normalize().dot(tov.normalize()))));
        }
        const allConnections = this.globalStore.getConnections(this.entity.uid);
        // elbows
        if (allConnections.length === 2) {
            if (isStraightRad(angle, Math.PI / 8)) {
                kValue = 0;
            } else if (is45AngleRad(angle, Math.PI / 8)) {
                kValue = getValveK("45Elbow", context.catalog, smallestDiameterNominalMM);
            } else if (isRightAngleRad(angle, Math.PI / 8)) {
                kValue = getValveK("90Elbow", context.catalog, smallestDiameterNominalMM);
            } else {
                kValue = getValveK("90Elbow", context.catalog, smallestDiameterNominalMM);
                if (kValue) {
                    kValue *= 2;
                }
            }
            // tees
        } else if (allConnections.length >= 3) {
            if (isStraightRad(angle, Math.PI / 8)) {
                kValue = getValveK("tThruFlow", context.catalog, smallestDiameterNominalMM);
            } else if (is45AngleRad(angle, Math.PI / 8)) {
                kValue = getValveK("tThruFlow", context.catalog, smallestDiameterNominalMM);
            } else if (isRightAngleRad(angle, Math.PI / 8)) {
                kValue = getValveK("tThruBranch", context.catalog, smallestDiameterNominalMM);
            } else {
                kValue = getValveK("tThruBranch", context.catalog, smallestDiameterNominalMM);
                if (kValue) {
                    kValue *= 2;
                }
            }
        } else {
            throw new Error("edge shouldn't exist");
        }

        if (kValue === null) {
            throw new Error("could not find k value of fitting");
        }

        const calc = this.globalStore.getOrCreateCalculation(this.entity);
        calc.kvValue = kValue;

        const volLM = (smallestDiameterMM ** 2 * Math.PI) / 4 / 1000;
        const velocityMS = flowLS / volLM;
        const frictionLoss = sign * fittingFrictionLossMH(velocityMS, kValue, ga);
        return frictionLoss
    }

    rememberToRegister(): void {
        //
    }

    getCalculationEntities(context: CalculationContext): Array<FittingEntity | PipeEntity> {
        return this.getCalculationTower(context).flat();
    }

    collectCalculations(context: CalculationContext): FittingCalculation {
        if (this.getCalculationTower(context).length === 0) {
            return emptyFittingCalculation();
        }

        const calc = context.globalStore.getOrCreateCalculation(this.getCalculationTower(context)[0][0]);

        const res = emptyFittingCalculation();
        res.flowRateLS = calc.flowRateLS;
        res.pressureDropKPA = calc.pressureDropKPA;
        res.pressureKPA = calc.pressureKPA;
        res.warnings = calc.warnings;
        res.pressureByEndpointKPA = {};
        res.staticPressureKPA = calc.staticPressureKPA;
        res.kvValue = calc.kvValue;

        const tower = this.getCalculationTower(context);

        // determine the ranges of pressure drops available. Take the min, and the pressure going out to each pipe.
        const calculationNeighbours = new Set(context.globalStore.getConnections(this.uid).map((uid) => context.globalStore.get(uid)!.getCalculationEntities(context)[0].uid));

        const pressures: number[] = [];
        let hasNull = false;
        for (const e of this.getCalculationEntities(context)) {
            switch (e.type) {
                case EntityType.FITTING:
                    const eCalc = context.globalStore.getOrCreateCalculation(e);
                    for (const endpoint of Object.keys(eCalc.pressureByEndpointKPA)) {
                        if (calculationNeighbours.has(endpoint)) {
                            const pv = eCalc.pressureByEndpointKPA[endpoint];
                            if (pv !== null) {
                                pressures.push(pv);
                            } else {
                                hasNull = true;
                            }
                        }
                        res.pressureByEndpointKPA[endpoint] = eCalc.pressureByEndpointKPA[endpoint];
                    }
                    break;
                case EntityType.PIPE:
                    break;
                default:
                    assertUnreachable(e);
            }
        }
        pressures.sort().reverse();

        if (this.getCalculationConnectionGroups(context).flat().length !== 2) {
            res.flowRateLS = null;
        }

        if (hasNull || pressures.length <= 1) {
            res.pressureDropKPA = null;
        } else {
            if (pressures.length > 2) {
                res.pressureDropKPA = [pressures[0] - pressures[1], pressures[0] - pressures[pressures.length - 1]];
            } else {
                res.pressureDropKPA = pressures[0] - pressures[1];
            }
        }

        tower.forEach(([v, p]) => {
            res.warnings = [
                ...res.warnings || [],
                ...context.globalStore.getOrCreateCalculation(v).warnings || []
            ];
        });

        return res;
    }

    protected refreshObjectInternal(obj: FittingEntity): void {
        //
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        const { angles } = this.getSortedAngles();
        if (angles.length === 0) {
            return null;
        }

        const materials: [keyof PipesTable, number][] = [];
        for (const puid of context.globalStore.getConnections(this.entity.uid)) {
            const pipe = context.globalStore.get(puid) as Pipe;
            if (!pipe) {
                // bleh
            } else {
                const filled = fillPipeDefaultFields(context.drawing, 0, pipe.entity);
                const manufacturer = context.drawing.metadata.catalog.pipes
                    .find((po) => po.uid === filled.material)?.manufacturer || 'generic';

                const manufacturerCatalog = context.catalog.pipes[filled.material!].manufacturer
                    .find((mo) => mo.uid === manufacturer);

                const size = context.globalStore.getOrCreateCalculation(pipe.entity).realNominalPipeDiameterMM;

                if (size) {
                    materials.push([manufacturerCatalog!.priceTableName, size]);
                }
            }
        }
        if (materials.length === 0) {
            return null;
        }

        if (angles.length === 3) {
            // can only be tee
            let mostExpensive = 0;
            let mostExpensivePath = '';
            for (const [mat, siz] of materials) {
                const thisSiz = lowerBoundNumberTable(context.priceTable.Fittings.Tee[mat], siz);
                if (thisSiz && context.priceTable.Fittings.Tee[mat][thisSiz] > mostExpensive) {
                    mostExpensive = context.priceTable.Fittings.Tee[mat][thisSiz];
                    mostExpensivePath = `Fittings.Tee.${mat}.${thisSiz}`;
                }
            }
            return {
                cost: mostExpensive,
                breakdown: [{
                    qty: 1,
                    path: mostExpensivePath,
                }],
            };
        }
        if (angles.length === 2) {
            // assume is bend :O TODO: input different size for straights
            let mostExpensive = 0;
            let mostExpensivePath = '';
            if (isRightAngleRad(angles[0], Math.PI / 3)) {
                for (const [mat, siz] of materials) {
                    const thisSiz = lowerBoundNumberTable(context.priceTable.Fittings.Elbow[mat], siz);
                    if (thisSiz) {
                        if (context.priceTable.Fittings.Elbow[mat][thisSiz] > mostExpensive) {
                            mostExpensive = context.priceTable.Fittings.Elbow[mat][thisSiz];
                            mostExpensivePath = `Fittings.Elbow.${mat}.${thisSiz}`;
                        }
                    }
                }
            } else {
                for (const [mat, siz] of materials) {
                    const thisSiz = lowerBoundNumberTable(context.priceTable.Fittings.Reducer[mat], siz);
                    if (thisSiz) {
                        if (siz in context.priceTable.Fittings.Reducer[mat]) {
                            if (context.priceTable.Fittings.Reducer[mat][thisSiz] > mostExpensive) {
                                mostExpensive = context.priceTable.Fittings.Reducer[mat][thisSiz];
                                mostExpensivePath = `Fittings.Reducer.${mat}.${thisSiz}`;
                            }
                        }
                    }
                }
            }
            return {
                cost: mostExpensive,
                breakdown: [{
                    qty: 1,
                    path: mostExpensivePath,
                }],
            };
        }

        if (angles.length === 1) {
            // deadleg cap - no worries.
            return { cost: 0, breakdown: [{ qty: 0, path: '' }] };
        }

        if (angles.length === 0) {
            // Invalid thingymabob.
            return { cost: 0, breakdown: [{ qty: 0, path: '' }] };
        }

        // otherwise no info.
        return null;
    }

    getConnetectedSidePipe(pipeUid: string): Pipe[] {
        const connectionUids = this.globalStore.getConnections(this.uid)!;
        const sidePipeUids = connectionUids.filter((uid) => uid !== pipeUid);
        return sidePipeUids.map((uid) => this.globalStore.get(uid)! as Pipe);
    }

    dragByBackConnectableEntity(context: CanvasContext, pipeUid: string, point: Coord, originCenter: Coord, direction?: Direction, skip?: boolean) {
        const sidePipes = this.getConnetectedSidePipe(pipeUid);
        if (skip) {
            sidePipes.forEach((sidePipe) => {
                sidePipe.dragConnectableEntity(context, this.uid, point, originCenter);
            });
            return;
        }
        const { ret } = this.getSortedAngles();
        if ((!direction || direction == Direction.Horizontal) && isSameWorldPX(this.entity.center.x, originCenter.x)) {
            this.debase(context);
            if (ret.length >= 3) {
                ret.forEach((r) => {
                    if (is45AngleRad(r.angle, Math.PI / 8)) {
                        const angledFitting = this.globalStore.get(r.uid)! as Fitting;
                        angledFitting.entity.center.x += point.x - originCenter.x;
                    }
                });
            }
            this.entity.center.x += point.x - originCenter.x;
            this.rebase(context);
            sidePipes.forEach((sidePipe) => {
                sidePipe.dragConnectableEntity(context, this.uid, point, originCenter, Direction.Horizontal);
            });
        } else if ((!direction || direction == Direction.Vertical) && isSameWorldPX(this.entity.center.y, originCenter.y)) {
            this.debase(context);
            if (ret.length >= 3) {
                ret.forEach((r) => {
                    if (is45AngleRad(r.angle, Math.PI / 8)) {
                        const angledFitting = this.globalStore.get(r.uid)! as Fitting;
                        angledFitting.entity.center.y += point.y - originCenter.y;
                    }
                });
            }
            this.entity.center.y += point.y - originCenter.y;
            this.rebase(context);
            sidePipes.forEach((sidePipe) => {
                sidePipe.dragConnectableEntity(context, this.uid, point, originCenter, Direction.Vertical);
            });
        }
    }
}
