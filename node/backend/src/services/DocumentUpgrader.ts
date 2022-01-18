import {
    drawing_upgraded22to23,
    drawing_upgraded23to24,
    drawing_upgraded24to25,
} from "../../../common/src/api/upgrade";
import { Document, DocumentStatus } from "../../../common/src/models/Document";
import { DrawingState, initialDrawing } from "../../../common/src/api/document/drawing";
import ConcurrentDocument from "./concurrentDocument";
import { EntityManager, LessThan } from "typeorm";
import { CURRENT_VERSION } from "../../../common/src/api/config";
import SqsClient from "../services/SqsClient";
import { withReadUncommittedTransaction } from "../helpers/database";
import { Tasks } from "../controllers/worker";
import { Drawing, DrawingStatus } from "../../../common/src/models/Drawing";
import { Operation } from "../../../common/src/models/Operation";
import { OPERATION_NAMES } from "../../../common/src/api/document/operation-transforms";
import { applyDiffNative } from "../../../common/src/api/document/state-ot-apply";

export class DocumentUpgrader {

    static async submitDocumentsForUpgrade() {

        const docs = await Document.find({
            where: {
                version: LessThan(CURRENT_VERSION),
            }
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

        console.log('documentUpgradeScan', { toUpgrade: toUpgrade.length });
        while (toUpgrade.length) {
            const docsBatch = toUpgrade.splice(0, 10);
            const docsIdBatch = docsBatch.map((d) => d.id);
            await this.enqueueDocumentForUpgrade(docsIdBatch);
        }
    }

    static async enqueueDocumentForUpgrade(docIds: number[]) {
        const queueMessages = docIds.map((docId) => (
            {
                task: Tasks.DocumentUpgradeExecute,
                params: {
                    docId,
                },
            }));
        await SqsClient.publishBatch(queueMessages);
    }

    static async composeDrawingStateFromOperations(tx: EntityManager, doc: Document, runUpgrades: boolean) {
        const operations = await tx.getRepository(Operation)
            .createQueryBuilder("operation")
            .leftJoinAndSelect("operation.blame", "user")
            .where("operation.document = :document", { document: doc.id })
            .orderBy("operation.orderIndex", "ASC")
            .getMany();
        const drawing = initialDrawing(doc.locale);
        let lastOpId = -1;
        let lastVersion = -1;
        for (const op of operations) {
            // apply migration to drawing when operation version changes
            if (runUpgrades && op.version !== lastVersion && lastVersion !== -1) {
                DocumentUpgrader.upgradeDrawing(drawing, op.version);
            }
            if (op.operation.type === OPERATION_NAMES.DIFF_OPERATION) {
                applyDiffNative(drawing, op.operation.diff);
            }
            lastOpId = op.orderIndex;
            lastVersion = op.version;
        }
        return drawing;
    }

    static async onDocumentUpgradeRequest(docId: number, overwrite = false): Promise<boolean> {
        const timingLabel = `timer:documentUpgradeExecute:${docId}:${Date.now()}`;
        try {
            console.log(timingLabel, 'start', { docId, CURRENT_VERSION });

            console.time(timingLabel);

            const alreadyUpgraded = await ConcurrentDocument.withDocumentLock(docId, async (tx, doc) => {
                return doc.version >= CURRENT_VERSION;
            });
            if (!overwrite && alreadyUpgraded) {
                console.timeLog(timingLabel, 'alreadyUpgraded', { docId });
                return true;
            }

            const doc = await Document.findOne({ id: docId });

            await withReadUncommittedTransaction(async (tx) => {

                // drawing based upgrades
                const drawingData: Drawing = await tx.getRepository(Drawing).findOneOrFail(
                    { where: { documentId: doc.id, status: DrawingStatus.CURRENT } });
                const drawing = drawingData.drawing;
                DocumentUpgrader.upgradeDrawing(drawing, doc.version);
                doc.metadata = drawing.metadata.generalInfo;
                drawingData.version = CURRENT_VERSION;
                await tx.save(Drawing, drawingData);

                // upgrade
                doc.version = CURRENT_VERSION;

                await tx.save(Document, doc);
            });
            console.timeLog(timingLabel, 'complete', { docId });
            console.timeEnd(timingLabel);
        } catch (error) {
            console.timeLog(timingLabel, 'error', { docId, error });
            console.timeEnd(timingLabel);
            throw (error);
        }
        return true;
    }

    public static upgradeDrawing(drawing: DrawingState, version: number) {
        // do not add "break" statements to the swith case below
        // intentionally the upgrade process will go through all the version increments until reaching CURRENT_VERSION
        switch (version) {
            case 22:
                drawing_upgraded22to23(drawing);
            case 23:
                drawing_upgraded23to24(drawing);
            case 24:
                drawing_upgraded24to25(drawing);
            case CURRENT_VERSION:
                break;
        }
    }
}
