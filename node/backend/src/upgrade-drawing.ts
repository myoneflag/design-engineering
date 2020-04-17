import { Document, DocumentStatus } from "../../common/src/models/Document";
import { initialDrawing } from "../../common/src/api/document/drawing";
import { cloneSimple } from "../../common/src/lib/utils";
import { Operation } from "../../common/src/models/Operation";
import { OPERATION_NAMES } from "../../common/src/api/document/operation-transforms";
import { applyDiffNative } from "../../common/src/api/document/state-ot-apply";
import {
    upgrade10to11, upgrade11to12,
    upgrade4to5,
    upgrade5to6,
    upgrade6to7,
    upgrade7to8,
    upgrade8to9,
    upgrade9to10
} from "../../common/src/api/upgrade";
import { diffState } from "../../common/src/api/document/state-differ";
import stringify from "json-stable-stringify";
import { CURRENT_VERSION } from "../../common/src/api/config";

export async function upgradeDocument(doc: Document) {
}

export function getInitialDrawing(doc?: Document) {
    return cloneSimple(initialDrawing);
}


