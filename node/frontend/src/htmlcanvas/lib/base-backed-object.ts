import DrawableObject from "../../../src/htmlcanvas/lib/drawable-object";
import { CalculationFilters, Coord, Coord3D, DrawableEntity } from "../../../src/store/document/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import { EntityType } from "../../../src/store/document/entities/types";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete,
    EdgeLikeEntity
} from "../../../src/store/document/entities/concrete-entity";
import Layer from "../../../src/htmlcanvas/layers/layer";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import Flatten from "@flatten-js/core";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import * as TM from "transformation-matrix";
import FittingEntity from "../../store/document/entities/fitting-entity";
import PipeEntity from "../../store/document/entities/pipe-entity";
import * as _ from "lodash";
import { GlobalStore } from "./global-store";
import { ObjectStore } from "./object-store";

export default abstract class BaseBackedObject extends DrawableObject {
    entityBacked: () => DrawableEntityConcrete;
    objectStore: ObjectStore;
    vm: Vue | undefined;
    cache = new Map<string, any>();

    protected onSelect: (event: MouseEvent | KeyboardEvent) => void;
    protected onChange: () => void;
    protected onCommit: (event: MouseEvent | KeyboardEvent) => void;

    protected constructor(
        vm: Vue | undefined,
        objectStore: ObjectStore,
        layer: Layer,
        obj: () => DrawableEntityConcrete,
        onSelect: (event: MouseEvent | KeyboardEvent) => void,
        onChange: () => void,
        onCommit: (event: MouseEvent | KeyboardEvent) => void
    ) {
        super(null, layer);
        this.vm = vm;
        this.entityBacked = obj;
        this.onSelect = onSelect;
        this.onChange = onChange;
        this.onCommit = onCommit;
        this.objectStore = objectStore;
        this.onUpdate();
    }

    get parent() {
        if (this.entity.parentUid === null) {
            return null;
        } else {
            const result = this.objectStore.get(this.entity.parentUid);
            if (result) {
                return result;
            }
            throw new Error(
                "Parent object not created. parent uid: " + this.entity.parentUid + " this uid " + this.entity.uid
            );
        }
    }

    get entity() {
        return this.entityBacked();
    }

    drawCalculationBox(
        context: DrawingContext,
        data: CalculationData[],
        dryRun?: boolean,
        warnSingOnly?: boolean
    ): Flatten.Box {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    measureCalculationBox(context: DrawingContext, data: CalculationData[]): Array<[TM.Matrix, Flatten.Polygon]> {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    getCalculationFields(context: DrawingContext, filters: CalculationFilters): CalculationData[] {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    hasWarning(context: DrawingContext): boolean {
        throw new Error("Not implemented. Please use @CalculatedObject to implement.");
    }

    debase(): void {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    rebase(context: CanvasContext): void {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    getSortedAngles(): number[] {
        throw new Error("Method not implemented. Please use @Connectable to implement.");
    }

    abstract offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null;

    // Return list of objects to remove.
    abstract prepareDelete(context: CanvasContext): BaseBackedObject[];

    abstract inBounds(objectCoord: Coord, objectRadius?: number): boolean;

    abstract getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean
    ): number | null;

    get uid() {
        return this.entity.uid;
    }

    get type(): EntityType {
        return this.entity.type;
    }

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

    onUpdate() {
        /**/
    }
}
