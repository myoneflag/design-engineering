// The idea of compression for the document is to consolidate changes so that we
// aren't storing every change, and instead we are grouping chunks of changes together.
// We want to do this for:
// 1. make history changes usable in terms of performance and meaningful changes.
// 2. make upgrading much faster - so it doesn't have to upgrade as many states.

import {Document} from "../../../common/src/models/Document";
import {Operation} from "../../../common/src/models/Operation";
import {cloneSimple} from "../../../common/src/lib/utils";
import {initialDrawing} from "../../../common/src/api/document/drawing";
import {OPERATION_NAMES} from "../../../common/src/api/document/operation-transforms";
import {applyDiffNative} from "../../../common/src/api/document/state-ot-apply";
import {assertUnreachable} from "../../../common/src/api/config";
import {diffState} from "../../../common/src/api/document/state-differ";
import ConcurrentDocument from "./concurrentDocument";

// combines operations on 2 criteria : time and author.
// Never combine operations of different authors.
// For operations > 1 wk old, combine anything with less than 2 hour gap
// For all other operations > 1 day old, combine anything with less than 10 min gap
// For all other operations > 2 hr old, combine anything with less than 1 minute gap
// Don't combine anything done in the last 2 hours.
// DO NOT RUN while a document is open by a client. It will cause inconsistent states.
export async function compressDocument(doc: Document) {
    await ConcurrentDocument.withDocumentLock(doc.id, async (tx, doc) => {
        let removed = 0;
        let added = 0;
        let ignored = 0;
        const start = new Date().getTime();
        tx.createQueryBuilder()
        const ops = await tx.createQueryBuilder()
            .select()
            .from(Operation, 'operation')
            .leftJoinAndSelect("operation.blame", "user")
            .where("operation.document = :document", { document: doc.id })
            .orderBy("\"orderIndex\"", "ASC")
            .getMany();

        let oldDoc = cloneSimple(initialDrawing);
        let currentDrawing = cloneSimple(initialDrawing);
        let oldOp: Operation | undefined = undefined;
        let opsSinceLast: Operation[] = [];
        let numDiffOpsSinceLast = 0;

        let orderIndex = 0;

        // Sneak an undefined in there to trigger the last update check.
        for (const o of [...ops, undefined]) {
            if (!shouldCombine(oldOp, o) && oldOp) {
                // We should create a new operation.
                if (numDiffOpsSinceLast > 1) {
                    // Replace the last cluster of operations with just one diff-commit pair.
                    const newOps = cloneSimple(diffState(oldDoc, currentDrawing, undefined));
                    if (newOps.length > 0) {
                        if (newOps[0].type === OPERATION_NAMES.DIFF_OPERATION) {
                            await tx.save(Operation, {
                                orderIndex,
                                operation: newOps[0],
                                dateTime: oldOp.dateTime,
                                blame: oldOp.blame,
                            });
                            orderIndex ++;

                            await tx.save(Operation, {
                                orderIndex,
                                operation: {type: OPERATION_NAMES.COMMITTED_OPERATION},
                                dateTime: oldOp.dateTime,
                                blame: oldOp.blame,
                            });
                            orderIndex ++;
                            added += 2;
                        }
                    }
                    for (const oo of opsSinceLast) {
                        await tx.remove(oo);
                        removed ++;
                    }
                } else {
                    // For performance, don't replace the operation row because the bulky operation
                    // should be the the same - just update it.
                    // This is the most common case.
                    for (const oo of opsSinceLast) {
                        if (oo.orderIndex !== orderIndex) {
                            oo.orderIndex = orderIndex;
                            await tx.save(Operation, oo);
                        }
                        orderIndex ++;
                        ignored ++;
                    }
                }

                numDiffOpsSinceLast = 0;
                opsSinceLast = [];

                oldDoc = cloneSimple(currentDrawing);
            }

            if (o) {
                switch (o.operation.type) {
                    case OPERATION_NAMES.DIFF_OPERATION:
                        applyDiffNative(currentDrawing, o.operation.diff);
                        numDiffOpsSinceLast ++;
                        oldOp = o;
                        break;
                    case OPERATION_NAMES.COMMITTED_OPERATION:
                        break;
                    default:
                        assertUnreachable(o.operation);
                }
                opsSinceLast.push(o);
            }
        }

        doc.nextOperationIndex = orderIndex;
        await tx.save(doc);

        const totalMs = new Date().getTime() - start;
        console.log("Completed in " + (totalMs / 1000).toPrecision(3) + "s. Removed " + removed + ", inserted " + added + ", ignored: " + ignored);
    });


}

// As a tester, group in buckets of 5 second gaps.
function shouldCombine(a: Operation | undefined, b: Operation | undefined): boolean {
    if (!a) {
        return true;
    }
    if (!b) {
        return false;
    }

    const tb = new Date(b.dateTime).getTime();
    const ta = new Date(a.dateTime).getTime();
    const secs = (tb - ta) / 1000;
    return secs <= 5;
}