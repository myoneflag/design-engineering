import {
    upgrade10to11,
    upgrade11to12, upgrade12to13, upgrade13to14, upgrade14to15, upgrade15to16, upgrade16to17, upgrade17to18,
    upgrade18to19, upgrade19to20, upgrade20to21,
    upgrade9to10, upgraded21to22
} from "../../../common/src/api/upgrade";
import { Operation } from "../../../common/src/models/Operation";
import { Document, DocumentStatus } from "../../../common/src/models/Document";
import { OPERATION_NAMES } from "../../../common/src/api/document/operation-transforms";
import { applyDiffNative } from "../../../common/src/api/document/state-ot-apply";
import { cloneSimple } from "../../../common/src/lib/utils";
import { diffState } from "../../../common/src/api/document/state-differ";
import stringify from "json-stable-stringify";
import { initialDrawing } from "../../../common/src/api/document/drawing";
import ConcurrentDocument from "./concurrentDocument";
import {getManager, LessThan} from "typeorm";
import { CURRENT_VERSION } from "../../../common/src/api/config";
import SqsClient from "../services/SqsClient"
import { promisify } from "util";
import {compressDocumentIfRequired} from "./compressDocument";
import {withTransaction} from "../helpers/database";

export const UPGRADE_EXPIRED_THRESHOLD_MIN = 10;
// acknowledge that we are working while upgrading, but with enough interval so we don't update the DB too often.

export const HEARTBEAT_INTERVAL_SEC = 5; // It doesn't seem like connections are being kept alive by heartbeats, so
// send to a dummy topic every now and then during long updates without acks.

export enum Tasks {
    DocumentUpgradeScan = "documentUpgradeScan",
    DocumentUpgradeExecute = "documentUpgradeExecute"
}

export class DocumentUpgrader {

    static async submitDocumentsForUpgrade() {
        const docs = await Document.find({
            upgradingLockExpires: LessThan(new Date()),
            version: LessThan(CURRENT_VERSION),
        });

        // Easier to just sort in code than DB
        const toUpgrade = docs.sort((a, b) => {
            if (a.state === DocumentStatus.ACTIVE && b.state !== DocumentStatus.ACTIVE) {
                return -1;
            } else if (a.state !== DocumentStatus.ACTIVE && b.state === DocumentStatus.ACTIVE) {
                return 1;
            } else if (a.lastModifiedOn < b.lastModifiedOn) { // Upgrade recent documents first.
                return -1;
            } else if (a.lastModifiedOn > b.lastModifiedOn) {
                return 1;
            }
            return 0;
        });

        console.log('documentUpgradeScan', { 'count': toUpgrade.length });
        for (const doc of toUpgrade) {
            await this.enqueueDocumentForUpgrade(doc.id);
        }
    }

    static async enqueueDocumentForUpgrade(docId: number) {
        const queueMessage = { 
            "task": Tasks.DocumentUpgradeExecute,
            "parameters": {
                "docId": docId
            }
        }
        await SqsClient.publish(queueMessage)
    }

    static async onDocumentUpgradeRequest(docId: number) {
        let timingLabel = `documentUpgradeExecute:${docId}:${Date.now()}`        
        try {
            console.log('documentUpgradeExecute', 'start', {docId, CURRENT_VERSION})

            console.time(timingLabel)

            let shouldUpgrade = true;

            await ConcurrentDocument.withDocumentLockRepeatableRead(docId, async (tx, innerDoc) => {
                const now = new Date();

                if (innerDoc.version >= CURRENT_VERSION) {
                    shouldUpgrade = false;
                } else if (innerDoc.upgradingLockExpires && innerDoc.upgradingLockExpires >= new Date()) {
                    console.log('documentUpgradeExecute', 'stillUpgrading', { docId });
                    shouldUpgrade = false;
                }
                if (shouldUpgrade) {
                    innerDoc.upgradingLockExpires = new Date(new Date().getTime() + UPGRADE_EXPIRED_THRESHOLD_MIN * 60000);
                    await tx.save(innerDoc);
                }
            });

            if (!shouldUpgrade) {
                console.log('documentUpgradeExecute', 'skiping', { docId });
                return;
            }


            console.timeLog(timingLabel, 'getDoc', { docId })

            const doc = await Document.findOne({ id: docId });
            // await compressDocumentIfRequired(doc);

            //await new Promise((res) => setTimeout(res, 5000));

            const drawing = initialDrawing(doc.locale);
            let upgraded = initialDrawing(doc.locale);


            let ops: Operation[];

            await getManager().transaction('READ UNCOMMITTED', async (tx) => {
                
                console.timeLog(timingLabel, 'getOps:start', { docId })

                ops = await tx.getRepository(Operation)
                    .createQueryBuilder("operation")
                    .leftJoinAndSelect("operation.blame", "user")
                    .where("operation.document = :document", { document: docId })
                    .orderBy("operation.orderIndex", "ASC")
                    .getMany();

                console.timeLog(timingLabel, 'getOps:end', { docId, fromVersion: doc.version, ops: ops.length, state: doc.state})

                let opsUpgraded = 0;
                let opsProcessed = 0;
                for (const op of ops) {
                    if (!(opsProcessed++ % 100))
                        console.timeLog(timingLabel, { opsProcessed })
                    switch (op.operation.type) {
                        case OPERATION_NAMES.DIFF_OPERATION:
                            applyDiffNative(drawing, op.operation.diff);

                            const newUpgraded = cloneSimple(drawing);
                            switch (doc.version) {
                                case 0:
                                case 1:
                                case 2:
                                case 3:
                                case 4:
                                case 5:
                                case 6:
                                case 7:
                                case 8:
                                    throw new Error("Version too old");
                                case 9:
                                    upgrade9to10(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 10:
                                    upgrade10to11(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 11:
                                    upgrade11to12(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 12:
                                    upgrade12to13(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 13:
                                    upgrade13to14(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 14:
                                    upgrade14to15(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 15:
                                    upgrade15to16(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 16:
                                    upgrade16to17(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 17:
                                    upgrade17to18(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 18:
                                    upgrade18to19(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 19:
                                    upgrade19to20(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 20:
                                    upgrade20to21(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case 21:
                                    upgraded21to22(newUpgraded);
                                // noinspection FallThroughInSwitchStatementJS
                                case CURRENT_VERSION:
                                    break;
                            }

                            const upgradedOps = cloneSimple(diffState(upgraded, newUpgraded, undefined));
                            upgraded = newUpgraded;
                            if (upgradedOps.length) {
                                if (upgradedOps[0].type === OPERATION_NAMES.DIFF_OPERATION) {
                                    if (stringify(op.operation) !== stringify(upgradedOps[0])) {
                                        opsUpgraded++;
                                        op.operation = upgradedOps[0];
                                        await tx.save(Operation, op);
                                    }
                                } else {
                                    throw new Error("diffState returned something unusual");
                                }
                            } else {
                                await tx.remove(Operation, op);
                            }
                            break;
                        case OPERATION_NAMES.COMMITTED_OPERATION:
                            break;
                    }


                    // yield a bit, ya know? Let the message handling breathe.
                    await new Promise((res, rej) => {
                        setTimeout(res, 0);
                    });
                }

                // upgrade
                doc.version = CURRENT_VERSION;
                doc.metadata = drawing.metadata.generalInfo;
                await tx.save(Document, doc);

                console.timeLog(timingLabel, { "complete": true, docId, opsUpgraded} );
            });
        } catch(error) {
            console.log('documentUpgradeExecute', 'error', { docId, error } );
            throw(error)
        } finally {
            console.timeEnd(timingLabel)            
        }
    }
}

// one of function to fix botched upgrade :(
export async function fixOperationIds() {
    const docs = await Document.find();
    for (const doc of docs) {
        const ops = await Operation.createQueryBuilder("operation")
            .leftJoinAndSelect("operation.blame", "user")
            .where("operation.document = :document", { document: Number(doc.id) })
            .orderBy("operation.orderIndex", "ASC")
            .getMany();

        let maxId = -1;
        for (const o of ops) {
            maxId = Math.max(maxId, o.orderIndex);
        }

        doc.nextOperationIndex = maxId + 1;
        await doc.save();
    }
}
