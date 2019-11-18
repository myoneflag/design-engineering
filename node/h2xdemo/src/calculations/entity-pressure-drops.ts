import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {EntityType} from '@/store/document/entities/types';
import Pipe from '@/htmlcanvas/objects/pipe';
import {interpolateTable, parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';
import {getDarcyWeisbachFlatMH} from '@/calculations/pressure-drops';
import Fitting from '@/htmlcanvas/objects/fitting';
import {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {CalculationContext} from '@/calculations/types';
import {FlowNode, SELF_CONNECTION} from '@/calculations/calculation-engine';

export function getObjectFrictionHeadLoss(
    context: CalculationContext,
    object: BaseBackedObject,
    flowLS: number,
    from: FlowNode,
    to: FlowNode,
    signed = true,
): number {
    return object.getFrictionHeadLoss(context, flowLS, from, to, signed);
}
