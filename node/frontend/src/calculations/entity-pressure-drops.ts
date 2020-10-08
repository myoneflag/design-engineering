import BaseBackedObject from "../../src/htmlcanvas/lib/base-backed-object";
import { EntityType } from "../../../common/src/api/document/entities/types";
import Pipe from "../../src/htmlcanvas/objects/pipe";
import { getDarcyWeisbachFlatMH } from "../../src/calculations/pressure-drops";
import Fitting from "../../src/htmlcanvas/objects/fitting";
import { SystemNodeEntity } from "../../../common/src/api/document/entities/big-valve/big-valve-entity";
import {CalculationContext, PressurePushMode} from "../../src/calculations/types";
import { FlowNode, FLOW_SOURCE_EDGE } from "../../src/calculations/calculation-engine";
import { interpolateTable, parseCatalogNumberExact } from "../../../common/src/lib/utils";

export function getObjectFrictionHeadLoss(
    context: CalculationContext,
    object: BaseBackedObject,
    flowLS: number,
    from: FlowNode,
    to: FlowNode,
    signed: boolean,
    pressureKPA: number | null,
    pressurePushMode: PressurePushMode,
): number | null {
    return object.getFrictionHeadLoss(context, flowLS, from, to, signed, pressureKPA, pressurePushMode);
}
