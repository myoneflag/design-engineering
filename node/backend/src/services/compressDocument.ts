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
import {diffObject, diffState} from "../../../common/src/api/document/state-differ";
import ConcurrentDocument from "./concurrentDocument";

// combines operations on 2 criteria : time and author.
// Never combine operations of different authors.
// For operations > 1 wk old, combine anything with less than 2 hour gap
// For all other operations > 1 day old, combine anything with less than 10 min gap
// For all other operations > 2 hr old, combine anything with less than 1 minute gap
// Don't combine anything done in the last 2 hours.
// DO NOT RUN while a document is open by a client. It will cause inconsistent states.
export async function compressDocumentIfRequired(doc: Document) {


    await ConcurrentDocument.withDocumentLockRepeatableRead(doc.id, async (tx, doc) => {
        let removed = 0;
        let added = 0;
        let ignored = 0;
        const start = new Date().getTime();
        if (start - new Date(doc.lastCompression).getTime() < 60 * 60 * 1) {
            // don't need upgrading. skip.
            return;
        }

        console.log("compressing document id " + doc.id + ", \"" + doc.metadata.title + "\"");

        const ops = await tx.getRepository(Operation)
            .createQueryBuilder('operation')
            .leftJoinAndSelect("operation.blame", "user")
            .where("operation.document = :document", { document: doc.id })
            .orderBy("\"orderIndex\"", "ASC")
            .getMany();

        console.log("...with " + ops.length + " operations");

        let oldDoc = cloneSimple(initialDrawing);
        let currentDrawing = cloneSimple(initialDrawing);
        let oldOp: Operation | undefined = undefined;
        let opsSinceLast: Operation[] = [];
        let numDiffOpsSinceLast = 0;

        // Sneak an undefined in there to trigger the last update check.
        let opNum = 0;
        for (const o of [...ops, undefined]) {
            if (!shouldCombine(oldOp, o) && oldOp) {
                // We should create a new operation.
                if (numDiffOpsSinceLast > 1) {
                    console.log("combining " + opNum);
                    // Replace the last cluster of operations with just one diff-commit pair.
                    const newOps = cloneSimple(diffState(oldDoc, currentDrawing, undefined));
                    if (newOps.length > 0) {
                        if (newOps[0].type === OPERATION_NAMES.DIFF_OPERATION) {
                            await tx.save(Operation, {
                                orderIndex: oldOp.orderIndex - 1,
                                operation: newOps[0],
                                dateTime: oldOp.dateTime,
                                blame: oldOp.blame,
                                documentId: oldOp.documentId,
                            });

                            await tx.save(Operation, {
                                orderIndex: oldOp.orderIndex,
                                operation: {type: OPERATION_NAMES.COMMITTED_OPERATION},
                                dateTime: oldOp.dateTime,
                                blame: oldOp.blame,
                                documentId: oldOp.documentId,
                            });
                            added += 2;
                        }
                    }
                    for (const oo of opsSinceLast) {
                        await tx.remove(Operation, oo);
                        removed ++;
                    }
                } else {
                    // For performance, don't replace the operation row because the bulky operation
                    // should be the the same - just update it.
                    // This is the most common case.
                    for (const oo of opsSinceLast) {
                        ignored ++;
                    }
                }

                numDiffOpsSinceLast = 0;
                opsSinceLast = [];

                for (const oo of opsSinceLast) {
                    switch (oo.operation.type) {
                        case OPERATION_NAMES.DIFF_OPERATION:
                            applyDiffNative(oo, oo.operation.diff);
                            break;
                        case OPERATION_NAMES.COMMITTED_OPERATION:
                            break;
                        default:
                            assertUnreachable(oo.operation);
                    }
                }
            }

            if (o) {
                switch (o.operation.type) {
                    case OPERATION_NAMES.DIFF_OPERATION:
                        applyDiffNative(currentDrawing, o.operation.diff);
                        numDiffOpsSinceLast ++;
                        break;
                    case OPERATION_NAMES.COMMITTED_OPERATION:
                        break;
                    default:
                        assertUnreachable(o.operation);
                }
                opsSinceLast.push(o);
                oldOp = o;
            }
            opNum++;
        }

        doc.lastCompression = new Date();

        await tx.save(doc);

        const totalMs = new Date().getTime() - start;
        console.log("Completed in " + (totalMs / 1000).toPrecision(3) + "s. Removed " + removed + ", inserted " + added + ", ignored: " + ignored);
    });


}

// As a tester, group in buckets of 5 second gaps.
// To help, here is some research done on 15/11/2020.
// Of the roughly 3.1 million operations at the time (wowzers!), here are the frequency distributions
// of how they spread out:
// 100th percentile (smallest diff): 0.0 seconds (obv)
// 50%: 0.54 seconds
// 25%: 4.7 seconds (so a quarter of all operations occur 4.7 seconds or more after the previous)
// 10%: 12 seconds
// 3%: 38 seconds
// 1%: 163 seconds
// .3%: 18 minutes
// .2%: 41 minutes
// .1%: 911 minutes
// 0.0%: 17458275.717999935 or ~202 days was the longest a doc went untouched then touched again.

// In conclusion, by choosing 2 hours as a break, we can reduce the number of operations stored
// by 500-1000x. By choosing a 10 minute gap, it is 100-300x. 1 minute, it is 30-100x.
function shouldCombine(a: Operation | undefined, b: Operation | undefined): boolean {
    if (!a) {
        return true;
    }
    if (!b) {
        return false;
    }
    if (a.blame && b.blame && a.blame.username !== b.blame.username) {
        return false;
    }

    const tb = new Date(b.dateTime).getTime();
    const ta = new Date(a.dateTime).getTime();
    const opDiffSecs = (tb - ta) / 1000;

    const agoSecs = (new Date().getTime() - new Date(b.dateTime).getTime()) / 1000;
    if (agoSecs > 60 * 60 * 24 * 7) {
        // more than a week - gap is 2 hours.
        return opDiffSecs < 60 * 60 * 2;
    } else if (agoSecs > 60 * 60 * 10) {
        // Different working day. Gap is 20 min
        return opDiffSecs < 60 * 20;
    } else if (agoSecs > 60 * 60) {
        // same day but more than an hour ago. Do groups with 2 min gap
        return opDiffSecs < 60 * 2;
    } else {
        // within the hour. Do none.
        return false;
    }
}