import { NextFunction, Request, Response, Router } from "express";
import { Session } from "../../../common/src/models/Session";
import { AccessLevel } from "../../../common/src/models/User";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";
import { ReportingManager } from "../reporting/ReportingManager";
import ReportPersistence from "../reporting/ReportPersistence";

export class ReportsController {

    @ApiHandleError()
    @AuthRequired()
    public async updateCalculationReport(req: Request, res: Response, next: NextFunction, session: Session) {
        const data = req.body;
        const docId = parseInt(req.params.id, 10);
        await ReportPersistence.saveCalculations(docId, data);
        res.status(200).send({
            success: true,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async refreshDocumentReport(req: Request, res: Response, next: NextFunction, session: Session) {
        const docId = parseInt(req.params.id, 10);
        await ReportingManager.processDocument(docId, "debug");
        res.status(200).send({
            success: true,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async downloadDocumentReport(req: Request, res: Response, next: NextFunction, session: Session) {
        const docId = parseInt(req.params.id, 10);
        const csvReport = await ReportPersistence.getDocumentReportCSV(docId);
        res.status(200).send({
            data: csvReport,
            success: true,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async triggerSystemManufacturerReport(req: Request, res: Response, next: NextFunction, session: Session) {
        let success;
        const reportId = ReportingManager.generateReportId();
        const ongoing = await ReportingManager.isReportOngoing();
        if (ongoing) {
            throw new Error("Reports are ongoing");
        } else {
            await ReportingManager.enqueueDocumentsScan(reportId);
            success = true;
        }
        res.status(200).send({
            success,
        });
    }

}

const router: Router = Router();
const controller = new ReportsController();
router.post("/", controller.triggerSystemManufacturerReport.bind(controller));
router.put("/document/:id/calculation", controller.updateCalculationReport.bind(controller));
router.post("/document/:id", controller.refreshDocumentReport.bind(controller));
router.get("/document/:id", controller.downloadDocumentReport.bind(controller));

export const reportsRouter = router;
