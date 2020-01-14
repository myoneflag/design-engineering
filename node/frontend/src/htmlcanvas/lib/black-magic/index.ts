import { DrawableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import * as _ from "lodash";

export interface MagicResult {
    created: DrawableEntityConcrete[];
    deleted: string[];
    focus?: DrawableEntityConcrete;
}

export function combineResults(a: MagicResult, b: MagicResult): MagicResult {
    const res = _.cloneDeep(a);
    res.created.push(...b.created);
    res.deleted.push(...b.deleted);
    return res;
}
