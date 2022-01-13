import { MoreThan } from "typeorm";
import { DrawingState } from "../../../common/src/api/document/drawing";
import { Document, DocumentStatus } from "../../../common/src/models/Document";
import AbbreviatedCalculationReport from "../../../common/src/api/reports/calculation-report";
import { Tasks } from "../controllers/worker";
import SqsClient from "../services/SqsClient";
import { DocumentReportGenerator, DocumentManufacturerReport } from "./DocumentReportGenerator";
import ReportPersistence from "./ReportPersistence";
import ReportingFilter from "../../../common/src/reporting/ReportingFilter";
import archiver from "archiver";
import streamBuffers from 'stream-buffers';
import { Drawing, DrawingStatus } from "../../../common/src/models/Drawing";

export class ReportingManager {

    static async isReportOngoing() {
        const numberOfMessages = await SqsClient.estimateNumberOfMessages();
        return (numberOfMessages > 0);
    }

    static generateReportId() {
        const now = new Date();
        const dateLabel = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}:${now.getMinutes()}`;
        return dateLabel;
    }

    static async enqueueDocumentsScan(reportId: string) {
        const queueMessage = {
            task: Tasks.DocumentsReportsScan,
            params: {
                reportId,
            },
        };
        await SqsClient.publish(queueMessage);
    }

    static async enqueueDocuments(reportId: string): Promise<boolean> {
        const docs = await Document.find( { where: {
            state: DocumentStatus.ACTIVE,
            lastModifiedOn: MoreThan(ReportingFilter.lookbackTime()),
        }});
        for (const doc of docs) {
            await ReportingManager.enqueueDocument(doc.id, reportId);
        }
        await ReportingManager.enqueueManufacturerScan(reportId);
        return true;
    }

    static async processDocument(docId: number, reportId: string): Promise<boolean> {

        const doc = await Document.findOne(docId);

        const drawing: DrawingState = (await ReportingManager.getDrawingFromDb(doc)).drawing;

        let calculation: AbbreviatedCalculationReport;
        try {
            calculation = await ReportPersistence.readCalculation<AbbreviatedCalculationReport>(docId);
        } catch {
            console.warn(`Missing calculation file for ${docId}.`);
        }

        const report = DocumentReportGenerator.aggregateManufacturersData(doc, drawing, calculation);

        await ReportPersistence.saveDocumentReportData(report.info.id, report);
        await ReportPersistence.saveDocumentReportCSV(report.info.id, report);

        for (const manufacturer of Object.keys(report.data)) {
            const subReport: DocumentManufacturerReport = {
                info: report.info,
                stats: report.stats,
                data: {},
            };
            subReport.data[manufacturer] = report.data[manufacturer];
            await ReportPersistence.saveManufacturerSpecificDocumentReportData(
                manufacturer, report.info.id, reportId, subReport);
        }

        return true;
    }

    static async enqueueManufacturerReports(reportId: string): Promise<boolean> {
        const manufacturerNames = await ReportPersistence.getManufacturerFolderNames(reportId);
        for (const manufacturer of manufacturerNames) {
            await this.enqueueManufacturerReport(manufacturer, reportId);
        }
        await ReportingManager.enqueueManufacturerFinalize(reportId);
        return true;
    }

    static descendingId = (a, b) => a.info.id > b.info.id ? -1 : 1;

    static async processManufacturerReports(reportId: string, manufacturer: string): Promise<boolean> {

        const documentFileNames =
            await ReportPersistence.getManufacturerDocumentReports(manufacturer, reportId);

        const manufacturerDocumentsData: DocumentManufacturerReport[] = [];
        for (const file of documentFileNames) {
            const documentReport = await ReportPersistence.readJsonAs<DocumentManufacturerReport>(file);
            manufacturerDocumentsData.push(documentReport);
        }

        manufacturerDocumentsData.sort( this.descendingId );
        await ReportPersistence.saveManufacturerReportData(manufacturer, reportId, manufacturerDocumentsData);
        await ReportPersistence.saveManufacturerReportCSV(manufacturer, reportId, manufacturerDocumentsData);

        return true;
    }

    static async finalizeManufacturerReports(reportId: string): Promise<boolean> {
        const archive = archiver('zip');
        const archiveBuffer = new streamBuffers.WritableStreamBuffer();
        archive.pipe(archiveBuffer);
        archive.on("error", (e) => console.error(e));
        archive.on("finish", () => { archiveBuffer.end(); });

        const totalsData: DocumentManufacturerReport[] = [];

        const manufacturerNames = await ReportPersistence.getManufacturerFolderNames(reportId);
        for (const manufacturer of manufacturerNames) {
            const reportFilePath =
                ReportPersistence.getManufacturerReportCSVFileName(reportId, manufacturer);
            const reportCSV = await ReportPersistence.readManufacturerReportCSV(reportId, manufacturer);
            const reportFileName = reportFilePath.split("/").slice(-1)[0];
            archive.append(reportCSV, { name: reportFileName });

            const reportJson = await ReportPersistence.readManufacturerReportData(manufacturer, reportId);

            DocumentReportGenerator.aggregateDataByComponent(
                totalsData, "totals", reportJson, manufacturer);

        }

        totalsData.sort( this.descendingId );
        await ReportPersistence.saveManufacturerReportData("totals", reportId, totalsData);

        const totalsReportCSV = await ReportPersistence.saveManufacturerReportCSV("totals", reportId, totalsData);

        archive.append(totalsReportCSV, { name: "totals.csv" });

        await archive.finalize();

        await ReportPersistence.saveManufacturerReportZip(reportId, archiveBuffer.getContents());

        return true;

    }

    private static async getDrawingFromDb(doc: Document) {
        return await Drawing.findOneOrFail(
            { where: { documentId: doc.id, status: DrawingStatus.CURRENT }});
    }

    private static async enqueueDocument(docId: number, reportId: string) {
        const queueMessage = {
            task: Tasks.DocumentsReportsExecute,
            params: {
                docId,
                reportId,
            },
        };
        await SqsClient.publish(queueMessage);
    }

    private static async enqueueManufacturerScan(reportId: string) {
        const queueMessage = {
            task: Tasks.ManufacturersReportsScan,
            params: {
                reportId,
            },
        };
        await SqsClient.publish(queueMessage);
    }

    private static async enqueueManufacturerReport(manufacturer: string, reportId: string) {
        const queueMessage = {
            task: Tasks.ManufacturersReportsExecute,
            params: {
                manufacturer,
                reportId,
            },
        };
        await SqsClient.publish(queueMessage);
    }

    private static async enqueueManufacturerFinalize(reportId: string) {
        const queueMessage = {
            task: Tasks.ManufacturersReportsFinalize,
            params: {
                reportId,
            },
        };
        await SqsClient.publish(queueMessage);
    }

}
