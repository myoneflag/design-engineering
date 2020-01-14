import { Document } from "../../common/src/models/Document";
import { initialDrawing } from "../../common/src/api/document/drawing";
import { cloneSimple } from "../../common/src/lib/utils";
import { Operation } from "../../common/src/models/Operation";
import { OPERATION_NAMES } from "../../common/src/api/document/operation-transforms";
import { applyDiffNative } from "../../common/src/api/document/state-ot-apply";
import { CURRENT_VERSION, upgrade0to1 } from "../../common/src/api/upgrade";
import { diffState } from "../../common/src/api/document/state-differ";

export async function upgradeDocument(doc: Document) {
    let drawing = getInitialDrawing(doc);

    const ops = await Operation.createQueryBuilder('operation')
        .where('operation.document = :document', {document: doc.id})
        .orderBy('operation.orderIndex', "ASC")
        .getMany();

    for (const op of ops) {
        switch (op.operation.type) {
            case OPERATION_NAMES.DIFF_OPERATION:
                applyDiffNative(drawing, op.operation.diff);
                break;
            case OPERATION_NAMES.COMMITTED_OPERATION:
                break;
        }
    }

    const original = cloneSimple(drawing);
    // upgrade
    switch (doc.version) {
        case 0:
            console.log('upgrading doc ' + doc.id + ' from version 0 to 1');
            drawing = upgrade0to1(drawing);
        // noinspection FallThroughInSwitchStatementJS
        case 1:
            // done
            break;
    }

    const upgradeOp = diffState(original, drawing, undefined);
    const inverse = diffState(drawing, original, undefined);
    doc.version = CURRENT_VERSION;

    const nextOpIndex = ops.length ? ops[ops.length - 1].orderIndex + 1 : 1;
    if (upgradeOp.length) {
        console.log('writing op for doc: ' + JSON.stringify(upgradeOp));
        const newOp: Operation = Operation.create();
        newOp.orderIndex = nextOpIndex;
        newOp.document = Promise.resolve(doc);
        newOp.operation = upgradeOp[0];

        await newOp.save();

        const committedOp = Operation.create();
        committedOp.orderIndex = nextOpIndex + 1;
        committedOp.document = Promise.resolve(doc);
        committedOp.operation = {
            type: OPERATION_NAMES.COMMITTED_OPERATION,
            id: nextOpIndex + 1,
        };

        await committedOp.save();
    }
}

export function getInitialDrawing(doc: Document) {
    switch (doc.version) {
        case 0:
        case 1:
            return cloneSimple(initialDrawing);
        default:
            throw new Error('invalid state');
    }
}
