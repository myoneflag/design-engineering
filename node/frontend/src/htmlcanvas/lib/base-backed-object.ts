import DrawableObject, { DrawingArgs, EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { CalculationFilters, DocumentState } from "../../../src/store/document/types";
import { DrawingContext, ValidationResult } from "../../../src/htmlcanvas/lib/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete,
    EdgeLikeEntity
} from "../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import Flatten from "@flatten-js/core";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import * as TM from "transformation-matrix";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import { GlobalStore } from "./global-store";
import { Color, Coord, Coord3D } from "../../../../common/src/api/document/drawing";
import { makeEntityFields } from "./utils";
import { getPropertyByString } from "../../lib/utils";

export default abstract class BaseBackedObject extends DrawableObject {
    entityBacked: DrawableEntityConcrete;
    document: DocumentState;
    globalStore: GlobalStore;
    vm: Vue | undefined;
    cache = new Map<string, any>();

    protected onSelect: (event: MouseEvent | KeyboardEvent) => void;
    // Manually use this when automatic redraw (on data change) doesn't pick it up, eg. Background loading.
    protected onRedrawNeeded: () => void;
    protected onInteractionComplete: (event: MouseEvent | KeyboardEvent) => void;

    protected constructor(
        vm: Vue | undefined,
        globalStore: GlobalStore,
        document: DocumentState,
        obj: DrawableEntityConcrete,
        onSelect: (event: MouseEvent | KeyboardEvent) => void,
        onRedrawNeeded: () => void,
        onInteractionComplete: (event: MouseEvent | KeyboardEvent) => void
    ) {
        super(null);
        this.vm = vm;
        this.entityBacked = obj;
        this.document = document;
        this.onSelect = onSelect;
        this.onRedrawNeeded = onRedrawNeeded;
        this.onInteractionComplete = onInteractionComplete;
        this.globalStore = globalStore;
        this.onUpdate();
    }

    get entity() {
        return this.entityBacked;
    }

    get parent() {
        if (this.entity.parentUid === null) {
            return null;
        } else {
            const result = this.globalStore.get(this.entity.parentUid);
            if (result) {
                return result;
            }
            throw new Error(
                "Parent object not created. parent uid: " + this.entity.parentUid + " this uid " + this.entity.uid
            );
        }
    }

    get uid() {
        return this.entity.uid;
    }

    get type(): EntityType {
        return this.entity.type;
    }

    drawInternal(context: DrawingContext, args: DrawingArgs): void {
        const fields = makeEntityFields(this.entity, context.doc, context.catalog);
        const overrideColorList: Color[] = [];
        for (const f of fields) {
            if (f.highlightOnOverride) {
                if (getPropertyByString(this.entity, f.property) != null) {
                    overrideColorList.push(f.highlightOnOverride);
                }
            }
        }

        let selected = false;
        if (args.allSelected !== undefined) {
            selected = args.allSelected;
        } else {
            // determine if this item was selected.
            selected = (context.selectedUids.has(this.entity.uid));
            if (!args.active) {
                selected = false;
            }
        }


        this.drawEntity(context, { ...args, overrideColorList, selected, layerActive: args.active});
    }

    drawCalculationBox(
        context: DrawingContext,
        data: CalculationData[],
        dryRun?: boolean,
        warnSingOnly?: boolean,
        forExport?: boolean
    ): Flatten.Box {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    measureCalculationBox(context: DrawingContext, data: CalculationData[], forExport: boolean): Array<[TM.Matrix, Flatten.Polygon]> {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    getCalculationFields(context: DrawingContext, filters: CalculationFilters): CalculationData[] {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    hasWarning(context: DrawingContext): boolean {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    debase(context: CanvasContext): void {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    rebase(context: CanvasContext): void {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    getSortedAngles(): number[] {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    abstract drawEntity(context: DrawingContext, args: EntityDrawingArgs): void;

    abstract offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null;

    // Return list of objects to remove.
    abstract prepareDelete(context: CanvasContext): BaseBackedObject[];

    abstract inBounds(objectCoord: Coord, objectRadius?: number): boolean;

    abstract getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean,
        pressureKPA: number | null
    ): number | null;

    abstract getCalculationEntities(context: CalculationContext): DrawableEntityConcrete[];

    getCalculationTower(context: CalculationContext): Array<[FittingEntity, PipeEntity] | [FittingEntity]> {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    get3DOffset(connection: string): Coord3D {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    getCalculationNode(context: CalculationContext, connectableUid: string): ConnectableEntityConcrete {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    getCalculationConnectionGroups(context: CalculationContext): EdgeLikeEntity[][] {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    getCalculationConnections(): string[] {
        return [];
    }

    getNeighbours(): BaseBackedObject[] {
        return [];
    }

    getParentChain(): BaseBackedObject[] {
        if (this.parent) {
            const res = this.parent.getParentChain();
            res.push(this);
            return res;
        } else {
            return [this];
        }
    }

    getCopiedObjects(): BaseBackedObject[] {
        return [this, ...this.getNeighbours()];
    }

    onUpdate() {
        /**/
    }

    validate(context: CanvasContext, tryToFix: boolean): ValidationResult {
        return { success: true };
    }
}
