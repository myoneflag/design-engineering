import { IFileSystem } from "./IFileSystem";
import { DiskTmpFileSystem } from "./DiskTmpFileSystem";
import { S3FileSystem } from "./S3FileSystem";
import { ReportCSVFormatter } from "./ReportCSVFormatter";
import { DocumentManufacturerReport } from "./DocumentReportGenerator";
import config from "../config/config";

const BasePaths = {
    Projects: 'projects',
    Manufacturers: 'manufacturers',
    Reports: 'reports',
};

const ProjectPaths = {
    drawing: 'drawing.json',
    calculations: 'calculations.json',
    report: 'report.json',
    reportCSV: 'report.csv',
};

const ManufacturersPaths = {
    document: 'document_${docId}.json',
    manufacturer: 'manufacturer.json',
};

const ReportsPaths = {
    manufacturer: "manufacturer_${manufacturer}.csv",
    manufacturersZip: "manufacturers_${reportId}.zip",
};

function jsonStringify(object: any) {
    return JSON.stringify(object, null, 2);
}

export default class ReportPersistence {

    // tslint:disable-next-line:variable-name
    static _fileSystemInstance: IFileSystem;
    static get fileSystem(): IFileSystem {
        if (config.MODE_PRODUCTION) {
            this._fileSystemInstance = new S3FileSystem();
        } else {
            this._fileSystemInstance = new DiskTmpFileSystem();
        }
        return this._fileSystemInstance;
    }

    static async getManufacturerDocumentReports(manufacturer: string, reportId: string): Promise<string[]> {
        const fileNames = await this.fileSystem.listFileNames(`${BasePaths.Manufacturers}/${reportId}/${manufacturer}`);
        const documentFileNames = fileNames.filter( (fn) => fn !== ManufacturersPaths.manufacturer );
        const documentFileKeys = documentFileNames.map( (n) => `${BasePaths.Manufacturers}/${reportId}/${manufacturer}/${n}`);
        return documentFileKeys;
    }

    static async getManufacturerFolderNames(reportId: string) {
        return await this.fileSystem.listFolderNames(`${BasePaths.Manufacturers}/${reportId}`);
    }

    static async saveDrawing(docId: number, drawing: any) {
        const drawingJson = jsonStringify(drawing);
        await this.fileSystem.saveFile(`${BasePaths.Projects}/${docId}/${ProjectPaths.drawing}`, drawingJson);
    }

    static async saveCalculations(docId: number, calculations: any) {
        const calculationsJson = jsonStringify(calculations);
        await this.fileSystem.saveFile(`${BasePaths.Projects}/${docId}/${ProjectPaths.calculations}`, calculationsJson);
    }

    static async readDrawing<T>(docId: number): Promise<T> {
        const path = `${BasePaths.Projects}/${docId}/${ProjectPaths.drawing}`;
        return this.readJsonAs<T>(path);
    }

    static async readCalculation<T>(docId: number): Promise<T> {
        const path = `${BasePaths.Projects}/${docId}/${ProjectPaths.calculations}`;
        return this.readJsonAs<T>(path);
    }

    static async readJsonAs<T>(filePath: string): Promise<T> {
        let jsonObject: T;
        const jsonString = await this.fileSystem.readFile(filePath);
        jsonObject = JSON.parse(jsonString) as T;
        return jsonObject;
    }

    static async saveDocumentReportData(docId: number, report: any) {
        const reportJson = jsonStringify(report);
        await this.fileSystem.saveFile(
            `${BasePaths.Projects}/${docId}/${ProjectPaths.report}`, reportJson);
    }

    static async saveManufacturerReportData(manufacturer: string, reportId: string, report: any) {
        const reportJson = jsonStringify(report);
        await this.fileSystem.saveFile(
            `${BasePaths.Manufacturers}/${reportId}/${manufacturer}/${ManufacturersPaths.manufacturer}`, reportJson);
    }

    static async readManufacturerReportData(manufacturer: string, reportId: string) {
        return await this.readJsonAs<DocumentManufacturerReport[]>(
            `${BasePaths.Manufacturers}/${reportId}/${manufacturer}/${ManufacturersPaths.manufacturer}`);
    }

    static async saveManufacturerSpecificDocumentReportData(
        manufacturer: string, docId: number, reportId: string, subReport: any) {
        const documentFileName = ManufacturersPaths.document.replace("${docId}", `${docId}`);
        const reportJson = jsonStringify(subReport);
        await this.fileSystem.saveFile(
            `${BasePaths.Manufacturers}/${reportId}/${manufacturer}/${documentFileName}`, reportJson);
    }

    static getManufacturerReportCSVFileName(reportId, manufacturer) {
        const reportFileName = `${ReportsPaths.manufacturer}`.replace("${manufacturer}", manufacturer);
        const reportFilePath = `${BasePaths.Reports}/${reportId}/${reportFileName}`;
        return reportFilePath;
    }

    static async saveManufacturerReportCSV(
        manufacturer: string, reportId: string, report: DocumentManufacturerReport[]) {
        const reportCSV = ReportCSVFormatter.formatManufacturerReport(manufacturer, report);
        const reportFilePath = this.getManufacturerReportCSVFileName(reportId, manufacturer);
        await this.fileSystem.saveFile(reportFilePath, reportCSV);
        return reportCSV;
    }

    static async readManufacturerReportCSV(
        reportId: string, manufacturer: string) {
        const reportFilePath = this.getManufacturerReportCSVFileName(reportId, manufacturer);
        return await this.fileSystem.readFile(reportFilePath);
    }

    static async saveManufacturerReportZip(reportId: string, data: any) {
        const zipFileName =
            `${BasePaths.Reports}/${reportId}/${ReportsPaths.manufacturersZip}`.replace("${reportId}", reportId);
        await this.fileSystem.saveReportArchive(zipFileName, data);
        return { zipFileName };
    }

    static async saveDocumentReportCSV(docId: number, report: DocumentManufacturerReport) {
        const reportFileName =
            `${BasePaths.Reports}/${docId}/${ProjectPaths.reportCSV}`;
        const reportCSV = ReportCSVFormatter.formatDocumentReport(report);
        await this.fileSystem.saveFile(reportFileName, reportCSV);
    }

    static async getDocumentReportCSV(docId: number) {
        const reportFileName =
            `${BasePaths.Reports}/${docId}/${ProjectPaths.reportCSV}`;
        const reportCSVBuffer = await this.fileSystem.readFile(reportFileName);
        const reportCSV = reportCSVBuffer.toString();
        return reportCSV;
    }

}
