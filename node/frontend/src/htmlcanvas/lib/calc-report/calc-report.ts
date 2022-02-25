import CanvasContext from '../canvas-context';
import Docxtemplater from 'docxtemplater';
import Excel from 'exceljs';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { User } from '../../../../../common/src/models/User';
import Axios from 'axios';
import {
    DesignCalculationReport,
    DesignParameterReport,
    DesignSummaryReport,
    EntityCalcReport,
    FluidCalculationReport,
    ProductSelectionReport,
    ProductSelectionReportKey,
    ReportContent,
    ReportGeneralInfo
} from './types';
import {
    getDesignParameter,
    getDesignSummary,
    getDrawnFlowsystems,
    getProductSelection,
    getWaterCalculationReport
} from './utils';
import _ from 'lodash';

class CalculationReport {

    context: CanvasContext;
    doc: Docxtemplater;
    workbooks: Map<string, Excel.Workbook>;
    workbook: Excel.Workbook;
    worksheet: Excel.Worksheet;
    zip: PizZip;
    user: User;
    drawnFlowSystemUids: Set<string>;
    productSelectionPageNumber = 5;
    appA = 10;

    constructor(context: CanvasContext, user: User) {
        this.context = context;
        this.user = user;
        this.drawnFlowSystemUids = getDrawnFlowsystems(context);
        this.workbooks = new Map<string, Excel.Workbook>();
        this.zip = new PizZip();
    }

    async initDocument(): Promise<void> {
        try {
            const response = await Axios
                .get('/template/Calculation-Export.docx', {
                    responseType: 'arraybuffer',
                    headers: {
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    },
                });
            
            const zip = new PizZip(response.data);
    
            this.doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
        } catch (err) {
            throw new Error(JSON.stringify(err))
        }
    }

    renderCoverPage(): ReportGeneralInfo {
        const context = this.context;
        const drawing = context.document.drawing;
        const user = this.user;
        const levelCountTxt = `${Object.keys(drawing.levels).length} level${Object.keys(drawing.levels).length > 1 ? 's' : ''}`;

        return {
            ...drawing.metadata.generalInfo,
            organizationName: user.organization ? user.organization.name.toUpperCase() : '',
            reportDate: new Date().toLocaleString(),
            levelCountTxt,
        };
    }

    renderDesignSummary(): DesignSummaryReport {
        const context = this.context;
        const drawnFlowSystemUids = this.drawnFlowSystemUids;
        return getDesignSummary(context, drawnFlowSystemUids);
    }

    renderDesignParameters(): DesignParameterReport {
        const context = this.context;
        const drawnFlowSystemUids = this.drawnFlowSystemUids;
        const designParameterReport = getDesignParameter(context, drawnFlowSystemUids);

        this.productSelectionPageNumber += designParameterReport.pressureFlowSystems.length - 1;
        designParameterReport.drainageFlowSystems.forEach((item) => {
            if (item.horizontalPipeSizing.length + 
                item.ventSizing.length + 
                item.stackVentPipeSizing.length + 
                item.maxUnventedLengthM.length > 18) {
                this.productSelectionPageNumber += 2;
            } else {
                this.productSelectionPageNumber += 1;
            }
        });

        return designParameterReport;
    }

    renderProductSelection(): ProductSelectionReport {
        const context = this.context;
        const productSelectionReport = getProductSelection(context);

        let techCount = 0;
        for (const key in productSelectionReport) {
            productSelectionReport[key as ProductSelectionReportKey].forEach((item) => {
                techCount += item.technicalData.length ? 5 : 4;
                techCount += item.technicalData.length;
            });
        }
        this.appA = this.productSelectionPageNumber + Math.ceil(techCount / 30);
        return productSelectionReport;
    }

    renderContentPage(): ReportContent {
        return {
            dsn: 3,
            dpn: 4,
            psn: this.productSelectionPageNumber,
            appA: this.appA,
            appB: this.appA + 1,
            appC: this.appA + 2,
            appD: this.appA + 3,
            appE: this.appA + 4,
            appF: this.appA + 5,
        };
    }

    renderDocument(): void {
        const context = this.context;
        const readOnlyLink = window.location.origin + "/" + context.document.shareToken;

        try {
            this.doc.render({
                ...this.renderCoverPage(),
                ...this.renderDesignSummary(),
                ...this.renderDesignParameters(),
                ...this.renderProductSelection(),
                ...this.renderContentPage(),
                readOnlyLink,
            });
        } catch (e) {
            throw new Error(JSON.stringify(e));
        }
    }

    async composeDocument() {
        const context = this.context;
        await this.initDocument();
        this.renderDocument();

        const out = this.doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const documentTitle = context.document.drawing.metadata.generalInfo.title + ' - Design Report.docx';

        const docBase64 = await blobToBase64(out);
        this.zip.file(documentTitle, docBase64, {base64: true});
    }
    
    initWorkbook() {
        this.workbook = new Excel.Workbook();
        const workbook = this.workbook
        workbook.creator = this.user.name;
        workbook.lastModifiedBy = this.user.name;
        workbook.created = new Date();
        workbook.modified = new Date();
    
        workbook.properties.date1904 = true;
    
        workbook.calcProperties.fullCalcOnLoad = true;
        workbook.views = [
            {
                x: 0, y: 0, width: 10000, height: 20000,
                firstSheet: 0, activeTab: 0, visibility: 'visible'
            }
        ];
    }

    renderSheets(entityCalcReports: { [key: string]: EntityCalcReport[] }) {
        const sheet = this.worksheet;
        const flowSystems = this.context.document.drawing.metadata.flowSystems;

        let rowNum = 1;
        for (const [levelName, reportData] of Object.entries(entityCalcReports)) {
            if (!reportData.length) {
                continue;
            }

            const colNum = Object.keys(reportData[0]).length - 1;

            sheet.mergeCells(`A${rowNum}:${getColumn(colNum-1)}${rowNum}`);
            sheet.getCell(`A${rowNum}`).value = levelName;
            stylizeHeader(sheet.getCell(`A${rowNum}`));
            rowNum++;

            for (let i = 0; i < colNum; i++) {
                sheet.getCell(`${getColumn(i)}${rowNum}`).value = Object.keys(reportData[0])[i + 1];
                stylizeTitle(sheet.getCell(`${getColumn(i)}${rowNum}`));
            }
            rowNum++;

            const sortedReportEntries = Object.entries(_.groupBy(reportData, 'flowSystemUid')).sort(([keyA], [keyB]) => {
                const indexA = flowSystems.findIndex((fs) =>fs.uid === keyA);
                const indexB = flowSystems.findIndex((fs) =>fs.uid === keyB);
                if (indexA < 0) {
                    return 1;
                }
                if (indexB < 0) {
                    return -1;
                }
                if (indexA > indexB) {
                    return 1;
                }
                return -1;
            });

            for (const [fsUid, fsData] of sortedReportEntries) {
                const flowSystemName = flowSystems.find((fs) => fs.uid === fsUid)?.name || '';

                sheet.mergeCells(`A${rowNum}:${getColumn(colNum-1)}${rowNum}`);
                sheet.getCell(`A${rowNum}`).value = flowSystemName;
                stylizeSubTitle(sheet.getCell(`A${rowNum}`));
                rowNum++;

                for (const data of fsData) {
                    for (let j = 0; j < colNum; j++) {
                        sheet.getCell(`${getColumn(j)}${rowNum}`).value = Object.values(data)[j + 1];
                    }
                    rowNum++;
                }
                rowNum++;
            }
            rowNum++;
        }
    }

    createWorkSheets(fluidCalculationReport: FluidCalculationReport) {
        const workbook = this.workbook;

        for (const [worksheetName, entityCalcReport] of Object.entries(fluidCalculationReport)) {
            if (!Object.values(entityCalcReport).map((e) => !!e.length).includes(true)) {
                continue;
            }
            this.worksheet = workbook.addWorksheet(worksheetName);
            this.renderSheets(entityCalcReport);
        }
    }

    createWorkBooks(designCalculationReport: DesignCalculationReport) {
        for (const [workbookName, fluidCalculationReport] of Object.entries(designCalculationReport)) {
            if (!_.union(
                ...Object.values(fluidCalculationReport as FluidCalculationReport).map((entityCalcReport) => 
                    Object.values(entityCalcReport).map((e) => !!e.length))
                ).includes(true)
            ) {
                continue;
            }

            this.initWorkbook();
            this.createWorkSheets(fluidCalculationReport);
            this.workbooks.set(workbookName, this.workbook);
        }
    }

    async composeWorkbooks() {
        const context = this.context;
        const designCalculationReport = getWaterCalculationReport(context);
        this.createWorkBooks(designCalculationReport);

        await Promise.all(
            Array.from(this.workbooks.entries()).map(async ([workbookName, workbook]) => {
                const buffer = await workbook.xlsx.writeBuffer();
                const bookBlob = new Blob([new Uint8Array(buffer, 0, buffer.byteLength)]);
                const workbookTitle = workbookName + ' - Calculation Export.xlsx';
                const bookBase64 = await blobToBase64(bookBlob);
                this.zip.file(workbookTitle, bookBase64, {base64: true});
            })
        );
    }

    downloadReportZip() {
        const context = this.context;
        const zipTitle = context.document.drawing.metadata.generalInfo.title + ' - Calculation Export.zip';
        const zipContent = this.zip.generate({ type: "blob" });
        saveAs(zipContent, zipTitle);
    }
}

export function getColumn(i: number): string {
    const m = i % 26;
    const c = String.fromCharCode(65 + m);
    const r = i - m;
    return r > 0
      ? `${getColumn((r - 1) / 26)}${c}`
      : c;
}

function stylizeHeader(cell: Excel.Cell) {
    cell.worksheet.getRow(Number(cell.row)).height = 20;
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A86E8" } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12 };
}

function stylizeTitle(cell: Excel.Cell) {
    cell.font = { bold: true };
    cell.worksheet.getColumn(Number(cell.col)).width = 20;
}

function stylizeSubTitle(cell: Excel.Cell) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "d6d8fd" } };
    cell.font = { bold: true, italic: true, size: 11 };
    cell.alignment = { horizontal: "center" };
    cell.worksheet.getColumn(Number(cell.col)).width = 20;
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (err) => {
            reject(err);
        };
        reader.readAsDataURL(blob);
    });
}

export async function exportCalcReport(context: CanvasContext): Promise<void> {
    const user = context.$store.getters['profile/profile'] as User;
    const report = new CalculationReport(context, user);

    await report.composeDocument();
    await report.composeWorkbooks();
    report.downloadReportZip();
}
