import { Interaction, InteractionType } from "../../../../src/htmlcanvas/lib/interaction";
import DrawableObjectFactory from "../../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { ConnectableObject } from "../../../../src/htmlcanvas/lib/object-traits/connectable";
import { DocumentState } from "../../../../src/store/document/types";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";
import { InvisibleNode } from "../../../../src/htmlcanvas/objects/invisible-node";
import Flatten from "@flatten-js/core";
import { DrawingContext } from "../../../../src/htmlcanvas/lib/types";
import { lighten } from "../../../../src/lib/utils";
import {
    FlowConfiguration,
    SystemNodeEntity
} from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { getDragPriority } from "../../../../src/store/document";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete
} from "../../../../../common/src/api/document/entities/concrete-entity";
import Centered, { CenteredObjectNoParent } from "../../../../src/htmlcanvas/lib/object-traits/centered-object";
import { CalculationContext } from "../../../../src/calculations/types";
import { FlowNode } from "../../../../src/calculations/calculation-engine";
import { DrawingArgs, EntityDrawingArgs } from "../../../../src/htmlcanvas/lib/drawable-object";
import { Calculated, CalculatedObject } from "../../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../../src/store/document/calculations/calculation-field";
import * as TM from "transformation-matrix";
import { Matrix } from "transformation-matrix";
import PipeEntity from "../../../../../common/src/api/document/entities/pipe-entity";
import SystemNodeCalculation from "../../../store/document/calculations/system-node-calculation";
import { assertUnreachable } from "../../../../../common/src/api/config";
import { Coord } from "../../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../../common/src/lib/utils";

@CalculatedObject
@ConnectableObject()
@CenteredObjectNoParent
export default class SystemNode extends InvisibleNode<SystemNodeEntity> implements Centered, Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.SYSTEM_NODE, SystemNode);
    }

    minimumConnections = 0;
    maximumConnections = 1;
    dragPriority = getDragPriority(EntityType.SYSTEM_NODE);

    get position(): Matrix {
        return TM.transform(TM.translate(this.entity.center.x, this.entity.center.y));
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        switch (interaction.type) {
            case InteractionType.STARTING_PIPE:
            case InteractionType.CONTINUING_PIPE:
                if (this.globalStore.getConnections(this.entity.uid).length > 0) {
                    return null;
                }
                if (interaction.system.uid !== this.entity.systemUid && !this.entity.allowAllSystems) {
                    return null;
                }
                break;
            case InteractionType.MOVE_ONTO_RECEIVE:
                if (this.globalStore.getConnections(this.entity.uid).length > 0) {
                    return null;
                }
                break;
            case InteractionType.MOVE_ONTO_SEND:
                return null;
            case InteractionType.EXTEND_NETWORK:
                if (
                    this.entity.configuration === FlowConfiguration.BOTH ||
                    interaction.configuration === FlowConfiguration.BOTH
                ) {
                    break;
                } else if (this.entity.configuration !== interaction.configuration) {
                    return null;
                }
        }
        return super.offerInteraction(interaction);
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        // Choose to show away from the parent
        const po = this.globalStore.get(this.entity.parentUid!)!;
        switch (po.entity.type) {
            case EntityType.FITTING:
            case EntityType.RISER:
            case EntityType.SYSTEM_NODE:
            case EntityType.FLOW_SOURCE:
            case EntityType.BIG_VALVE:
            case EntityType.LOAD_NODE:
            case EntityType.FIXTURE:
            case EntityType.DIRECTED_VALVE:
            case EntityType.PLANT:
                const center = po.toWorldCoord();
                const wc = this.toWorldCoord();
                const v = Flatten.vector([wc.x - center.x, wc.y - center.y]);
                const vo = Flatten.vector([0, -1]);
                let angle: number;
                if (v.length > 0) {
                    angle = vo.angleTo(v);
                } else {
                    angle = (po.toWorldAngleDeg(0) / 180) * Math.PI;
                }

                return [
                    angle,
                    angle - Math.PI / 4,
                    angle + Math.PI / 4,
                    angle - Math.PI / 2,
                    angle + Math.PI / 2,
                    angle - (Math.PI * 3) / 4,
                    angle + (Math.PI * 3) / 4
                ].map((dir) => {
                    return TM.transform(
                        TM.identity(),
                        TM.translate(wc.x, wc.y),
                        TM.rotate(dir),
                        TM.scale(scale),
                        TM.translate(0, -80),
                        TM.rotate(-dir)
                    );
                });
            case EntityType.PIPE:
            case EntityType.BACKGROUND_IMAGE:
                throw new Error("invalid parent");
        }
        assertUnreachable(po.entity);
    }

    system(doc: DocumentState) {
        const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === this.entity.systemUid);
        if (system) {
            return system;
        } else {
            throw new Error("System does't exist");
        }
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> {
        /* */
    }

    drawEntity(context: DrawingContext, { selected }: EntityDrawingArgs): void {
        if (selected) {
            context.ctx.fillStyle = lighten(this.system(context.doc).color.hex, 50, 0.7);
            context.ctx.beginPath();
            context.ctx.arc(0, 0, 50, 0, Math.PI * 2);
            context.ctx.fill();
        }
    }

    inBounds(objectCoord: Coord, objectRadius: number): boolean {
        if (objectRadius) {
            if (Flatten.vector(objectCoord.x, objectCoord.y).length <= objectRadius) {
                return true;
            }
        }
        return false;
    }

    rememberToRegister(): void {
        //
    }

    getCalculationConnections(): string[] {
        if (!this.entity.parentUid) {
            throw new Error("Parent of the system node is missing");
        }
        return [this.entity.parentUid];
    }

    getCalculationEntities(context: CalculationContext): DrawableEntityConcrete[] {
        if (!this.entity.parentUid) {
            throw new Error("Parent of the system node is missing");
        }
        const tower: Array<
            [ConnectableEntityConcrete, PipeEntity] | [ConnectableEntityConcrete]
        > = this.getCalculationTower(context);

        // find the fixture that our parent is connected to, and turn it back into a system node.
        const connected = this.getCalculationNode(context, this.entity.parentUid);
        for (const level of tower) {
            if (level[0].uid === connected.uid) {
                // replace it with a system node (me).
                const se: SystemNodeEntity = cloneSimple(this.entity);
                se.uid = level[0].uid;
                se.calculationHeightM = level[0].calculationHeightM;
                se.parentUid = (this.globalStore.get(se.parentUid!) as BaseBackedObject).getCalculationEntities(
                    context
                )[0].uid;
                level[0] = se;
            }
        }

        return tower.flat();
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean
    ): number {
        if (from.connection === this.entity.parentUid || to.connection === this.entity.parentUid) {
            return 0;
        } else {
            throw new Error(
                "system node shouldn't have any extra joints. " +
                    "from: " +
                    JSON.stringify(from) +
                    " to " +
                    JSON.stringify(to) +
                    " parent: " +
                    this.entity.parentUid
            );
        }
    }

    collectCalculations(context: CalculationContext): SystemNodeCalculation {
        const ce = this.getCalculationEntities(context);
        const ghost = ce.filter((e) => e.type === this.type)[0] as SystemNodeEntity;
        const calc = context.globalStore.getOrCreateCalculation(ghost);

        // explicitly create this to help with refactors
        const res: SystemNodeCalculation = {
            psdUnits: calc.psdUnits,
            flowRateLS: calc.flowRateLS,
            pressureKPA: calc.pressureKPA, // TODO: differentiate this in different levels
            warning: calc.warning,
            staticPressureKPA: calc.staticPressureKPA,
        };

        const tower = this.getCalculationTower(context);

        if (this.getCalculationConnectionGroups(context).flat().length <= 2) {
            // that's fine
        } else {
            throw new Error(
                "Too many connections coming out of the system node " + JSON.stringify(this.getCalculationConnections())
            );
        }

        tower.forEach(([v, p]) => {
            res.warning = res.warning || context.globalStore.getOrCreateCalculation(v).warning;
        });

        return res;
    }
}
