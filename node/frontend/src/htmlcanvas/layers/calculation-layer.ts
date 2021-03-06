import { LayerImplementation } from "../../../src/htmlcanvas/layers/layer";
import {
    CalculationFilters,
    CalculationFilterSettings,
    DocumentState,
} from "../../../src/store/document/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import CalculationEngine from "../../../src/calculations/calculation-engine";
import { EntityType, getEntityName } from "../../../../common/src/api/document/entities/types";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import { CalculationData, CalculationFieldWithValue } from "../../../src/store/document/calculations/calculation-field";
import Flatten from "@flatten-js/core";
import { cooperativeYield } from "../../../src/htmlcanvas/utils";
import { isCalculated } from "../../../src/store/document/calculations";
import * as TM from "transformation-matrix";
import { levelIncludesRiser, tm2flatten } from "../../../src/htmlcanvas/lib/utils";
import { MIN_SCALE, WARNING_WIDTH } from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import {
    DrawableEntityConcrete,
    isConnectableEntity
} from "../../../../common/src/api/document/entities/concrete-entity";
import { assertUnreachable, isDrainage, isGas } from "../../../../common/src/api/config";
import LayoutAllocator from "../lib/layout-allocator";
import stringify from "json-stable-stringify";
import { getEffectiveFilter, getFilterSettings, setInitFilterSettings } from "../../lib/filters/results";
import { updateCalculationReport } from "../../api/reports";
import AbbreviatedCalculationReport, { PipeCalculationReportEntry } from "../../../../common/src/api/reports/calculation-report";
import { CalculationType } from "../../../src/store/document/calculations/types";
import PipeCalculation from "src/store/document/calculations/pipe-calculation";
import RiserCalculation from "src/store/document/calculations/riser-calculation";
import { Entity } from "typeorm";
import { getEntitySystem } from "../../../src/calculations/utils";
import PlantEntity from "../../../../common/src/api/document/entities/plants/plant-entity";
import { PlantType } from "../../../../common/src/api/document/entities/plants/plant-types";
import DirectedValveEntity from "../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";

const MINIMUM_SIGNIFICANT_PIPE_LENGTH_MM = 500;
export const SIGNIFICANT_FLOW_THRESHOLD = 1e-5;
export const LABEL_RESOLUTION_PX = 20;
export const MIN_LABEL_RESOLUTION_WL = 20;

export default class CalculationLayer extends LayerImplementation {
    calculator: CalculationEngine = new CalculationEngine();

    layout = new Map<string, LayoutAllocator<[string, TM.Matrix, CalculationData[], boolean]>>();

    async draw(
        context: DrawingContext,
        active: boolean,
        shouldContinueInternal: () => boolean,
        reactive: Set<string>,
        withCalculation: boolean,
        forExport: boolean,
        showExport: boolean,
    ) {
        // TODO: asyncify
        const { ctx, vp } = context;
        if (active && withCalculation) {
            setInitFilterSettings(
                this.uidsInOrder.map((uid) => context.globalStore.get(uid)!),
                context.doc.uiState.calculationFilterSettings,
                this.context,
            );

            const filterSettings = getFilterSettings(
                context.doc.uiState.calculationFilterSettings,
                context.doc,
            );
            const filters = getEffectiveFilter(
                this.uidsInOrder.map((uid) => context.globalStore.get(uid)!),
                context.doc.uiState.calculationFilters,
                filterSettings,
                context.doc,
                context.catalog,
            );

            const resolutionWL = Math.max(vp.surfaceToWorldLength(LABEL_RESOLUTION_PX), MIN_LABEL_RESOLUTION_WL);
            const rexp = Math.ceil(Math.log2(resolutionWL));
            const effRes = Math.pow(2, rexp);
            const scaleWarp = effRes / resolutionWL;

            const layout = await this.getOrCreateLayout(context, effRes, shouldContinueInternal, filters, filterSettings, forExport);
            if (!layout) {
                return;
            }

            for (const label of layout.getLabels()) {
                const loc = TM.applyToPoint(label[1], { x: 0, y: 0 });
                if (vp.someOnScreen(Flatten.point(loc.x, loc.y))) {
                    const o = context.globalStore.get(label[0])!;
                    if (
                        !(showExport && context.doc.uiState.exportSettings.isAppendix) &&
                        this.istempVisibleSystemUidsOff(context, o)
                    ) {
                        continue;
                    }
                    if (!label[3]) {
                        // actual message
                        vp.prepareContext(context.ctx, label[1]);
                        context.ctx.scale(1 / scaleWarp, 1 / scaleWarp);
                        o!.drawCalculationBox(context, label[2], undefined, undefined, forExport);
                    } else if (label[0] === context.doc.uiState.warningFilter.activeEntityUid) {
                        vp.prepareContext(context.ctx, ...o.world2object);
                        const s = context.vp.currToSurfaceScale(ctx);
                        context.ctx.scale(MIN_SCALE / s, MIN_SCALE / s);
                        o!.drawCalculationBox(context, label[2], false, false, forExport);
                    } else {
                        /* if (!forExport) {
                            // warning icon only
                            vp.prepareContext(context.ctx, ...o.world2object);
                            const s = context.vp.currToSurfaceScale(ctx);
                            context.ctx.scale(MIN_SCALE / s, MIN_SCALE / s);
                            o!.drawCalculationBox(context, [], false, true);
                        } */
                    }
                }
            }
        }
    }

    async getOrCreateLayout(
        context: DrawingContext,
        resolution: number,
        shouldContinueInternal: () => boolean,
        calculationFilters: CalculationFilters,
        calculationFilterSettings: CalculationFilterSettings,
        forExport: boolean,
    ): Promise<LayoutAllocator<[string, TM.Matrix, CalculationData[], boolean]> | undefined> {
        const lvlUid = context.doc.uiState.levelUid;
        const key = stringify(calculationFilters) + stringify(calculationFilterSettings) + ".." + lvlUid + ".." + resolution + "." + forExport;

        if (this.layout.has(key)) {
            return this.layout.get(key)!;
        }

        const res = new LayoutAllocator<[string, TM.Matrix, CalculationData[], boolean]>(resolution);

        let { vp } = context;
        // standardize the layers to factors of 2.
        const rescale = resolution / vp.surfaceToWorldLength(LABEL_RESOLUTION_PX);
        vp = vp.copy();
        vp.rescale(rescale, 0, 0);
        context = { ...context, vp };

        const shouldContinue = () => {
            if (lvlUid !== context.doc.uiState.levelUid) {
                return false;
            }
            return shouldContinueInternal();
        };

        // 1. Load all calculation data and record them
        // 2. Load all message layout options for this data. Not explcitly needed as a separate step
        // 3. Order objects by importance
        // 4. Draw messages for objects, keeping track of what was drawn and avoid overlaps by drawing
        // in a new place.

        const obj2props = new Map<string, CalculationData[]>();

        this.uidsInOrder.forEach((uid) => {
            const o = this.context.globalStore.get(uid)!;
            const eName = getEntityName(o.entity, context.doc.drawing);
            if (
                isCalculated(o.entity) &&
                eName in calculationFilters &&
                calculationFilters[eName].enabled &&
                context.globalStore.getCalculation(o.entity)
            ) {
                const fields = o.getCalculationFields(context, calculationFilters);
                // console.log(fields, eName, obj2props)
                fields.forEach((f: any) => {
                    if (!obj2props.has(f.attachUid)) {
                        obj2props.set(f.attachUid, []);
                    }
                    obj2props.get(f.attachUid)!.push(f);
                });
            }

            // Add an empty record to obj2props to notify the script further down to add the full warning box.
            // We only withhold adding records to obj2props on empty stuff because empty data generates empty
            // boxes, which sadly causes ILLEGAL_PARAMETERS in Flatten further down (a bug) :( so this is a
            // workaround but in theory is not needed.
            if (isCalculated(o.entity) && (o.hasWarning(context, forExport) && !forExport)) {
                if (!obj2props.has(o.uid)) {
                    obj2props.set(o.uid, []);
                }
            }

            // don't let labels overlap fittings.
            if (isConnectableEntity(o.entity)) {
                res.placeBlock(o.shape()!);
            }
        });

        const filterSystemSetting = calculationFilterSettings.systems.filters;
        let isShowAll = true;
        const disallowedSystems = new Set<string>();
        for (const sName in filterSystemSetting) {
            if (!filterSystemSetting[sName]?.enabled) {
                if (sName !== "all") {
                    disallowedSystems.add(sName);
                }
                isShowAll = false;
            }
        }

        const objList = Array.from(this.uidsInOrder)
            .map((uid) => this.context.globalStore.get(uid)!)
            .filter((o) => {
                const entitySystem = getEntitySystem(o.entity, this.context.globalStore);
                return (isShowAll || !entitySystem || !disallowedSystems.has(entitySystem)) && o.calculated;
            });
        objList.sort((a, b) => {
            return -(this.messagePriority(context, a) - this.messagePriority(context, b));
        });

        let nb = 0;

        await cooperativeYield(shouldContinue);
        if (lvlUid !== context.doc.uiState.levelUid) {
            return;
        }

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < objList.length; i++) {
            const o = objList[i];

            vp.prepareContext(context.ctx);
            let drawn = false;

            if (obj2props.has(o.uid)) {
                const boxes = o.measureCalculationBox(context, obj2props.get(o.uid) || [], forExport);
                nb += boxes.length;
                for (const [position, shape] of boxes) {
                    if (res.tryPlace(shape, [o.uid, position, obj2props.get(o.uid) || [], false])) {
                        drawn = true;
                        break;
                    }
                }
            }

            if (!drawn) {
                // warnings must be drawn. Just show warning symbol.
                if (o.calculated && o.hasWarning(context, forExport) && !forExport) {
                    const wc = o.toWorldCoord();
                    res.place(Flatten.circle(Flatten.point(wc.x, wc.y), vp.surfaceToWorldLength(WARNING_WIDTH)), [
                        o.uid,
                        o.position,
                        obj2props.get(o.uid) || [],
                        true
                    ]);
                } else {
                    // TODO: References will ALL have to be displayed
                    const wc = o.toWorldCoord();
                    res.place(Flatten.point(wc.x, wc.y), [
                        o.uid,
                        o.position,
                        obj2props.get(o.uid)?.filter(e => (e as CalculationFieldWithValue)?.property === 'reference') || [],
                        true
                    ]);
                }
            }
        }

        this.layout.set(key, res);
        return res;
    }

    entitySortOrder(entity: DrawableEntityConcrete): number {
        return 0;
    }

    shouldAccept(entity: DrawableEntityConcrete): boolean {
        switch (entity.type) {
            case EntityType.RISER:
                return levelIncludesRiser(
                    this.context.document.drawing.levels[this.context.document.uiState.levelUid!],
                    entity,
                    this.context.$store.getters["document/sortedLevels"]
                );
            case EntityType.FITTING:
            case EntityType.PIPE:
            case EntityType.SYSTEM_NODE:
            case EntityType.BIG_VALVE:
            case EntityType.FIXTURE:
            case EntityType.GAS_APPLIANCE:
            case EntityType.DIRECTED_VALVE:
            case EntityType.LOAD_NODE:
            case EntityType.PLANT:
            case EntityType.FLOW_SOURCE:
                return (
                    this.context.globalStore.levelOfEntity.get(entity.uid) === this.context.document.uiState.levelUid
                );
            case EntityType.BACKGROUND_IMAGE:
                return false;
            default:
                assertUnreachable(entity);
        }
        return false;
    }

    messagePriority(context: DrawingContext, object: BaseBackedObject): number {
        if (isCalculated(object.entity)) {
            const calc = context.globalStore.getCalculation(object.entity);
            if (calc && calc.warnings !== null) {
                return 10000; // High priority to warnings.
            }
        }

        switch (object.entity.type) {
            case EntityType.FLOW_SOURCE:
                return 130;
            case EntityType.RISER:
                return 120;
            case EntityType.LOAD_NODE:
            case EntityType.FIXTURE:
            case EntityType.GAS_APPLIANCE:
                return 110;
            case EntityType.BIG_VALVE:
            case EntityType.PLANT:
            case EntityType.DIRECTED_VALVE:
                return 100;
            case EntityType.FITTING:
                return 90;
            case EntityType.SYSTEM_NODE:
                return 80;
            case EntityType.PIPE:
                return 70 + 10 - 10 / ((object as Pipe).computedLengthM + 1);
            case EntityType.BACKGROUND_IMAGE:
                throw new Error("shouldn't have calculations");
        }
        assertUnreachable(object.entity);
    }

    drawReactiveLayer(context: DrawingContext, interactive: string[]): any {
        //
    }

    calculate(context: CanvasContext, done: () => void) {
        this.layout.clear();

        // Add reference to all entities
        this.addReferences();

        context.document.uiState.isCalculating = true;
        context.document.uiState.lastCalculationSuccess = false;

        this.calculator = new CalculationEngine();
        this.calculator.calculate(
            context.globalStore,
            context.document,
            context.effectiveCatalog,
            (success, commit) => {
                if (success) {
                    context.document.uiState.lastCalculationId = context.document.nextId;
                    context.document.uiState.lastCalculationUiSettings = {
                    };
                    context.document.uiState.lastCalculationSuccess = true;

                    const calculationReport = createCalculationReport(context);
                    updateCalculationReport(context.document.documentId, calculationReport);

                    if (!!commit) {
                        context.$store.dispatch("document/commit", { skipUndo: true });
                        context.$store.dispatch("document/reCalculate", true);
                    }
                }

                context.document.uiState.isCalculating = false;

                done();
            },
            context.effectivePriceTable,
            context.$store.getters["customEntity/nodes"]
        );
    }

    getEntityReferenceName(obj: BaseBackedObject): string | null {
        switch (obj.type) {
            case EntityType.FLOW_SOURCE:
                return 'FS';
            case EntityType.PIPE:
                return 'P';
            case EntityType.FITTING:
                return 'F';
            case EntityType.FIXTURE:
            case EntityType.LOAD_NODE:
                return 'X';
            case EntityType.DIRECTED_VALVE:
                if ((obj.entity as DirectedValveEntity).valve.type === ValveType.GAS_REGULATOR) {
                    return 'R';
                }
            case EntityType.BIG_VALVE:
                return 'V';
            case EntityType.PLANT:
                switch ((obj.entity as PlantEntity).plant.type) {
                    case PlantType.CUSTOM:
                        return 'CP';
                    case PlantType.RETURN_SYSTEM:
                        return 'HWP';
                    case PlantType.TANK:
                        return 'TP';
                    case PlantType.PUMP:
                        return 'PP';
                    case PlantType.DRAINAGE_PIT:
                        return 'PT'
                    case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                        return 'GT';
                }
            case EntityType.GAS_APPLIANCE:
                return 'A';
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.RISER:
            default:
                return null;
        }
    }

    systemLayoutRef(flowSystemUid: string, obj: BaseBackedObject): string {
        switch (obj.type) {
            case EntityType.GAS_APPLIANCE:
                return 'G';
            case EntityType.PLANT:
                switch ((obj.entity as PlantEntity).plant.type) {
                    case PlantType.DRAINAGE_PIT:
                    case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                        return 'S';
                    case PlantType.RETURN_SYSTEM:
                        return 'G';
                    case PlantType.CUSTOM:
                    case PlantType.TANK:
                    case PlantType.PUMP:
                    default:
                        break;
                }
            case EntityType.FLOW_SOURCE:
            case EntityType.PIPE:
            case EntityType.FITTING:
            case EntityType.FIXTURE:
            case EntityType.LOAD_NODE:
            case EntityType.DIRECTED_VALVE:
            case EntityType.BIG_VALVE:
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.RISER:
            default:
                break;
        }
        if (isDrainage(flowSystemUid, this.context.document.drawing.metadata.flowSystems)) {
            return 'S';
        }
    
        if (isGas(flowSystemUid, this.context.effectiveCatalog.fluids, this.context.document.drawing.metadata.flowSystems)) {
            return 'G';
        }
    
        return 'W';
    }

    addReferences(): void {
        const references = new Map<string, number>();
        for (const obj of Array.from(this.context.globalStore.values())) {
            const entitySystemUid = getEntitySystem(obj.entity, this.context.globalStore)!;

            const firstRef = this.systemLayoutRef(entitySystemUid, obj);
            const secondRef = this.getEntityReferenceName(obj);
            const levelUid = this.context.globalStore.levelOfEntity.get(obj.uid)!;

            if (firstRef && secondRef && levelUid) {
                const thirdRef = this.context.document.drawing.levels[levelUid].abbreviation!;
                const key = `${firstRef}-${secondRef}-${thirdRef}`;
                const pastId = references.get(key) || 0;
                references.set(key, pastId + 1);
                obj.entity.reference = `${key}-${pastId + 1}`;
            }
        }
    }
}

function createCalculationReport(context: CanvasContext) {
    const calculationReport: AbbreviatedCalculationReport = { calculations: {} };
    const calculations = calculationReport.calculations;
    for (const k of context.globalStore.getCalculations().keys()) {
        const calc = context.globalStore.getCalculations().get(k);
        if (k.length == 36 && calc) {
            switch (calc.type) {
                case CalculationType.PipeCalculation:
                    const pipeCalc = calc as PipeCalculation;
                    const pipeCalcEntry = {
                        type: EntityType.PIPE,
                        nominalSizeMM: pipeCalc.realNominalPipeDiameterMM,
                        lengthM: pipeCalc.lengthM
                    }
                    calculations[k] = pipeCalcEntry;
                    break;
                case CalculationType.RiserCalculation:
                    const riserCalc = calc as RiserCalculation;
                    const pipesComponents: PipeCalculationReportEntry[] = [];
                    const sortedLevels = Object.values(context.document.drawing.levels).sort((a, b) => a.floorHeightM - b.floorHeightM);
                    for (let lvlIndex = 0; lvlIndex < sortedLevels.length - 1; lvlIndex++) {
                        const level = sortedLevels[lvlIndex];
                        pipesComponents.push({
                            type: EntityType.PIPE,
                            nominalSizeMM: riserCalc.heights[level.uid].sizeMM,
                            lengthM: lvlIndex < sortedLevels.length ? sortedLevels[lvlIndex + 1].floorHeightM - level.floorHeightM : 0,
                        });
                    }
                    const riserCalcEntry = {
                        type: EntityType.RISER,
                        expandedEntities: pipesComponents
                    }
                    calculations[k] = riserCalcEntry;
                    break;
                default:
                    break;
            }
        }
    }
    return calculationReport;
}
