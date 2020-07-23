import CanvasContext from "../canvas-context";
import Excel, {Worksheet} from 'exceljs';
import {User} from "../../../../../common/src/models/User";
import blobstream from "blob-stream";
import {Readable} from "stream";
import {PipesBySize, ValveByPipe} from "../../../../../common/src/api/catalog/price-table";
import {isNumeric} from "tslint";


export async function exportBudgetReport(context: CanvasContext) {
    const workbook = new Excel.Workbook();

    initWorkbook(context, workbook);
    createCoverPage(context, workbook);

    const locations = createMasterPage(context, workbook);
    createLevelPages(context, workbook);

    downloadWorkbook(context, workbook);

}

function initWorkbook(context: CanvasContext, workbook: Excel.Workbook) {
    const user = context.$store.getters['profile/profile'] as User;
    workbook.creator = user.name;
    workbook.lastModifiedBy = user.name;
    workbook.created = new Date();
    workbook.modified = new Date();


    workbook.properties.date1904 = true;

    workbook.calcProperties.fullCalcOnLoad = true;
    workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
    ];
}

function createCoverPage(context: CanvasContext, workbook: Excel.Workbook) {
    const user = context.$store.getters['profile/profile'] as User;
    const sheet = workbook.addWorksheet("BOW-Cover");
    sheet.pageSetup.printArea = 'A1:F14';

    const drawing = context.document.drawing;
    createCompanyHeader(context, sheet);

    sheet.mergeCells('A5:F5');
    sheet.getCell('A5').value = 'HYDRAULICS SERVICES BUDGET ESTIMATE';
    sheet.getCell('A5').font = {bold: true};

    sheet.mergeCells('B9:F9');
    sheet.getCell('B9').value = 'SUFFICIENCY OF THIS BUDGET ESTIMATE REPORT';
    sheet.getCell('B9').font = {bold: true};
    sheet.mergeCells('B10:F10');
    sheet.mergeCells('B11:F11');
    sheet.getCell('B11').style = {alignment: {wrapText: true}};
    sheet.getRow(11).height = 120;
    sheet.getCell('B11').value = 'The Budget Estimate document has been prepared to provide high level cost information. Whilst example rates have been provided by H2X, NO GUARANTEES are given or implied by H2X as to the accuracy or correctness of the pricing. It is the Designing Engineers responsibility to update all rates to reflect the correct pricing for the particular region or project.';
    sheet.mergeCells('B12:F12');
    sheet.mergeCells('B13:F13');
    sheet.getRow(13).height = 80;
    sheet.getCell('B13').style = {alignment: {wrapText: true}};
    sheet.getCell('B13').value = 'Once exported from H2X software, this document could be changed in any number of ways. As such, H2X accept no responsibilty for any errors, omissions or anomalies in either description, quantity or pricing.';
}

function createCompanyHeader(context: CanvasContext, sheet: Worksheet) {

    const user = context.$store.getters['profile/profile'] as User;
    const drawing = context.document.drawing;

    sheet.mergeCells('B1:F1');
    sheet.getCell('A1').font = {bold: true};
    sheet.getCell('A1').value = 'Company';
    sheet.getCell('B1').value = user.organization!.name;
    sheet.mergeCells('B2:F2');
    sheet.getCell('A2').font = {bold: true};
    sheet.getCell('A2').value = 'Project Title';
    sheet.getCell('B2').value = drawing.metadata.generalInfo.title;

    if (drawing.metadata.generalInfo.projectNumber) {
        sheet.mergeCells('B3:F3');
        sheet.getCell('A3').font = {bold: true};
        sheet.getCell('A3').value = 'Project #';
        sheet.getCell('B3').value = drawing.metadata.generalInfo.projectNumber;
    }
}

function createLevelPages(context: CanvasContext, workbook: Excel.Workbook) {
    for (const [levelUid, level] of Object.entries(context.document.drawing.levels)) {
        createLevelPage(context, workbook, levelUid);
    }
}

function createLevelPage(context: CanvasContext, workbook: Excel.Workbook, levelUid: string) {
    const level = context.document.drawing.levels[levelUid];
    const sheet = workbook.addWorksheet(level.name);
    createCompanyHeader(context, sheet);

    sheet.getColumn('A').width = 20;
    sheet.getColumn('B').width = 100;
    sheet.getColumn('E').width = 20;
    sheet.getColumn('F').width = 30;

    sheet.getCell('A6').value = 'Export Date';
    sheet.getCell('A6').font = {bold: true};
    sheet.getCell('B6').value = new Date();

    sheet.getCell('A7').value = 'Floor';
    sheet.getCell('A7').font = {bold: true};
    sheet.getCell('A7').value = level.name + " (" + level.abbreviation + ")";
}

function stylizeHeader(cell: Excel.Cell) {
    cell.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FF4A86E8"}};
    cell.font = {color: {argb: "FFFFFFFF"}, bold: true};
}

function stylizeTable(rowFrom: number, rowTo: number, colFrom: string, colTo: string, sheet: Excel.Worksheet) {
    const colNumFrom = colFrom.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    const colNumTo = colTo.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

    for (let row = rowFrom; row <= rowTo; row++) {
        for (let col = colNumFrom; col <= colNumTo; col++) {
            sheet.getCell(row, col).border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                right: {style: 'thin'},
                bottom: {style: 'thin'},
            };
        }
    }
}

// Returns the reference cells for every entry in the price catalog.
function createMasterPage(context: CanvasContext, workbook: Excel.Workbook): Map<string, string> {
    const sheet = workbook.addWorksheet("Master Rates");
    const mapping = new Map<string, string>();
    let row = 1;

    sheet.mergeCells('A' + row + ":E" + row);
    sheet.getCell('A' + row).value = 'PIPES';
    sheet.getCell('A' + row).font = {bold: true};

    // PIPES

    const topRow = row;
    row += 2;
    for (const [material, pipe] of Object.entries(context.effectivePriceTable.Pipes)) {
        const startRow = row;

        sheet.mergeCells('A' + row + ":E" + row);
        sheet.getCell('A' + row).value = material + " - $";
        stylizeHeader(sheet.getCell('A' + row));

        row ++;
        sheet.getCell('A' + row).value = 'Size';
        sheet.getCell('A' + row).font = {bold: true};
        sheet.getCell('B' + row).value = 'Pipe/m';
        sheet.getCell('B' + row).font = {bold: true};
        sheet.getCell('C' + row).value = 'Bend/No.';
        sheet.getCell('C' + row).font = {bold: true};
        sheet.getCell('D' + row).value = 'Tee/No.';
        sheet.getCell('D' + row).font = {bold: true};
        sheet.getCell('E' + row).value = 'Reducer/No.';
        sheet.getCell('E' + row).font = {bold: true};

        row ++;
        for (const [size, entry] of Object.entries(pipe as PipesBySize)) {
            sheet.getCell('A' + row).value = Number(size);

            sheet.getCell('B' + row).value = entry;
            mapping.set(`Pipes.${material}.${size}`, "B" + row);

            sheet.getCell('C' + row).value = context.effectivePriceTable.Fittings.Elbow
                [material as keyof ValveByPipe][Number(size)];
            mapping.set(`Fittings.Elbow.${material}.${size}`, "C" + row);

            sheet.getCell('D' + row).value = context.effectivePriceTable.Fittings.Tee
                [material as keyof ValveByPipe][Number(size)];
            mapping.set(`Fittings.Tee.${material}.${size}`, "C" + row);
            sheet.getCell('E' + row).value = context.effectivePriceTable.Fittings.Reducer
                [material as keyof ValveByPipe][Number(size)];
            mapping.set(`Fittings.Reducer.${material}.${size}`, "C" + row);
            row ++;
        }
        stylizeTable(startRow, row - 1, 'A', 'E', sheet);

        row ++;

    }

    // Valves
    sheet.mergeCells('G1:H1');
    sheet.getCell('G1').font = {bold: true};
    sheet.getCell('G1').value = 'VALVES';

    row = topRow + 2;
    for (const [valveName, valve] of Object.entries(context.effectivePriceTable.Valves)) {
        const startRow = row;
        sheet.mergeCells('G' + row + ":H" + row);
        sheet.getCell('G' + row).value = valveName + " - $";
        stylizeHeader(sheet.getCell('G' + row));


        row ++;
        sheet.getCell('G' + row).value = 'Size';
        sheet.getCell('G' + row).font = {bold: true};
        sheet.getCell('H' + row).value = '$/Unit';
        sheet.getCell('H' + row).font = {bold: true};

        row ++;
        for (const [size, entry] of Object.entries(valve as {[key: number]: number})) {
            sheet.getCell('G' + row).value = Number(size);

            sheet.getCell('H' + row).value = entry;
            mapping.set(`Valves.${valveName}.${size}`, "H" + row);
            row ++;
        }
        stylizeTable(startRow, row - 1, 'G', 'H', sheet);
        row++;
    }


    // FIXTURES
    sheet.mergeCells('J1:K1');
    sheet.getCell('J1').font = {bold: true};
    sheet.getCell('J1').value = 'FIXTURES';

    row = topRow + 2;
    {
        const startRow = row;

        sheet.mergeCells('J' + row + ":K" + row);
        sheet.getCell('J' + row).value = "Fixtures" + " - $";
        stylizeHeader(sheet.getCell('J' + row));

        row++;
        sheet.getCell('J' + row).value = 'Type';
        sheet.getCell('J' + row).font = {bold: true};
        sheet.getCell('K' + row).value = '$/Unit';
        sheet.getCell('K' + row).font = {bold: true};

        row++;
        for (const [fixture, cost] of Object.entries(context.effectivePriceTable.Fixtures)) {
            sheet.getCell('J' + row).value = fixture;
            sheet.getCell('K' + row).value = cost;
            mapping.set(`Fixtures.${fixture}`, 'K' + row);
            row++;
        }
        stylizeTable(startRow, row - 1, 'J', 'K', sheet);

    }

    // EQUIPMENT

    sheet.mergeCells('M1:N1');
    sheet.getCell('M1').font = {bold: true};
    sheet.getCell('M1').value = 'EQUIPMENT';
    row = topRow + 2;
    for (const [equipment, table] of Object.entries(context.effectivePriceTable.Equipment)) {
        const startRow = row;
        if (isNumeric(table)) {
            // single
            sheet.mergeCells('M' + row + ":N" + row);
            sheet.getCell('M' + row).value = equipment + " - $";
            stylizeHeader(sheet.getCell('M' + row));

            row ++;
            sheet.getCell('M' + row).value = 'Size';
            sheet.getCell('M' + row).font = {bold: true};
            sheet.getCell('N' + row).value = '$/Unit';
            sheet.getCell('N' + row).font = {bold: true};

            row ++;
            sheet.getCell('M' + row).value = 'All';
            sheet.getCell('N' + row).value = table;

            mapping.set(`Equipment.${equipment}`, 'N' + row);

            row ++;
        } else {
            // by price
            sheet.mergeCells('M' + row + ":N" + row);
            sheet.getCell('M' + row).value = equipment + " - $";
            stylizeHeader(sheet.getCell('M' + row));

            row ++;
            sheet.getCell('M' + row).value = 'Size';
            sheet.getCell('M' + row).font = {bold: true};
            sheet.getCell('N' + row).value = '$/Unit';
            sheet.getCell('N' + row).font = {bold: true};

            row ++;
            for (const [size, entry] of Object.entries(table)) {
                sheet.getCell('M' + row).value = Number(size);
                sheet.getCell('N' + row).value = entry as string;
                mapping.set(`Equipment.${equipment}.${size}`, 'N' + row);
                row++;
            }
        }
        stylizeTable(startRow, row - 1, 'M', 'N', sheet);
        row ++;
    }

    // NODES
    sheet.mergeCells('P1:Q1');
    sheet.getCell('P1').font = {bold: true};
    sheet.getCell('P1').value = 'NODES';

    row = topRow + 2;

    {
        const startRow = row;

        sheet.mergeCells('P' + row + ":Q" + row);
        sheet.getCell('P' + row).value = "Nodes" + " - $";
        stylizeHeader(sheet.getCell('P' + row));

        row ++;
        sheet.getCell('P' + row).value = 'Type';
        sheet.getCell('P' + row).font = {bold: true};
        sheet.getCell('Q' + row).value = '$/Unit';
        sheet.getCell('Q' + row).font = {bold: true};

        row ++;
        for (const [node, cost] of Object.entries(context.effectivePriceTable.Node)) {
            sheet.getCell('P' + row).value = node;
            sheet.getCell('Q' + row).value = cost;
            mapping.set(`Node.${node}`, 'Q' + row);
            row ++;
        }
        stylizeTable(startRow, row - 1, 'P', 'Q', sheet);
    }

    // Plants
    sheet.mergeCells('S1:T1');
    sheet.getCell('S1').font = {bold: true};
    sheet.getCell('S1').value = 'PLANTS';

    row = topRow + 2;
    {
        const startRow = row;
        sheet.mergeCells('S' + row + ":T" + row);
        sheet.getCell('S' + row).value = "Plants" + " - $";
        stylizeHeader(sheet.getCell('S' + row));

        row ++;
        sheet.getCell('S' + row).value = 'Type';
        sheet.getCell('S' + row).font = {bold: true};
        sheet.getCell('T' + row).value = '$/Unit';
        sheet.getCell('T' + row).font = {bold: true};

        row ++;
        for (const [plant, cost] of Object.entries(context.effectivePriceTable.Plants)) {
            sheet.getCell('S' + row).value = plant;
            sheet.getCell('T' + row).value = cost;
            mapping.set(`Plants.${plant}`, 'S' + row);
            row ++;
        }
        stylizeTable(startRow, row - 1, 'S', 'T', sheet);
    }

    // Insulation
    sheet.mergeCells('V1:W1');
    sheet.getCell('V1').font = {bold: true};
    sheet.getCell('V1').value = 'INSULATION';

    row = topRow + 2;

    {
        const startRow = row;
        sheet.mergeCells('V' + row + ":W" + row);
        sheet.getCell('V' + row).value = "Insulation" + " - $";
        stylizeHeader(sheet.getCell('V' + row));

        row ++;
        sheet.getCell('V' + row).value = 'Size';
        sheet.getCell('V' + row).font = {bold: true};
        sheet.getCell('W' + row).value = '$/m';
        sheet.getCell('W' + row).font = {bold: true};

        row ++;
        for (const [size, cost] of Object.entries(context.effectivePriceTable.Insulation)) {
            sheet.getCell('V' + row).value = Number(size);
            sheet.getCell('W' + row).value = cost;
            mapping.set(`Insulation.${size}`, 'W' + row);
            row ++;
        }
        stylizeTable(startRow, row - 1, 'V', 'W', sheet);
    }


    // Lingering formatting
    sheet.getColumn('J').width = 25;
    sheet.getColumn('P').width = 25;
    sheet.getColumn('S').width = 25;

    console.log(mapping);
    return mapping;
}

async function downloadWorkbook(context: CanvasContext, workbook: Excel.Workbook) {
    const buffer = await workbook.xlsx.writeBuffer();

    const link2 = document.createElement("a");
    const dataBlob = new Blob([new Uint8Array(buffer, 0, buffer.byteLength)]);

    const objUrl = URL.createObjectURL(dataBlob);
    link2.href = objUrl;
    link2.innerHTML = "With createObjectURL";
    link2.download = context.document.drawing.metadata.generalInfo.title + " - Schedule of Components.xlsx";
    link2.click();
}
