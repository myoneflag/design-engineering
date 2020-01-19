import { Document } from "../../common/src/models/Document";
import { initialDrawing } from "../../common/src/api/document/drawing";
import { cloneSimple } from "../../common/src/lib/utils";
import { Operation } from "../../common/src/models/Operation";
import { OPERATION_NAMES } from "../../common/src/api/document/operation-transforms";
import { applyDiffNative } from "../../common/src/api/document/state-ot-apply";
import { CURRENT_VERSION, upgrade0to1, upgrade1to2 } from "../../common/src/api/upgrade";
import { diffState } from "../../common/src/api/document/state-differ";
import { stringify } from "querystring";

export async function upgradeDocument(doc: Document) {
    const drawing = getInitialDrawing(doc);
    let upgraded = getInitialDrawing();

    if (doc.version === CURRENT_VERSION) {
        return;
    }

    const ops = await Operation.createQueryBuilder('operation')
        .where('operation.document = :document', {document: doc.id})
        .orderBy('operation.orderIndex', "ASC")
        .getMany();

    for (const op of ops) {
        switch (op.operation.type) {
            case OPERATION_NAMES.DIFF_OPERATION:
                applyDiffNative(drawing, op.operation.diff);

                const newUpgraded = cloneSimple(drawing);
                switch (doc.version) {
                    case 0:
                        console.log('upgrading doc ' + doc.id + ' from version 0 to 1');
                        upgrade0to1(newUpgraded);
                    // noinspection FallThroughInSwitchStatementJS
                    case 1:
                        // done
                        console.log('upgrading doc ' + doc.id + ' from version 1 to 2');
                        upgrade1to2(newUpgraded);
                    // noinspection FallThroughInSwitchStatementJS
                    case CURRENT_VERSION:
                        break;
                }

                const upgradedOps = cloneSimple(diffState(upgraded, newUpgraded, undefined));
                upgraded = newUpgraded;
                if (upgradedOps.length) {
                    if (upgradedOps[0].type === OPERATION_NAMES.DIFF_OPERATION) {
                        if (stringify(op.operation) !== stringify(upgradedOps[0]) ) {
                            op.operation = upgradedOps[0];
                            await op.save();
                        }
                    } else {
                        throw new Error('diffState returned something unusual');
                    }
                } else {
                    await op.remove();
                }
                break;
            case OPERATION_NAMES.COMMITTED_OPERATION:
                break;
        }
    }

    // upgrade
    doc.version = CURRENT_VERSION;

    doc.metadata = drawing.metadata.generalInfo;
    await doc.save();
}

export function getInitialDrawing(doc?: Document) {
    if (!doc) {
        // latest
        return cloneSimple(initialDrawing);
    }

    switch (doc.version) {
        case 0:
        case 1:
        case 2:
            return cloneSimple(initialDrawing);
        default:
            throw new Error('invalid state');
    }
}
