import BaseBackedObject from '../../src/htmlcanvas/lib/base-backed-object';
import {EntityType} from '../../src/store/document/entities/types';
import Pipe from '../../src/htmlcanvas/objects/pipe';
import {interpolateTable, parseCatalogNumberExact} from '../../src/htmlcanvas/lib/utils';
import {getDarcyWeisbachFlatMH} from '../../src/calculations/pressure-drops';
import Fitting from '../../src/htmlcanvas/objects/fitting';
import {SystemNodeEntity} from '../../src/store/document/entities/tmv/tmv-entity';
import {CalculationContext} from '../../src/calculations/types';
import {FlowNode, SELF_CONNECTION} from '../../src/calculations/calculation-engine';

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
