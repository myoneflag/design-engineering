import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Coord, DocumentState, DrawableEntity, FlowSystemParameters} from '@/store/document/types';
import {matrixScale} from '@/htmlcanvas/utils';
import {lighten} from '@/lib/utils';
import Connectable, {ConnectableObject} from '@/htmlcanvas/lib/object-traits/connectable';
import CenterDraggableObject from '@/htmlcanvas/lib/object-traits/center-draggable-object';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {getDragPriority} from '@/store/document';
import {SelectableObject} from '@/htmlcanvas/lib/object-traits/selectable';
import {CenteredObject} from '@/htmlcanvas/lib/object-traits/centered-object';
import {CalculationContext} from '@/calculations/types';
import {FlowNode, SELF_CONNECTION} from '@/calculations/calculation-engine';
import {DrawingArgs} from '@/htmlcanvas/lib/drawable-object';
import {Calculated, CalculatedObject} from '@/htmlcanvas/lib/object-traits/calculated-object';
import {CalculationData} from '@/store/document/calculations/calculation-field';

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject
@CenteredObject
export default class FlowSource extends BackedConnectable<FlowSourceEntity> implements Connectable, Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.FLOW_SOURCE, FlowSource);
    }

    minimumConnections = 0;
    maximumConnections = null;

    dragPriority = getDragPriority(EntityType.FLOW_SOURCE);

    MINIMUM_RADIUS_PX: number = 3;
    lastDrawnWorldRadius: number = 0; // for bounds detection

    drawInternal({ctx, doc, vp}: DrawingContext, {active, selected}: DrawingArgs): void {
        this.lastDrawnWorldRadius = 0;

        const mat = ctx.getTransform();
        const scale = matrixScale(mat);
        // Minimum screen size for them.
        const screenSize = vp.toScreenLength(this.entity.diameterMM / 2);

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
                ctx.arc(
                    0,
                    0,
                    this.MINIMUM_RADIUS_PX / scale,
                    0,
                    Math.PI * 2,
                );
                ctx.fill();

                this.lastDrawnWorldRadius = Math.max(this.lastDrawnWorldRadius, this.MINIMUM_RADIUS_PX / scale);
            }
        }

        ctx.fillStyle = this.color(doc).hex;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(
            0,
            0,
            this.toObjectLength(this.entity.diameterMM / 2),
            0,
            Math.PI * 2,
        );
        this.lastDrawnWorldRadius = Math.max(
            this.lastDrawnWorldRadius,
            this.toObjectLength(this.entity.diameterMM / 2),
        );
        ctx.fill();

    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> { /* */ }

    get position(): Matrix {
        return TM.transform(
            TM.translate(this.entity.center.x, this.entity.center.y),
        );
    }

    color(doc: DocumentState) {
        return this.entity.color == null ? this.system(doc).color : this.entity.color;
    }

    system(doc: DocumentState): FlowSystemParameters {
        const result = doc.drawing.flowSystems.find((v) => v.uid === this.entity.systemUid);
        if (result) {
            return result;
        } else {
            throw new Error('Flow system not found for flow source ' + JSON.stringify(this.entity));
        }
    }

    refreshObjectInternal(obj: FlowSourceEntity): void {
        //
    }

    inBounds(objectCoord: Coord, radius?: number) {
        const dist = Math.sqrt(
            (objectCoord.x) ** 2
            + (objectCoord.y) ** 2,
        );
        return dist <= this.toObjectLength(this.entity.diameterMM / 2) + (radius ? radius : 0);
    }

    getFrictionHeadLoss(context: CalculationContext,
                        flowLS: number,
                        from: FlowNode,
                        to: FlowNode,
                        signed: boolean,
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
        if (to.connection === SELF_CONNECTION) {
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
}
