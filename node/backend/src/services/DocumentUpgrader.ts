import {
    drawing_upgraded22to23,
    drawing_upgraded23to24,
    drawing_upgraded24to25,
    drawing_upgraded25to26,
    drawing_upgraded26to27,
    drawing_upgraded27to28,
    drawing_upgraded28to29,
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

    static updateDrawingStateWithOperations(
        operations: Operation[], drawing: DrawingState, runUpgrades: boolean, lastVersion: number) {
        for (const op of operations) {
            // apply migration to drawing when operation version changes
            if (runUpgrades && op.version !== lastVersion && lastVersion !== -1) {
                DocumentUpgrader.upgradeDrawing(drawing, lastVersion, op.version);
            }
            if (op.operation.type === OPERATION_NAMES.DIFF_OPERATION) {
                applyDiffNative(drawing, op.operation.diff);
            }
            lastVersion = op.version;
        }
        return lastVersion;
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
                DocumentUpgrader.upgradeDrawing(drawing, doc.version, CURRENT_VERSION);
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

    public static upgradeDrawing(drawing: DrawingState, version: number, targetVersion: number) {
        console.info(`Upgrading drawing from current: ${version} to target: ${targetVersion}. CURRENT_VERSION = ${CURRENT_VERSION}`);
        // CAUTION: follow the pattern when adding new cases bellow
        // case N:
        //     drawing_upgradedNtoN+1(drawing);
        //     if (targetVersion === N+1) { break; }
        switch (version) {
            case 22:
                drawing_upgraded22to23(drawing);
                if (targetVersion === 23) { break; }
            case 23:
                drawing_upgraded23to24(drawing);
                if (targetVersion === 24) { break; }
            case 24:
                drawing_upgraded24to25(drawing);
                if (targetVersion === 25) { break; }
            case 25:
                drawing_upgraded25to26(drawing);
                if (targetVersion === 26) { break; }
            case 26:
                drawing_upgraded26to27(drawing);
                if (targetVersion === 27) { break; }
            case 27:
                drawing_upgraded27to28(drawing);
                if (targetVersion === 28) { break; }
            case 28:
                drawing_upgraded28to29(drawing);
                if (targetVersion === 29) { break; }
            case targetVersion:
                break;
        }
    }
}
