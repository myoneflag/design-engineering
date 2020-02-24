// @ts-ignore
import * as C2S from "../../../../custom-modules/canvas2svg/canvas2svg";
import CanvasContext from "../canvas-context";
import * as TM from "transformation-matrix";
import { MainEventBus } from "../../../store/main-event-bus";
import { ViewPort } from "../../viewport";
// @ts-ignore
import PDFDocument from "../../../../custom-modules/pdfkit/pdfkit.standalone.js";
import PDFKit from "pdfkit";
import blobstream from "blob-stream";
// @ts-ignore
import SVGtoPDF from "svg-to-pdfkit";
// @ts-ignore
import { parse as svgParse, stringify as svgStringify } from "svgson";
// @ts-ignore
import { INFO_BAR_SIZE_MM, MARGIN_SIZE_MM } from "../../tools/pdf-snapshot-tool";
import { PAPER_SIZES, PaperSize } from "../../../../../common/src/api/paper-config";
import { fetchDataUrl, parseScale } from "../../utils";
import { getPropertyByString } from "../../../lib/utils";
import { DEFAULT_FONT_NAME, DEFAULT_FONT_NAME_BOLD } from "../../../config";
import { getDocument } from "../../../api/document";
import { drawPaperScale } from "../../on-screen-items";
import {
    COMPONENT_PRESSURE_LOSS_METHODS,
    PIPE_SIZING_METHODS,
    RING_MAIN_CALCULATION_METHODS
} from "../../../../../common/src/api/config";
import * as _ from "lodash";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { BackgroundImage } from "../../objects/background-image";

export function mm2pt(mm: number) {
    return 72 * mm / 25.4;
}

export function pt2mm(pt: number) {
    return pt * 25.4 / 72;
}

export function px2pt(px: number) {
    return px * 72 / 96;
}

export function mm2px(mm: number) {
    return 72 * mm / 25.4 * 96 / 72;
}

const PADDING_MM = 4;

export interface ExportPdfOptions {
    paperSize: PaperSize;
    scaleName: string;
    coverSheet: boolean;
    floorPlans: boolean;
    allLevels: boolean;
}

export async function scaleSvg(svg: string, scale: number) {
    console.log(scale);
    const svgson = await svgParse(svg);

    if (svgson.name !== 'svg') {
        throw new Error('expected svg tag, got ' + svgson.name);
    }

    if (!svgson.attributes.viewBox) {
        if (!svgson.attributes.width) {
            throw new Error('explicit width required');
        }
        svgson.attributes.viewBox = '0 0 ' + svgson.attributes.width + ' ' + svgson.attributes.height;

    }


    svgson.attributes.width *= scale;
    svgson.attributes.height *= scale;
    return svgStringify(svgson);
}

function getLevelName(context: CanvasContext, levelUid: string | undefined) {
    let levelString = '';
    levelUid = levelUid || context.document.uiState.levelUid!;
    if (levelUid) {
        levelString = context.document.drawing.levels[levelUid].name;
    }
    return levelString;
}

const companyNameCache = new Map<number, string>();
async function getCompanyName(context: CanvasContext): Promise<string | null> {
    if (!companyNameCache.has(Number(context.document.documentId))) {
        const docRes = await getDocument(context.document.documentId);
        if (docRes.success) {
            companyNameCache.set(Number(context.document.documentId), docRes.data.organization.name);
        } else {
            return null;
        }
    }
    return companyNameCache.get(Number(context.document.documentId))!;
}

async function drawTitleBar(pdf: PDFKit.PDFDocument, context: CanvasContext, paperSize: PaperSize, scaleName: string, levelUid: string) {
    const titleBarLeft = paperSize.widthMM - MARGIN_SIZE_MM - INFO_BAR_SIZE_MM;
    let titleBarTop = MARGIN_SIZE_MM + 10;

    // Let's start with bottom to top elements.
    let titleBarBottom = paperSize.heightMM - MARGIN_SIZE_MM;

    // attributes
    titleBarBottom -= pt2mm(60);
    pdf.fontSize(Math.round(mm2pt(6)));
    pdf.text('Scale ' + scaleName + ' @' + paperSize.name, mm2pt(titleBarLeft +  PADDING_MM), mm2pt(titleBarBottom), {width: mm2pt(INFO_BAR_SIZE_MM -  PADDING_MM * 2)});

    // attribute table
    titleBarBottom -= pt2mm(drawGeneralTable(pdf, context, mm2pt(4), mm2pt(INFO_BAR_SIZE_MM), mm2pt(PADDING_MM), mm2pt(titleBarLeft), mm2pt(titleBarBottom - 30), false, false));

    // h2x logo credit
    titleBarBottom -= 100;
    pdf.text(
        'Powered by H2X Engineering Software',
        mm2pt(titleBarLeft +  PADDING_MM ),
        mm2pt(titleBarBottom),
        {link: 'https://h2xengineering.com'}
    );
    pdf.image(
        await fetchDataUrl(require('../../../assets/h2x.png')),
        //mm2pt(titleBarLeft + INFO_BAR_SIZE_MM - 20),
        //mm2pt(titleBarTop),
        {width: mm2pt(20), link: 'https://h2xengineering.com' as any},
    );

    // level
    pdf.fontSize(Math.round(mm2pt(8)));
    let levelString = getLevelName(context, levelUid);
    const levelTextHeight = pdf.heightOfString(levelString, {width: mm2pt(INFO_BAR_SIZE_MM -  PADDING_MM * 2)});
    titleBarBottom -= pt2mm(levelTextHeight);
    pdf.text(levelString, mm2pt(titleBarLeft +  PADDING_MM ), mm2pt(titleBarBottom), {width: mm2pt(INFO_BAR_SIZE_MM -  PADDING_MM * 2)});

    // Title
    const titleText = context.document.drawing.metadata.generalInfo.title;
    pdf.fontSize(Math.round(mm2pt(15)));
    const titleHeight = pdf.heightOfString(titleText, {width: mm2pt(INFO_BAR_SIZE_MM -  PADDING_MM * 2)});
    titleBarBottom -= pt2mm(titleHeight);
    pdf.text(titleText, mm2pt(titleBarLeft +  PADDING_MM ), mm2pt(titleBarBottom), {width: mm2pt(INFO_BAR_SIZE_MM -  PADDING_MM * 2)});




    // Top to Bottom stuff
    // Company Logo
    pdf.fontSize(Math.round(mm2pt(10)));
    pdf.text('Designed By', mm2pt(titleBarLeft +  PADDING_MM), mm2pt(titleBarTop), {width: mm2pt(INFO_BAR_SIZE_MM -  PADDING_MM * 2)});
    titleBarTop += pt2mm(35);


    pdf.fontSize(Math.round(mm2pt(15)));
    const companyName = ((await getCompanyName(context)) || '').toUpperCase();
    const companyHeight = pdf.heightOfString(companyName, {width: mm2pt(INFO_BAR_SIZE_MM  -  PADDING_MM * 2)});
    pdf.text(companyName, mm2pt(titleBarLeft +  PADDING_MM), mm2pt(titleBarTop), {width: mm2pt(INFO_BAR_SIZE_MM -  PADDING_MM * 2)});
    titleBarTop += pt2mm(companyHeight);

    pdf.fontSize(Math.round(mm2pt(4)));

}

export async function drawScale(doc: PDFKit.PDFDocument, paperSize: PaperSize, scaleName: string) {
    const factor = parseScale(scaleName);
    const RENDER_WIDTH = 200; // to make text visible, this was adjusted manually.

    // In the final SVG on the pdf, how many page mm will it occupy?
    const PAPER_MM = INFO_BAR_SIZE_MM - PADDING_MM * 2;
    const PHYSICAL_MM = PAPER_MM / factor;

    const pxPerMM = RENDER_WIDTH / PHYSICAL_MM;

    const ctx = new C2S.C2S(RENDER_WIDTH, 50);
    drawPaperScale(ctx, pxPerMM, RENDER_WIDTH, 0, 0);
    const svg = ctx.getSerializedSvg();

    const PAPER_UNITS = mm2pt(PAPER_MM);
    const scaled = await scaleSvg(svg, PAPER_UNITS / RENDER_WIDTH);

    SVGtoPDF(doc, scaled, mm2pt(paperSize.widthMM - MARGIN_SIZE_MM - INFO_BAR_SIZE_MM + PADDING_MM), mm2pt(paperSize.heightMM - MARGIN_SIZE_MM - 15), {assumePt: true});
}

function drawGeneralTable(doc: PDFKit.PDFDocument, context: CanvasContext, fontSize: number, width: number, padding: number, x: number, y: number, topToBottom: boolean, darkHeader: boolean): number {

    let height = 0;
    const fields = [
        ["client", "Client:", "text"],
        ["title", "Project Title:", "text"],
        ["projectNumber", "Project No.", "text"],
        ["projectStage", "Project Stage:", "text"],
        ["designer", "Designer:", "text"],
        ["reviewed", "Reviewed by:", "text"],
        ["approved", "Approved by:", "text"],
        ["revision", "Revision No.:", "number"],
        ["description", "Description:", "textarea"],
    ];

    if (!topToBottom) {
        fields.reverse();
    }

    doc.fontSize(Math.round((fontSize)));
    let cursorTop = y;


    // bottom to top, as we measure text.
    for (const field of fields) {
        const content = getPropertyByString(context.document.drawing.metadata.generalInfo, field[0]);
        const title = field[1];
        const contentHeight = doc.heightOfString(content, {width: (width / 2 - padding * 2)});
        const titleHeight = doc.heightOfString(title, {width: (width / 2 -  padding * 2)});

        const rowHeight = Math.max(contentHeight, titleHeight) +  padding;

        if (!topToBottom) {
            cursorTop -= (rowHeight);
        }
        height += (rowHeight);

        console.log(cursorTop + ' ' + rowHeight + ' ' + contentHeight + ' ' + titleHeight);

        if (darkHeader) {
            doc.fillColor([47, 84, 150]);
            doc.rect((x + padding), (cursorTop), (width -  padding * 2) / 2, rowHeight);
            doc.fill();
        }

        doc.rect((x + padding), (cursorTop), (width -  padding * 2), rowHeight);
        doc.stroke();

        doc.moveTo((x + width / 2), (cursorTop));
        doc.lineTo((x + width / 2), (cursorTop) + rowHeight);
        doc.stroke();

        if (darkHeader) {
            doc.fillColor('white');
        } else {
            doc.fillColor('black');
        }
        doc.text(title, (x +  padding * 1.5), (cursorTop + padding * 0.6), { width: (width / 2 -  padding * 2)});
        doc.fillColor('black');
        doc.text(content, (x + width / 2 +  padding / 2), (cursorTop + padding * 0.6), { width: (width / 2 -  padding * 2)});

        if (topToBottom) {
            cursorTop += (rowHeight);
        }
    }
    return height;
}


async function drawFooter(doc: PDFKit.PDFDocument) {
    const ox = doc.x;
    const oy = doc.y;
    doc.fontSize(8);
    doc.page.margins.bottom = 0;

    doc.fillColor([0, 0, 238]);
    doc.text('https://h2xengineering.com', 60, doc.page.height - 40, {link: 'https://h2xengineering.com'});
    doc.fillColor('black');
    doc.text('Powered By H2X Engineering ', doc.page.width - 200, doc.page.height - 40, {link: 'https://h2xengineering.com'});
    doc.image(await fetchDataUrl(require('../../../assets/h2x.png')), doc.page.width - 80, doc.page.height - 45, {width: 30, link: 'https://h2xengineering.com' as any});
    doc.x = ox;
    doc.y = oy;
}

async function drawCoverSheet(context: CanvasContext, doc: PDFKit.PDFDocument, options: ExportPdfOptions) {
    doc.addPage({size: [mm2pt(options.paperSize.widthMM), mm2pt(options.paperSize.heightMM)]});
    await drawFooter(doc);
    const generalInfo = context.document.drawing.metadata.generalInfo;
    const calculationParams = context.document.drawing.metadata.calculationParams;
    const flowSystems = context.document.drawing.metadata.flowSystems;


    let contentHeight = 1200;
    if (flowSystems.length < 4) {
        contentHeight -= 150 * Math.min(3, 4 - flowSystems.length);
    }
    doc.y += (doc.page.height - contentHeight) / 2;
    doc.fontSize(50);
    doc.fillColor([47, 84, 150]);
    doc.text(generalInfo.title.toUpperCase(), {align: "center"});
    doc.fontSize(30);
    doc.fillColor('black');
    if (generalInfo.projectNumber) {
        doc.text('PROJECT NO. ' + generalInfo.projectNumber, {align: "center"});
    }

    doc.y += 30;
    doc.fontSize(70);
    doc.fillColor([47, 84, 150]);
    doc.text('WATER SYSTEM RESULTS', {align: "center"});


    doc.y += 30;
    doc.fontSize(20);
    doc.fillColor('black');
    doc.text('Designed by ' + ((await getCompanyName(context)) || '').toUpperCase(), {align: "center"});
    doc.y += 10;

    const w = 350;
    const l = (doc.page.width - w) / 2;
    drawGeneralTable(doc, context, 10, w, 10, l, doc.y, true, true);

    doc.y += 80;

    const flowSystemPagesNeeded = Math.ceil(flowSystems.length / 4);

    const columnYStart = doc.y;
    let cursorY = columnYStart;
    const pageletWidth = mm2pt(PAPER_SIZES.A4.heightMM - 20); // manually removed 20 to make it fit on A2
    const pageletContentWidth = pageletWidth - mm2pt(MARGIN_SIZE_MM * 2);

    // Calculation Params

    doc.x = (doc.page.width - pageletWidth * (flowSystemPagesNeeded + 1)) / 2 + mm2pt(MARGIN_SIZE_MM);
    let paramContentTop = doc.y;
    doc.lineGap(8);
    doc.fillColor('Black');
    doc.fontSize(25);
    doc.text('Design Parameters');
    doc.fontSize(10);
    if (calculationParams.psdMethod) {
        const ox = doc.x;
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Peak Flow Rate Calculation Method for Loading Units: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text(context.effectiveCatalog.psdStandards[calculationParams.psdMethod].name, {'align': "right", width: pageletContentWidth});
    }
    if (calculationParams.dwellingMethod) {
        const ox = doc.x;
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Peak Flow Rate Calculation Method for Dwellings: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text(context.effectiveCatalog.dwellingStandards[calculationParams.dwellingMethod].name, {'align': "right", width: pageletContentWidth});
    }

    {
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Pipe Sizing Method: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text( PIPE_SIZING_METHODS.find((m) => m.key === calculationParams.pipeSizingMethod)!.name, {'align': "right", width: pageletContentWidth});
    }

    {
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Ring Main Sizing Method: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text( RING_MAIN_CALCULATION_METHODS.find((m) => m.key === calculationParams.ringMainCalculationMethod)!.name, {'align': "right", width: pageletContentWidth});
    }

    {
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Component Pressure Loss Method: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text( COMPONENT_PRESSURE_LOSS_METHODS.find((m) => m.key === calculationParams.componentPressureLossMethod)!.name, {'align': "right", width: pageletContentWidth});
    }


    // flow systems
    doc.y = paramContentTop;
    doc.x += pageletWidth;
    doc.fillColor('Black');
    doc.fontSize(25);
    doc.text('Flow System Parameters');
    paramContentTop += 50;

    let i = 0;
    for (const fs of flowSystems) {

        const rgb = hexToRgb(fs.color.hex);
        doc.fontSize(10);
        doc.fillColor(rgb);
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text(fs.name + ' System Properties: ', {underline: true});
        doc.fillColor('black');
        doc.font(DEFAULT_FONT_NAME);
        doc.text('Temperature: ' + fs.temperature + '\u00B0C');

        const ox = doc.x;
        if (Object.keys(fs.networks)) {
            let leftPt = ox;
            const colWidth = pageletContentWidth / Object.keys(fs.networks).length;
            const oy = doc.y;
            for (const [network, value] of Object.entries(fs.networks)) {

                console.log('here0 ' + leftPt + ' ' + doc.page.width);

                doc.y = oy;
                doc.x = leftPt;

                console.log('here1');

                doc.fontSize(10);
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.text(_.startCase(network.toLowerCase()));

                console.log('here');


                doc.fontSize(8);
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.x = leftPt;
                doc.text('Max. Velocity: ', {continued: true, lineBreak: false});
                doc.font(DEFAULT_FONT_NAME);
                doc.text(value.velocityMS + ' m/s', );

                console.log('here');

                doc.x = leftPt;
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.text('Spare Capacity: ', {continued: true, lineBreak: false});
                doc.font(DEFAULT_FONT_NAME);
                doc.text(value.spareCapacityPCT + '%', );

                console.log('here');

                doc.x = leftPt;
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.text('Material: ', {continued: true, lineBreak: false});
                console.log('here6 ' + doc.x + ' ' + doc.page.width);
                doc.font(DEFAULT_FONT_NAME);
                doc.text(context.effectiveCatalog.pipes[value.material].name, );

                leftPt += colWidth;
            }

        }
        doc.x = ox;
        doc.y += 10;

        if (i % 4 === 3) {
            doc.x += pageletWidth;
            doc.y = paramContentTop;
        }
        i++;
    }

}

async function drawReportCoverSheet(context: CanvasContext, doc: PDFKit.PDFDocument, options: ExportPdfOptions) {
    doc.addPage({size: [mm2pt(PAPER_SIZES.A4.heightMM), mm2pt(PAPER_SIZES.A4.widthMM)]});
    await drawFooter(doc);
    const generalInfo = context.document.drawing.metadata.generalInfo;
    const calculationParams = context.document.drawing.metadata.calculationParams;
    const flowSystems = context.document.drawing.metadata.flowSystems;


    doc.fontSize(40);
    doc.fillColor('black');
    doc.text(((await getCompanyName(context)) || '').toUpperCase(), {align: "center"});

    doc.y += 100;
    doc.fontSize(30);
    doc.fillColor([47, 84, 150]);
    doc.text(generalInfo.title, {align: "center"});
    doc.fontSize(25);
    doc.fillColor('black');
    if (generalInfo.projectNumber) {
        doc.text('Project No. ' + generalInfo.projectNumber, {align: "center"});
    }

    doc.y += 100;
    doc.fontSize(40);
    doc.fillColor([47, 84, 150]);
    doc.text('Water System Results', {align: "center"});

    doc.y += 70;
    const w = 350;
    const l = (doc.page.width - w) / 2;
    drawGeneralTable(doc, context, 10, w, 10, l, doc.y, true, true);

    const columnYStart = doc.y;
    let cursorY = columnYStart;


    doc.addPage({size: [mm2pt(PAPER_SIZES.A4.heightMM), mm2pt(PAPER_SIZES.A4.widthMM)]});
    await drawFooter(doc);

    doc.lineGap(10);
    doc.fillColor('Black');
    doc.fontSize(25);
    doc.text('Design Parameters');
    doc.fontSize(10);
    if (calculationParams.psdMethod) {
        const ox = doc.x;
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Peak Flow Rate Calculation Method for Loading Units: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text(context.effectiveCatalog.psdStandards[calculationParams.psdMethod].name, {'align': "right"});
    }
    if (calculationParams.dwellingMethod) {
        const ox = doc.x;
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Peak Flow Rate Calculation Method for Dwellings: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text(context.effectiveCatalog.dwellingStandards[calculationParams.dwellingMethod].name, {'align': "right"});
    }

    {
        const oy = doc.y;
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text('Pipe Sizing Method: ');
        doc.y = oy;
        doc.font(DEFAULT_FONT_NAME);
        doc.text( PIPE_SIZING_METHODS.find((m) => m.key === calculationParams.pipeSizingMethod)!.name, {'align': "right"});
    }


    for (const fs of flowSystems) {
        if (doc.y > doc.page.height * 0.8) {
            doc.addPage({size: [mm2pt(PAPER_SIZES.A4.heightMM), mm2pt(PAPER_SIZES.A4.widthMM)]});
            await drawFooter(doc);
        }

        const rgb = hexToRgb(fs.color.hex);
        doc.fontSize(10);
        doc.fillColor(rgb);
        doc.font(DEFAULT_FONT_NAME_BOLD);
        doc.text(fs.name + ' System Properties: ', {underline: true});
        doc.fillColor('black');
        doc.font(DEFAULT_FONT_NAME);
        doc.text('Temperature: ' + fs.temperature);

        const ox = doc.x;
        if (Object.keys(fs.networks)) {
            let leftPt = ox;
            const colWidth = (doc.page.width - ox * 2) / Object.keys(fs.networks).length;
            const oy = doc.y;
            for (const [network, value] of Object.entries(fs.networks)) {

                console.log('here0 ' + leftPt + ' ' + doc.page.width);

                doc.y = oy;
                doc.x = leftPt;

                console.log('here1');

                doc.fontSize(10);
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.text(_.startCase(network.toLowerCase()));

                console.log('here');


                doc.fontSize(8);
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.x = leftPt;
                doc.text('Max. Velocity: ', {continued: true, lineBreak: false});
                doc.font(DEFAULT_FONT_NAME);
                doc.text(value.velocityMS + ' m/s', );

                console.log('here');

                doc.x = leftPt;
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.text('Spare Capacity: ', {continued: true, lineBreak: false});
                doc.font(DEFAULT_FONT_NAME);
                doc.text(value.spareCapacityPCT + '%', );

                console.log('here');

                doc.x = leftPt;
                doc.font(DEFAULT_FONT_NAME_BOLD);
                doc.text('Material: ', {continued: true, lineBreak: false});
                console.log('here6 ' + doc.x + ' ' + doc.page.width);
                doc.font(DEFAULT_FONT_NAME);
                doc.text(context.effectiveCatalog.pipes[value.material].name, );

                leftPt += colWidth;
            }
        }
        doc.x = ox;
        doc.y += 10;
    }

}

function hexToRgb(hex: string): [number, number, number] {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
    ] : [0, 0, 0];
}

export async function exportPdf(context: CanvasContext, viewPort: ViewPort, options: ExportPdfOptions) {
    const {paperSize, scaleName} = options;

    const doc: PDFKit.PDFDocument = new (window as any).PDFDocument({autoFirstPage: false, width: options.paperSize.widthMM, height: options.paperSize.heightMM});
    if (options.coverSheet) {
        await drawCoverSheet(context, doc, options);
    }

    let levelUids = [];
    let fileName: string;
    let dummy = PDFDocument;
    if (options.allLevels) {
        for (const level of context.$store.getters['document/sortedLevels']) {
            levelUids.push(level.uid);
        }
        fileName = context.document.drawing.metadata.generalInfo.title + '.pdf';
    } else {
        let levelString = getLevelName(context, undefined);
        if (context.document.uiState.levelUid) {
            levelString = '-' + context.document.drawing.levels[context.document.uiState.levelUid].name;
        }
        fileName = context.document.drawing.metadata.generalInfo.title + ' - ' + levelString + '.pdf';

        levelUids.push(context.document.uiState.levelUid);
    }

    for (const luid of levelUids.reverse()) {

        const { svg, widthPx, heightPx } = await snapshotToSvg(context, viewPort, options, luid);


        doc.addPage({ size: [mm2pt(paperSize.widthMM), mm2pt(paperSize.heightMM)] });

        const scaled = await scaleSvg(svg, mm2pt((paperSize.widthMM - MARGIN_SIZE_MM * 2 - INFO_BAR_SIZE_MM)) / widthPx);
        SVGtoPDF(doc, scaled, mm2pt(MARGIN_SIZE_MM), mm2pt(MARGIN_SIZE_MM), { assumePt: true });

        doc.strokeColor('black');
        doc.rect(mm2pt(MARGIN_SIZE_MM), mm2pt(MARGIN_SIZE_MM), mm2pt((paperSize.widthMM - MARGIN_SIZE_MM * 2 - INFO_BAR_SIZE_MM)), mm2pt(paperSize.heightMM - MARGIN_SIZE_MM * 2));
        doc.rect(mm2pt((paperSize.widthMM - MARGIN_SIZE_MM - INFO_BAR_SIZE_MM)), mm2pt(MARGIN_SIZE_MM), mm2pt((INFO_BAR_SIZE_MM)), mm2pt(paperSize.heightMM - MARGIN_SIZE_MM * 2));
        doc.stroke();

        await drawTitleBar(doc, context, paperSize, scaleName, luid);

        await drawScale(doc, paperSize, scaleName);
    }

    const stream = doc.pipe(blobstream());
    stream.on('finish', () => {

        const link2 = document.createElement("a");
        const dataBlob = stream.toBlob('application/pdf');

        const objUrl = URL.createObjectURL(dataBlob);
        link2.href = objUrl;
        link2.innerHTML ="With createObjectURL";
        link2.download = fileName;
        link2.click();
    });
    doc.end();


/*
    const link2 = document.createElement("a");
    const dataBlob = new Blob([svg], {type: 'text/plain'});

    const objUrl = URL.createObjectURL(dataBlob);
    link2.href = objUrl;
    link2.innerHTML ="With createObjectURL";
    link2.download = context.document.drawing.metadata.generalInfo.title + '.svg';
    link2.click();*/
}

export interface SVGResult {
    svg: string;
    widthPx: number;
    heightPx: number;
}

export async function snapshotToSvg(context: CanvasContext, viewPort: ViewPort, options: ExportPdfOptions, levelUid: string): Promise<SVGResult> {
    const canvasContext = context;
    const ctx = new C2S.C2S(viewPort.width, viewPort.height);

    const oldLevelUid = canvasContext.document.uiState.levelUid;
    canvasContext.document.uiState.levelUid = levelUid;
    context.hydraulicsLayer.reloadLevel();
    context.calculationLayer.reloadLevel();

    ctx.getTransform = function()  {
        const attr = this.getTransformAttributeChain();
        const m = TM.transform(...TM.fromDefinition(TM.fromTransformAttribute(attr) as TM.MatrixDescriptor[]));
        const s = TM.scale(1, 2);
        return new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]);
    };

    if (options.floorPlans) {
        if (canvasContext.globalStore.entitiesInLevel.has(canvasContext.document.uiState.levelUid!)) {
            for (const euid of canvasContext.globalStore.entitiesInLevel.get(canvasContext.document.uiState.levelUid!)!) {
                const o = canvasContext.globalStore.get(euid)!;
                if (o instanceof BackgroundImage) {
                    await o.ensureHighestResImageIsLoaded();
                }
            }
        }
    }

    await canvasContext.drawFull(ctx as any as CanvasRenderingContext2D, viewPort, true);

    canvasContext.document.uiState.levelUid = oldLevelUid;

    context.hydraulicsLayer.reloadLevel();
    context.calculationLayer.reloadLevel();

    return {
        svg: ctx.getSerializedSvg(),
        widthPx: viewPort.width,
        heightPx: viewPort.height,
    };
}
