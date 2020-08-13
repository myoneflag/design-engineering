import CanvasContext from "../canvas-context";
import Excel, {Worksheet} from 'exceljs';
import {User} from "../../../../../common/src/models/User";
import {
    EquipmentTable,
    FittingsTable, getEquipmentFullName,
    PipesBySize,
    PipesTable, PlantTable,
    ValveByPipe,
    ValvesTable
} from "../../../../../common/src/api/catalog/price-table";
import {isNumeric} from "tslint";
import {defaultPriceTable} from "../../../../../common/src/api/catalog/default-price-table";
import {isCalculated} from "../../../store/document/calculations";
import {EntityType} from "../../../../../common/src/api/document/entities/types";
import {assertUnreachable, StandardFlowSystemUids} from "../../../../../common/src/api/config";
import {determineConnectableSystemUid} from "../../../store/document/entities/lib";
import {lowerCase} from "../../../../../common/src/lib/utils";
import {BigValveType} from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";

export const MONEY_FMT = '$#,##0.00;-#,##0.00';

export async function exportBudgetReport(context: CanvasContext) {
    const workbook = new Excel.Workbook();

    initWorkbook(context, workbook);
    createCoverPage(context, workbook);

    const mappings = createMasterPage(context, workbook);
    console.log(mappings);
    createLevelPages(context, workbook, mappings)
    createLevelPage(context, workbook, mappings, null);

    // "Move" the master page to the end
    workbook.removeWorksheet(2);
    createMasterPage(context, workbook);

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

function createLevelPages(context: CanvasContext, workbook: Excel.Workbook, mappings: Map<string, [string, number]>) {
    for (const [levelUid, level] of Object.entries(context.document.drawing.levels)) {
        createLevelPage(context, workbook, mappings, levelUid);
    }
}

function stylizeMajorSection(cell: Excel.Cell) {
    cell.font = {color: {argb: "FF2F75B5"}, bold: true};
}

function stylizeMinorSection(cell: Excel.Cell) {
    cell.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FF4A86E8"}};
    cell.font = {color: {argb: "FFFFFFFF"}, bold: true};
    cell.alignment = {horizontal: "center"};
}

function stylizeSubsection(cell: Excel.Cell | Excel.Row) {
    cell.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FF666666"}};
    cell.font = {color: {argb: "FFFFFFFF"}, bold: true};
    cell.alignment = {horizontal: "center"};
}

function stylizeSubsectionRow(row: Excel.Row) {
    row.font = {bold: true};
    for (let i = 1; i <= 6; i++) {
        row.getCell(i).fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FFBBBBBB"}};
    }
}

function stylizeTitle(cell: Excel.Cell) {
    cell.alignment = {horizontal: "center"};
    cell.worksheet.getRow(Number(cell.row)).font = {bold: true}
}

function stylizeCaption(cell: Excel.Cell | Excel.Row) {
    cell.font = {bold: true, italic: true};
    cell.alignment = {horizontal: "center"};
}



function getPriceQuantities(context: CanvasContext, levelUid: string | null) {
    const result = new Map<string, number>();
    const entities = levelUid ? context.document.drawing.levels[levelUid].entities :
        context.document.drawing.shared;

    for (const entity of Object.values(entities)) {
        if (isCalculated(entity)) {
            const o = context.globalStore.getOrCreateCalculation(entity);

            if (o.costBreakdown) {
                for (const {qty, path} of o.costBreakdown) {
                    if (!result.has(path)) {
                        result.set(path, 0);
                    }
                    result.set(path, result.get(path)! + qty);
                }
            }
        }
    }
    return result;
}

function getPriceQuantitiesForSystem(context: CanvasContext, levelUid: string | null, systemUid: string): Map<string, number> {
    const result = new Map<string, number>();
    const entities = levelUid ? context.document.drawing.levels[levelUid].entities :
        context.document.drawing.shared;

    for (const entity of Object.values(entities)) {
        if (isCalculated(entity)) {
            const o = context.globalStore.getOrCreateCalculation(entity);
            let thisSystemUid: string | null = null;
            switch (entity.type) {
                case EntityType.FITTING:
                case EntityType.PIPE:
                    thisSystemUid = entity.systemUid;
                    break;
                case EntityType.BIG_VALVE:
                    if (entity.valve.type === BigValveType.RPZD_HOT_COLD) {
                        // Special case. There's a cold and hot RPZD here. Handle it specifically here and then skip the
                        // general handler.
                        if (systemUid === StandardFlowSystemUids.ColdWater && o.costBreakdown) {
                            const {qty, path} = o.costBreakdown[0];
                            if (!result.has(path)) {
                                result.set(path, 0);
                            }
                            result.set(path, result.get(path)! + qty);
                        } else if (systemUid === StandardFlowSystemUids.HotWater && o.costBreakdown) {

                            const {qty, path} = o.costBreakdown[1];
                            if (!result.has(path)) {
                                result.set(path, 0);
                            }
                            result.set(path, result.get(path)! + qty);
                        }
                    } else {
                        thisSystemUid = StandardFlowSystemUids.WarmWater;
                    }
                    break;
                case EntityType.DIRECTED_VALVE:
                    thisSystemUid = determineConnectableSystemUid(context.globalStore, entity) || null;
                    break;
                case EntityType.PLANT:
                    thisSystemUid = entity.outletSystemUid;
                    break;
                case EntityType.RISER:
                    thisSystemUid = entity.systemUid;
                    break;
                case EntityType.GAS_APPLIANCE:
                case EntityType.SYSTEM_NODE:
                case EntityType.FIXTURE:
                case EntityType.LOAD_NODE:
                case EntityType.FLOW_SOURCE:
                    break;
                default:
                    assertUnreachable(entity);
            }

            if (o.costBreakdown && thisSystemUid === systemUid) {
                for (const {qty, path} of o.costBreakdown) {
                    if (!result.has(path)) {
                        result.set(path, 0);
                    }
                    result.set(path, result.get(path)! + qty);
                }
            }
        }
    }
    return result;
}

function createLevelPage(context: CanvasContext, workbook: Excel.Workbook, mappings: Map<string, [string, number]>, levelUid: string | null) {
    const quantities = getPriceQuantities(context, levelUid);
    let totalCost = 0;
    let roofHeight = 0;
    if (levelUid) {
        roofHeight = context.document.drawing.levels[levelUid].floorHeightM + 3;
    }

    let levelFullTitle = 'Inter-level components';
    let levelTitle = 'Inter-level';
    if (levelUid) {
        const level = context.document.drawing.levels[levelUid];
        levelFullTitle = level.name + " (" + level.abbreviation + ")";
        levelTitle = level.name;
    }

    const sheet = workbook.addWorksheet(levelTitle, {});
    createCompanyHeader(context, sheet);

    sheet.getColumn('A').width = 15;
    sheet.getColumn('B').width = 50;
    sheet.getColumn('E').width = 15;
    sheet.getColumn('F').width = 15;

    sheet.getCell('A6').value = 'Export Date';
    sheet.getCell('A6').font = {bold: true};
    sheet.getCell('B6').value = new Date();

    sheet.getCell('A7').value = 'Floor';
    sheet.getCell('A7').font = {bold: true};
    sheet.getCell('B7').value = levelFullTitle;

    sheet.getColumn('E').numFmt = MONEY_FMT;
    sheet.getColumn('F').numFmt = MONEY_FMT;

    for (let col = 1; col <= 6; col++) {
        sheet.mergeCells([9, col, 11, col]);
        stylizeHeader(sheet.getCell(9, col));
    }
    sheet.getCell('A9').value = 'Code';
    sheet.getCell('B9').value = 'Item Description';
    sheet.getCell('C9').value = 'Unit';
    sheet.getCell('D9').value = 'Qty';
    sheet.getCell('E9').value = 'Rate $';
    sheet.getCell('F9').value = 'Cost $';

    stylizeTable(9, 11, 'A', 'F', sheet);

    let row = 13;
    stylizeMajorSection(sheet.getCell('A' + row));
    stylizeMajorSection(sheet.getCell('B' + row));
    sheet.getCell('A' + row).value = '100';
    sheet.getCell('B' + row).value = 'HYDRAULICS SERVICES';

    row += 2;
    for (let i = 1; i <= 6; i++) {
        stylizeHeader(sheet.getCell( row, i));
    }
    let majorItem = 101;
    sheet.getCell('A' + row).value = '' + majorItem;
    sheet.getCell('B' + row).value = 'SANITARY FITMENTS';
    let lastMinorBump = row;
    let lastMajorBump = row;
    let lastSectionBump = row;

    let minorSum = 0;
    let majorSum = 0;
    let sectionSum = 0;

    row ++;
    sheet.getCell('B' + row).value = "SUPPLY AND INSTALL";
    stylizeCaption(sheet.getCell('B' + row));
    row += 2;

    // FIXTURES
    let minorItem = 1;
    for (const fixture of Object.keys(defaultPriceTable.Fixtures)) {
        if (quantities.has(`Fixtures.${fixture}`)) {
            const quantity = quantities.get(`Fixtures.${fixture}`)!;
            sheet.getCell('A' + row).value = '' + majorItem + '.' + minorItem;
            sheet.getCell('B' + row).value = fixture;
            sheet.getCell('C' + row).value = 'No';
            sheet.getCell('D' + row).value = quantity;
            const [loc, cost] = mappings.get(`Fixtures.${fixture}`)!;
            totalCost += cost * quantity;
            minorSum += cost * quantity;
            majorSum += cost * quantity;
            sectionSum += cost * quantity;
            sheet.getCell('E' + row).value = {formula: `'Master Rates'!${loc}`, result: cost, date1904: true};
            sheet.getCell('F' + row).value = {formula: `D${row} * E${row}`, result: cost * quantity, date1904: true};
            row ++;
        }
        minorItem ++;
    }

    sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMajorBump + 1}:F${row})`, result: majorSum, date1904: false};

    let patch = 1;
    // Water supplies
    for (const flowSystem of context.document.drawing.metadata.flowSystems) {
        const systemUid = flowSystem.uid;
        const items = getPriceQuantitiesForSystem(context, levelUid, systemUid);

        if (items.size === 0) {
            continue;
        }

        majorItem++;
        minorItem = 1;
        row += 2;

        majorSum = 0;
        minorSum = 0;
        sectionSum = 0;
        lastMinorBump = row;
        lastMajorBump = row;
        lastSectionBump = row;
        sheet.getCell('A' + row).value = majorItem;
        sheet.getCell('B' + row).value = flowSystem.name.toUpperCase() + " SUPPLY";
        for (let i = 1; i <= 6; i++) {
            stylizeHeader(sheet.getCell( row, i));
        }

        row += 2;

        // Pipe material specific entities =============== (pipes, fittings)
        for (const [material, pipe] of Object.entries(context.effectivePriceTable.Pipes)) {
            // check for existence first
            let pipeExists = false;

            let elbowExists = false;
            let teeExists = false;
            let reducersExist = false;
            for (const [size, cost] of Object.entries(pipe)) {
                if (items.has(`Pipes.${material}.${size}`)) {
                    pipeExists = true;
                }
            }
            for (const [size, cost] of Object.entries(context.effectivePriceTable.Fittings.Tee[material as keyof ValveByPipe])) {
                if (items.has(`Fittings.Tee.${material}.${size}`)) {
                    teeExists = true;
                }
            }
            for (const [size, cost] of Object.entries(context.effectivePriceTable.Fittings.Elbow[material as keyof ValveByPipe])) {
                if (items.has(`Fittings.Elbow.${material}.${size}`)) {
                    elbowExists = true;
                }
            }
            for (const [size, cost] of Object.entries(context.effectivePriceTable.Fittings.Reducer[material as keyof ValveByPipe])) {
                if (items.has(`Fittings.Reducer.${material}.${size}`)) {
                    reducersExist = true;
                }
            }

            if (pipeExists || elbowExists || teeExists || reducersExist) {
                row ++;
                sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                sheet.getCell('B' + row).value = material;
                stylizeSubsectionRow(sheet.getRow(row));
                stylizeSubsection(sheet.getCell(row, 2));
                majorSum = minorSum = 0;
                lastMajorBump = row;
                row ++;
                sheet.getCell('B' + row).value = 'Supply and Install';
                stylizeCaption(sheet.getCell('B' + row));
                row += 2;
            }

            if (pipeExists) {
                sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                sheet.getCell('B' + row).value = 'Pipework';
                stylizeTitle(sheet.getCell('A' + row));
                stylizeTitle(sheet.getCell('B' + row));
                lastMinorBump = row;
                row += 2;
            }
            for (const [size, _] of Object.entries(context.effectivePriceTable.Pipes[material as keyof PipesTable])) {
                if (items.has(`Pipes.${material}.${size}`)) {
                    sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
                    if (roofHeight >= 0) {
                        sheet.getCell('B' + row).value = `${size}mm diameter - Above ground ${lowerCase(material)} pipework including joints and supports as specification`;
                    } else {
                        sheet.getCell('B' + row).value = `${size}mm diameter - Below ground ${lowerCase(material)} pipework including joints and supports as specification`;
                    }
                    sheet.getCell('C' + row).value = 'm';
                    const quantity = items.get(`Pipes.${material}.${size}`)!;
                    sheet.getCell('D' + row).value = quantity;
                    const [loc, cost] = mappings.get(`Pipes.${material}.${size}`)!;
                    totalCost += cost * quantity;
                    minorSum += cost * quantity;
                    majorSum += cost * quantity;
                    sectionSum += cost * quantity;
                    sheet.getCell('E' + row).value = {formula: `'Master Rates'!${loc}`, result: cost, date1904: true};
                    sheet.getCell('F' + row).value = {formula: `D${row} * E${row}`, result: cost * quantity, date1904: true};
                    sheet.getRow(row).height = 30;
                    sheet.getCell('B' + row).style = {alignment: {wrapText: true}};

                    row++;
                }
                patch ++;
            }
            if (pipeExists) {
                sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMinorBump + 1}:F${row})`, result: minorSum, date1904: true};
                row ++;
            }

            for (const [fitting, exists] of [['Tee', teeExists], ['Elbow', elbowExists], ['Reducer', reducersExist]]) {
                if (exists) {
                    sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                    sheet.getCell('B' + row).value = fitting.toString() + "s";
                    stylizeTitle(sheet.getCell('A' + row));
                    stylizeTitle(sheet.getCell('B' + row));
                    minorSum = 0;
                    lastMinorBump = row;
                    row += 2;
                }
                for (const [size, _] of Object.entries(context.effectivePriceTable.Fittings
                    [fitting as keyof FittingsTable][material as keyof ValveByPipe]))
                {
                    if (items.has(`Fittings.${fitting}.${material}.${size}`)) {
                        sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
                        sheet.getCell('B' + row).value = `${size}mm ${lowerCase(material)} ${fitting}`;

                        sheet.getCell('C' + row).value = 'No';
                        const quantity = items.get(`Fittings.${fitting}.${material}.${size}`)!;
                        sheet.getCell('D' + row).value = quantity;
                        const [loc, cost] = mappings.get(`Fittings.${fitting}.${material}.${size}`)!;
                        totalCost += cost * quantity;
                        minorSum += cost * quantity;
                        majorSum += cost * quantity;
                        sectionSum += cost * quantity;
                        sheet.getCell('E' + row).value = {formula: `'Master Rates'!${loc}`, result: cost, date1904: true};
                        sheet.getCell('F' + row).value = {formula: `D${row} * E${row}`, result: cost * quantity, date1904: true};
                        row++;
                    }
                    patch ++;
                }
                if (exists) {
                    sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMinorBump + 1}:F${row})`, result: minorSum, date1904: true};
                    row ++;
                }
            }

            minorItem ++;
            patch = 1;
            if (pipeExists || elbowExists || teeExists || reducersExist) {
                sheet.getCell(`F${lastMajorBump}`).value = {formula: `SUBTOTAL(9, F${lastMajorBump + 1}:F${row})`, result: majorSum, date1904: true};
            }
        }

        {
            // Valves
            const exists = new Set<keyof ValvesTable>();
            for (const [valveType, valve] of Object.entries(context.effectivePriceTable.Valves)) {
                for (const [size, cost] of Object.entries(valve)) {
                    if (items.has(`Valves.${valveType}.${size}`)) {
                        exists.add(valveType as keyof ValvesTable);
                    }
                }
            }

            if (exists.size > 0) {
                row++;
                sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                sheet.getCell('B' + row).value = "VALVES AND ANCILLARIES";
                lastMajorBump = row;
                majorSum = minorSum = 0;
                stylizeSubsectionRow(sheet.getRow(row));
                stylizeSubsection(sheet.getCell(row, 2));

                row += 2;
            }

            for (const [valveType, valve] of Object.entries(context.effectivePriceTable.Valves)) {
                if (exists.has(valveType as keyof ValvesTable)) {
                    sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                    sheet.getCell('B' + row).value = valveType.toString() + "s";
                    lastMinorBump = row;
                    stylizeTitle(sheet.getCell('A' + row));
                    stylizeTitle(sheet.getCell('B' + row));
                    row += 2;
                }
                for (const [size, cost] of Object.entries(valve)) {
                    if (items.has(`Valves.${valveType}.${size}`)) {
                        sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
                        sheet.getCell('B' + row).value = `${size}mm ${valveType}`;

                        sheet.getCell('C' + row).value = 'No';
                        const quantity = items.get(`Valves.${valveType}.${size}`)!;
                        sheet.getCell('D' + row).value = quantity;
                        const [loc, cost] = mappings.get(`Valves.${valveType}.${size}`)!;
                        totalCost += cost * quantity;
                        minorSum += cost * quantity;
                        majorSum += cost * quantity;
                        sectionSum += cost * quantity;
                        sheet.getCell('E' + row).value = {
                            formula: `'Master Rates'!${loc}`,
                            result: cost,
                            date1904: true
                        };
                        sheet.getCell('F' + row).value = {
                            formula: `D${row} * E${row}`,
                            result: cost * quantity,
                            date1904: true
                        };
                        row++;
                    }
                }
                if (exists.has(valveType as keyof ValvesTable)) {
                    sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMinorBump + 1}:F${row})`, result: minorSum, date1904: true};
                    row++;
                }
                patch ++;
            }

            if (exists.size > 0) {
                sheet.getCell(`F${lastMajorBump}`).value = {formula: `SUBTOTAL(9, F${lastMajorBump + 1}:F${row})`, result: majorSum, date1904: true};
            }

            minorItem ++;
            patch = 1;
        }

        {
            const exists = new Set<keyof (EquipmentTable & PlantTable & {'Insulation': any})>();
            let plantsExist = false;
            for (const [equipmentName, equipment] of Object.entries(context.effectivePriceTable.Equipment)) {
                if (typeof equipment === 'object') {
                    for (const [size, cost] of Object.entries(equipment)) {
                        if (items.has(`Equipment.${equipmentName}.${size}`)) {
                            exists.add(equipmentName as keyof EquipmentTable);
                        }
                    }
                } else {
                    if (items.has(`Equipment.${equipmentName}`)) {
                        exists.add(equipmentName as keyof EquipmentTable);
                    }
                }
            }
            for (const [plantName, plant] of Object.entries(context.effectivePriceTable.Plants)) {
                if (items.has(`Plants.${plantName}`)) {
                    exists.add(plantName as keyof PlantTable);
                    plantsExist = true;
                }
            }
            for (const [size, cost] of Object.entries(context.effectivePriceTable.Insulation)) {
                if (items.has(`Insulation.${size}`)) {
                    exists.add(`Insulation`);
                }
            }

            if (exists.size > 0) {
                row++;
                sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                sheet.getCell('B' + row).value = "PLANTS AND EQUIPMENT";
                lastMajorBump = row;
                majorSum = 0;
                stylizeSubsectionRow(sheet.getRow(row));
                stylizeSubsection(sheet.getCell(row, 2));
                row += 2;
            }

            for (const [equipmentName, equipment] of Object.entries(context.effectivePriceTable.Equipment)) {
                if (exists.has(equipmentName as keyof EquipmentTable)) {
                    sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                    sheet.getCell('B' + row).value = getEquipmentFullName(equipmentName as keyof EquipmentTable);
                    lastMinorBump = row;
                    minorSum = 0;
                    stylizeTitle(sheet.getCell('A' + row));
                    stylizeTitle(sheet.getCell('B' + row));
                    row += 2;

                }

                if (typeof equipment !== 'object') {
                    if (items.has(`Equipment.${equipmentName}`)) {
                        sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
                        sheet.getCell('B' + row).value = `${equipmentName} - All sizes`;

                        sheet.getCell('C' + row).value = 'No';
                        const quantity = items.get(`Equipment.${equipmentName}`)!;
                        sheet.getCell('D' + row).value = quantity;
                        const [loc, cost] = mappings.get(`Equipment.${equipmentName}`)!;
                        totalCost += cost * quantity;
                        minorSum += cost * quantity;
                        majorSum += cost * quantity;
                        sectionSum += cost * quantity;
                        sheet.getCell('E' + row).value = {
                            formula: `'Master Rates'!${loc}`,
                            result: cost,
                            date1904: true
                        };
                        sheet.getCell('F' + row).value = {
                            formula: `D${row} * E${row}`,
                            result: cost * quantity,
                            date1904: true
                        };
                        row++;
                    }
                    patch++;
                } else {
                    for (const [size, cost] of Object.entries(equipment)) {
                        if (items.has(`Equipment.${equipmentName}.${size}`)) {
                            sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
                            sheet.getCell('B' + row).value = `${size}mm diameter ${equipmentName}`;

                            sheet.getCell('C' + row).value = 'No';
                            const quantity = items.get(`Equipment.${equipmentName}.${size}`)!;
                            sheet.getCell('D' + row).value = quantity;
                            const [loc, cost] = mappings.get(`Equipment.${equipmentName}.${size}`)!;
                            totalCost += cost * quantity;
                            minorSum += cost * quantity;
                            majorSum += cost * quantity;
                            sectionSum += cost * quantity;
                            sheet.getCell('E' + row).value = {
                                formula: `'Master Rates'!${loc}`,
                                result: cost,
                                date1904: true
                            };
                            sheet.getCell('F' + row).value = {
                                formula: `D${row} * E${row}`,
                                result: cost * quantity,
                                date1904: true
                            };
                            row++;
                        }
                        patch++;
                    }
                }
                if (exists.has(equipmentName as keyof EquipmentTable)) {
                    sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMinorBump + 1}:F${row})`, result: minorSum, date1904: true};
                    row++;
                }
                minorItem ++;
                patch = 1;
            }

            if (exists.size > 0) {
                sheet.getCell(`F${lastMajorBump}`).value = {formula: `SUBTOTAL(9, F${lastMajorBump + 1}:F${row})`, result: majorSum, date1904: true};
            }


            // Insulation
            if (exists.has('Insulation')) {
                sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                sheet.getCell('B' + row).value = 'Pipework Insulation';
                lastMinorBump = row;
                minorSum = 0;
                stylizeTitle(sheet.getCell('A' + row));
                stylizeTitle(sheet.getCell('B' + row));
                row += 2;
            }
            for (const [size, cost] of Object.entries(context.effectivePriceTable.Insulation)) {
                if (items.has(`Insulation.${size}`)) {
                    sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
                    sheet.getCell('B' + row).value = `${size}mm diameter - Pipework Insulation`;

                    sheet.getCell('C' + row).value = 'm';
                    const quantity = items.get(`Insulation.${size}`)!;
                    sheet.getCell('D' + row).value = quantity;
                    const [loc, cost] = mappings.get(`Insulation.${size}`)!;
                    totalCost += cost * quantity;
                    minorSum += cost * quantity;
                    majorSum += cost * quantity;
                    sectionSum += cost * quantity;
                    sheet.getCell('E' + row).value = {
                        formula: `'Master Rates'!${loc}`,
                        result: cost,
                        date1904: true
                    };
                    sheet.getCell('F' + row).value = {
                        formula: `D${row} * E${row}`,
                        result: cost * quantity,
                        date1904: true
                    };
                    row++;
                }
                patch++;
            }
            minorItem++;
            patch = 1;
            if (exists.has('Insulation')) {
                sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMinorBump + 1}:F${row})`, result: minorSum, date1904: true};
                row ++;
            }

            // PLANTS ==========
            if (plantsExist) {
                sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
                sheet.getCell('B' + row).value = 'Plants';
                lastMinorBump = row;
                minorSum = 0;
                stylizeTitle(sheet.getCell('A' + row));
                stylizeTitle(sheet.getCell('B' + row));
                row += 2;
            }
            for (const [plantName, plant] of Object.entries(context.effectivePriceTable.Plants)) {
                if (items.has(`Plants.${plantName}`)) {
                    sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
                    sheet.getCell('B' + row).value = `${plantName}`;

                    sheet.getCell('C' + row).value = 'No';
                    const quantity = items.get(`Plants.${plantName}`)!;
                    sheet.getCell('D' + row).value = quantity;
                    const [loc, cost] = mappings.get(`Plants.${plantName}`)!;
                    totalCost += cost * quantity;
                    minorSum += cost * quantity;
                    majorSum += cost * quantity;
                    sectionSum += cost * quantity;
                    sheet.getCell('E' + row).value = {
                        formula: `'Master Rates'!${loc}`,
                        result: cost,
                        date1904: true
                    };
                    sheet.getCell('F' + row).value = {
                        formula: `D${row} * E${row}`,
                        result: cost * quantity,
                        date1904: true
                    };
                    row++;
                }
                patch ++;
            }

            if (exists.size > 0) {
                sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMinorBump + 1}:F${row})`, result: minorSum, date1904: true};
                row += 2;
            }

        }

        sheet.getCell(`F${lastSectionBump}`).value = {formula: `SUBTOTAL(9, F${lastSectionBump + 1}:F${row})`, result: sectionSum, date1904: true};
    }

    majorItem ++;
    minorItem = 1;
    patch = 1;

    // Load Nodes
    let hasLoadNode = false;
    for (const [nodeName, cost] of Object.entries(context.effectivePriceTable.Node)) {
        if (quantities.has(`Node.${nodeName}`)) {
            hasLoadNode = true;
        }
    }
    if (hasLoadNode) {

        sheet.getCell('A' + row).value = majorItem;
        sheet.getCell('B' + row).value = "OTHER";
        lastMajorBump = row;
        majorSum = minorSum = 0;
        for (let i = 1; i <= 6; i++) {
            stylizeHeader(sheet.getCell( row, i));
        }
        row++;
        row++;

        sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
        sheet.getCell('B' + row).value = "NODES";
        lastMinorBump = row;
        minorSum = 0;
        stylizeSubsectionRow(sheet.getRow(row));
        stylizeSubsection(sheet.getCell(row, 2));
        row += 2;
    }
    for (const [nodeName, cost] of Object.entries(context.effectivePriceTable.Node)) {
        if (quantities.has(`Node.${nodeName}`)) {
            sheet.getCell('A' + row).value = `${majorItem}.${minorItem}.${patch}`;
            sheet.getCell('B' + row).value = `${nodeName}`;

            sheet.getCell('C' + row).value = 'No';
            const quantity = quantities.get(`Node.${nodeName}`)!;
            sheet.getCell('D' + row).value = quantity;
            const [loc, cost] = mappings.get(`Node.${nodeName}`)!;
            totalCost += cost * quantity;
            minorSum += cost * quantity;
            majorSum += cost * quantity;
            sectionSum += cost * quantity;
            sheet.getCell('E' + row).value = {
                formula: `'Master Rates'!${loc}`,
                result: cost,
                date1904: true
            };
            sheet.getCell('F' + row).value = {
                formula: `D${row} * E${row}`,
                result: cost * quantity,
                date1904: true
            };
            row++;
        }
        patch ++;
    }

    if (hasLoadNode) {
        sheet.getCell(`F${lastMinorBump}`).value = {formula: `SUBTOTAL(9, F${lastMinorBump + 1}:F${row})`, result: minorSum, date1904: true};
        row += 2;
    }
    sheet.getCell(`F${lastMajorBump}`).value = {formula: `SUBTOTAL(9, F${lastMajorBump + 1}:F${row})`, result: majorSum, date1904: true};

    // Preliminaries
    majorItem ++;
    minorItem = patch = 1;
    sheet.getCell('A' + row).value = majorItem;
    sheet.getCell('B' + row).value = "PRELIMINARIES & MARGIN";
    lastMajorBump = row;
    majorSum = minorSum = 0;
    for (let i = 1; i <= 6; i++) {
        stylizeHeader(sheet.getCell( row, i));
    }
    row++;
    row++;

    sheet.getCell('A' + row).value = `${majorItem}.${minorItem}`;
    sheet.getCell('B' + row).value = `Preliminaries, Overheads & Profit`;

    sheet.getCell('C' + row).value = 'No';
    sheet.getCell('D' + row).value = '.15';
    sheet.getCell('D' + row).numFmt = "0.00%";
    sheet.getCell('E' + row).value = {formula: `SUBTOTAL(9, F$${1}:F${row-1})`, result: totalCost, date1904: true};
    majorSum += .15 * totalCost;
    minorSum += .15 * totalCost;
    sectionSum += .15 * totalCost;
    sheet.getCell('F' + row).value = {
        formula: `D${row} * E${row}`,
        result: .15 * totalCost,
        date1904: true
    };
    row += 2;

    for (let i = 1; i <= 6; i++) {
        stylizeTotal(sheet.getCell( row, i));
    }
    sheet.getCell(`A${row}`).value = "TOTAL";
    sheet.getCell(`F${row}`).value = {formula: `SUBTOTAL(9, F$${1}:F${row - 1})`, result: totalCost * 1.15, date1904: true};
    // Lingering styles

}

function stylizeHeader(cell: Excel.Cell) {
    cell.worksheet.getRow(Number(cell.row)).height = 16;
    cell.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FF4A86E8"}};
    cell.font = {color: {argb: "FFFFFFFF"}, bold: true, size: 12};
}

function stylizeTotal(cell: Excel.Cell) {
    cell.fill = {type: "pattern", pattern: "solid", fgColor: {argb: "FFCCCCCC"}};
    cell.font = {color: {argb: "FF000000"}, bold: true};
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
function createMasterPage(context: CanvasContext, workbook: Excel.Workbook): Map<string, [string, number]> {
    const sheet = workbook.addWorksheet("Master Rates");
    const mapping = new Map<string, [string, number]>();
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
        sheet.getColumn('B').numFmt = MONEY_FMT;
        sheet.getColumn('C').numFmt = MONEY_FMT;
        sheet.getColumn('D').numFmt = MONEY_FMT;
        sheet.getColumn('E').numFmt = MONEY_FMT;
        sheet.getColumn('B').width = 12;
        sheet.getColumn('C').width = 12;
        sheet.getColumn('D').width = 12;
        sheet.getColumn('E').width = 12;

        row ++;
        const keys = [
            ...Object.keys(pipe),
            ...Object.keys(context.effectivePriceTable.Fittings.Elbow[material as keyof ValveByPipe]),
            ...Object.keys(context.effectivePriceTable.Fittings.Tee[material as keyof ValveByPipe]),
            ...Object.keys(context.effectivePriceTable.Fittings.Reducer[material as keyof ValveByPipe]),
        ].sort((a, b) => Number(a) - Number(b)).filter((v, i, a) => v !== a[i + 1]);

        for (const size of keys) {
            let entry = pipe[size];
            sheet.getCell('A' + row).value = Number(size);

            sheet.getCell('B' + row).value = entry || '';
            mapping.set(`Pipes.${material}.${size}`, ["$B$" + row, entry]);

            entry = context.effectivePriceTable.Fittings.Elbow
                [material as keyof ValveByPipe][Number(size)] || '';
            sheet.getCell('C' + row).value = entry || '';
            mapping.set(`Fittings.Elbow.${material}.${size}`, ["$C$" + row, entry]);

            entry = context.effectivePriceTable.Fittings.Tee
                [material as keyof ValveByPipe][Number(size)] || '';
            sheet.getCell('D' + row).value = entry;

            entry =  context.effectivePriceTable.Fittings.Reducer
                [material as keyof ValveByPipe][Number(size)] || '';
            mapping.set(`Fittings.Tee.${material}.${size}`, ["$D$" + row, entry]);
            sheet.getCell('E' + row).value = entry;
            mapping.set(`Fittings.Reducer.${material}.${size}`, ["$E$" + row, entry]);
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
        sheet.getColumn('H').numFmt = MONEY_FMT;
        sheet.getColumn('H').width = 12;

        row ++;
        for (const [size, entry] of Object.entries(valve as {[key: number]: number})) {
            sheet.getCell('G' + row).value = Number(size);

            sheet.getCell('H' + row).value = entry;
            mapping.set(`Valves.${valveName}.${size}`, ["$H$" + row, entry]);
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
        sheet.getColumn('K').numFmt = MONEY_FMT;
        sheet.getColumn('K').width = 12;

        row++;
        for (const [fixture, cost] of Object.entries(context.effectivePriceTable.Fixtures)) {
            sheet.getCell('J' + row).value = fixture;
            sheet.getCell('K' + row).value = cost;
            mapping.set(`Fixtures.${fixture}`, ['$K$' + row, cost]);
            row++;
        }
        stylizeTable(startRow, row - 1, 'J', 'K', sheet);

    }

    // EQUIPMENT

    sheet.mergeCells('M1:N1');
    sheet.getCell('M1').font = {bold: true};
    sheet.getCell('M1').value = 'EQUIPMENT';
    sheet.getColumn('M').width = 20;
    row = topRow + 2;
    for (const [equipment, table] of Object.entries(context.effectivePriceTable.Equipment)) {
        const startRow = row;
        if (typeof table !== 'object') {
            // single
            sheet.mergeCells('M' + row + ":N" + row);
            sheet.getCell('M' + row).value = equipment + " - $";
            stylizeHeader(sheet.getCell('M' + row));

            row ++;
            sheet.getCell('M' + row).value = 'Size';
            sheet.getCell('M' + row).font = {bold: true};
            sheet.getCell('N' + row).value = '$/Unit';
            sheet.getCell('N' + row).font = {bold: true};
            sheet.getColumn('N').numFmt = MONEY_FMT;
            sheet.getColumn('N').width = 12;

            row ++;
            sheet.getCell('M' + row).value = 'All';
            sheet.getCell('N' + row).value = table;

            mapping.set(`Equipment.${equipment}`, ['$N$' + row, table]);

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
            sheet.getColumn('N').numFmt = MONEY_FMT;
            sheet.getColumn('N').width = 12;

            row ++;
            for (const [size, entry] of Object.entries(table)) {
                sheet.getCell('M' + row).value = Number(size);
                sheet.getCell('N' + row).value = entry as string;
                mapping.set(`Equipment.${equipment}.${size}`, ['$N$' + row, Number(entry)]);
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
        sheet.getColumn('Q').numFmt = MONEY_FMT;
        sheet.getColumn('Q').width = 12;

        row ++;
        for (const [node, cost] of Object.entries(context.effectivePriceTable.Node)) {
            sheet.getCell('P' + row).value = node;
            sheet.getCell('Q' + row).value = cost;
            mapping.set(`Node.${node}`, ['$Q$' + row, cost]);
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
        sheet.getColumn('T').numFmt = MONEY_FMT;
        sheet.getColumn('T').width = 12;

        row ++;
        for (const [plant, cost] of Object.entries(context.effectivePriceTable.Plants)) {
            sheet.getCell('S' + row).value = plant;
            sheet.getCell('T' + row).value = cost;
            mapping.set(`Plants.${plant}`, ['$T$' + row, cost]);
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
        sheet.getColumn('W').numFmt = MONEY_FMT;
        sheet.getColumn('W').width = 12;

        row ++;
        for (const [size, cost] of Object.entries(context.effectivePriceTable.Insulation)) {
            sheet.getCell('V' + row).value = Number(size);
            sheet.getCell('W' + row).value = cost;
            mapping.set(`Insulation.${size}`, ['$W$' + row, cost]);
            row ++;
        }
        stylizeTable(startRow, row - 1, 'V', 'W', sheet);
    }


    // Lingering formatting
    sheet.getColumn('J').width = 25;
    sheet.getColumn('P').width = 25;
    sheet.getColumn('S').width = 25;

    return mapping;
}

async function downloadWorkbook(context: CanvasContext, workbook: Excel.Workbook) {
    const buffer = await workbook.xlsx.writeBuffer();

    const link2 = document.createElement("a");
    const dataBlob = new Blob([new Uint8Array(buffer, 0, buffer.byteLength)]);

    const objUrl = URL.createObjectURL(dataBlob);
    link2.href = objUrl;
    link2.innerHTML = "With createObjectURL";
    link2.download = context.document.drawing.metadata.generalInfo.title + " - Bill of Materials.xlsx";
    link2.click();
}
