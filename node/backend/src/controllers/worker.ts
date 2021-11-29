import { Request, Response, Router } from "express";
import { ReportingManager } from "../reporting/ReportingManager";
import { DocumentUpgrader } from "../services/DocumentUpgrader";

export enum Tasks {
    DocumentUpgradeScan = "DocumentUpgradeScan",
    DocumentUpgradeExecute = "DocumentUpgradeExecute",
    DocumentsReportsScan = "DocumentsReportsScan",
    DocumentsReportsExecute = "DocumentsReportsExecute",
    ManufacturersReportsExecute = "ManufacturersReportsExecute",
    ManufacturersReportsScan = "ManufacturersReportsScan",
    ManufacturersReportsFinalize = "ManufacturersReportsFinalize",
}

export class WorkerController {
    public async processQueueMessage(req: Request, res: Response) {
        const jsonMessage = req.body;
        console.log( { "worker.message": jsonMessage });

        let docId: number;
        let reportId: string;
        let result = true;
        console.log({ "worker.task": jsonMessage.task });
        try {
            switch (jsonMessage.task) {
                case Tasks.DocumentUpgradeScan:
                    await DocumentUpgrader.submitDocumentsForUpgrade();
                    break;
                case Tasks.DocumentUpgradeExecute:
                    docId = req.body.params.docId;
                    result = await DocumentUpgrader.onDocumentUpgradeRequest(docId);
                    break;
                case Tasks.DocumentsReportsScan:
                    reportId = req.body.params.reportId;
                    result = await ReportingManager.enqueueDocuments(reportId);
                    break;
                case Tasks.DocumentsReportsExecute:
                    docId = req.body.params.docId;
                    reportId = req.body.params.reportId;
                    result = await ReportingManager.processDocument(docId, reportId);
                    break;
                case Tasks.ManufacturersReportsScan:
                    reportId = req.body.params.reportId;
                    result = await ReportingManager.enqueueManufacturerReports(reportId);
                    break;
                case Tasks.ManufacturersReportsExecute:
                    reportId = req.body.params.reportId;
                    const manufacturer = req.body.params.manufacturer;
                    result = await ReportingManager.processManufacturerReports(reportId, manufacturer);
                    break;
                case Tasks.ManufacturersReportsFinalize:
                    reportId = req.body.params.reportId;
                    result = await ReportingManager.finalizeManufacturerReports(reportId);
                    break;
                default:
                    console.log("worker.unkownMessage");
                    result = false;
            }
            if (result) {
                return res.status(200).send({success: true});
            } else {
                return res.status(406).send({success: false});
            }
        } catch (err) {
            console.log({ "worker.error": jsonMessage.task, docId } );
            console.error(err);
            return res.status(500).send({success: false});
        }
    }
}

const router: Router = Router();
const controller = new WorkerController();

// process incoming worker messages
router.post('/workermessage', controller.processQueueMessage.bind(controller));

export const workerRouter = router;
