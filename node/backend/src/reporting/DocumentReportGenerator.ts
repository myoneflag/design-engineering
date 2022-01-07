import { CatalogsByLocale } from "../../../common/src/api/catalog/manager";
import { Catalog } from "../../../common/src/api/catalog/types";
import { StandardFlowSystemUids } from "../../../common/src/api/config";
import { DrawingState, NetworkType, SelectedMaterialManufacturer } from "../../../common/src/api/document/drawing";
import BigValveEntity from "../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { DrawableEntityConcrete } from "../../../common/src/api/document/entities/concrete-entity";
import DirectedValveEntity from "../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import FixtureEntity from "../../../common/src/api/document/entities/fixtures/fixture-entity";
import FlowSourceEntity from "../../../common/src/api/document/entities/flow-source-entity";
import PipeEntity from "../../../common/src/api/document/entities/pipe-entity";
import PlantEntity from "../../../common/src/api/document/entities/plants/plant-entity";
import { DrainageGreaseInterceptorTrap, PlantType } from "../../../common/src/api/document/entities/plants/plant-types";
import RiserEntity from "../../../common/src/api/document/entities/riser-entity";
import { EntityType, getEntityName } from "../../../common/src/api/document/entities/types";
import { getEntityNetwork, getEntitySystem, getPipeManufacturerByMaterial } from "../../../common/src/api/document/entities/utils";
import AbbreviatedCalculationReport, { PipeCalculationReportEntry, RiserCalculationReportEntry } from "../../../common/src/api/reports/calculation-report";
import { Document } from "../../../common/src/models/Document";
import ReportingFilter, { ReportingStatus } from "../../../common/src/reporting/ReportingFilter";
import config from "../config/config";

interface ReportNode {
    manufacturer: string | null;
    component: string | null;
    material: string | null;
    size: string | null;
    count: number;
    length?: number;
}

interface DocumentManufacturerData {
    [manufacturer: string]: {
        [component: string]: {
            [material: string]: {
                [size: string]: {
                    count: number,
                    length?: number,
                },
            },
        };
    };
}

export interface DocumentReportInfo {
    id: number;
    title: string;
    url: string;
    orgId: string;
    orgName: string;
    createdOn: string;
    lastModifiedBy: string;
    lastModifiedOn: string;
    locale: string;
    hasCalculation: boolean;
    includedInReport: string;
}

export interface DocumentReportStats {
    levels: number;
}

export interface DocumentManufacturerReport {
    info: DocumentReportInfo;
    stats: DocumentReportStats;
    data: DocumentManufacturerData;
}

function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = (1 + date.getMonth()).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return day + '/' + month + '/' + year;
}

export class DocumentReportGenerator {

    static aggregateManufacturersData(
        doc: Document, drawing: DrawingState,
        calculation: AbbreviatedCalculationReport): DocumentManufacturerReport {
        // for copied documents, lastModified date can appear earlier than create date
        const reasonableModifiedDate = new Date(Math.max(doc.lastModifiedOn.getTime(), doc.createdOn.getTime()));
        const report: DocumentManufacturerReport = {
            info: {
                id: doc.id,
                title: doc.metadata.title,
                url: config.getWebAppUrl() + "/document/" + doc.id,
                orgId: doc.organization.id,
                orgName: doc.organization.name,
                lastModifiedBy: doc.lastModifiedBy ? doc.lastModifiedBy.username : "n/a",
                lastModifiedOn: getFormattedDate(reasonableModifiedDate),
                createdOn: getFormattedDate(doc.createdOn),
                locale: doc.locale,
                hasCalculation: calculation != null,
                includedInReport: ReportingFilter.includedStatusString(doc),
            },
            stats: {
                levels: Object.keys(drawing.levels).length,
            },
            data: {},
        };
        const catalog = CatalogsByLocale[doc.locale];

        Object.values(drawing.shared).forEach((e) => this.addEntityToReport(e, report, drawing, calculation, catalog));

        Object.values(drawing.levels).forEach((l) => {
            Object.values(l.entities).forEach((e) => this.addEntityToReport(e, report, drawing, calculation, catalog));
        });
        return report;
    }

    static aggregateDataByComponent(
        totalsData: DocumentManufacturerReport[], totalsName: string,
        manufacturerDocumentsData: DocumentManufacturerReport[], manufacturer: string) {
        for (const document of manufacturerDocumentsData) {

            let documentTotal: DocumentManufacturerReport =
                totalsData.find((totalDoc) => totalDoc.info.id === document.info.id);
            if (!documentTotal) {
                documentTotal = { info: document.info, stats: document.stats, data: {} };
                totalsData.push(documentTotal);
            }

            const components = document.data[manufacturer];
            // tslint:disable-next-line:forin
            for (const component in components) {
                // tslint:disable-next-line:forin
                for (const material in components[component]) {
                    // tslint:disable-next-line:forin
                    for (const size in components[component][material]) {
                        const entry = components[component][material][size];
                        const node: ReportNode = {
                            manufacturer: totalsName,
                            component,
                            material,
                            size,
                            count: entry.count,
                            length: entry.length,
                        };
                        this.incrementReportNodes(documentTotal.data, [node]);
                    }
                }
            }
        }
    }

    private static incrementReportNodes(
        report: DocumentManufacturerData,
        reportNodes: ReportNode[]) {
        for (const r of reportNodes) {
            this.initializeReportNode(report, r);
            if (r.length) {
                report[r.manufacturer][r.component][r.material][r.size].length += r.length;
            }
            report[r.manufacturer][r.component][r.material][r.size].count += r.count;
        }
    }

    private static initializeReportNode(
        report: DocumentManufacturerData,
        r: ReportNode) {
        const manu = report[r.manufacturer] = report[r.manufacturer] || {};
        const comp = manu[r.component] = manu[r.component] || {};
        const mat = comp[r.material] = comp[r.material] || {};
        mat[r.size] = mat[r.size] || { count: 0, length: 0 };
    }

    private static addEntityToReport(
        e: DrawableEntityConcrete,
        report: DocumentManufacturerReport,
        drawing: DrawingState,
        calculation: AbbreviatedCalculationReport,
        catalog: Catalog) {
        const reportNode = this.calculateReportNode(e, drawing, calculation, catalog);
        if (reportNode) {
            this.incrementReportNodes(report.data, reportNode);
        }
    }

    private static calculateReportNode(
        e: DrawableEntityConcrete,
        drawing: DrawingState,
        calculationReport: AbbreviatedCalculationReport, catalog: Catalog) {

        const calculation = calculationReport ? calculationReport.calculations : null;

        const reportEntries: ReportNode[] = [];

        let component = getEntityName(e, drawing);
        let manufacturer = "generic";
        let material = null;
        let size = null;
        let length = 0;
        switch (e.type) {
            case EntityType.FLOW_SOURCE:
                const eFlow = e as FlowSourceEntity;
                manufacturer = "System";
                component = eFlow.systemUid;
                if (!Object.values(StandardFlowSystemUids).find((sys) => sys === eFlow.systemUid)) {
                    component = "Custom";
                }
                material = null;
                break;
            case EntityType.PIPE:
                const eP = e as PipeEntity;
                material = eP.material;
                if (!material) {
                    const network = getEntityNetwork(drawing, eP);
                    if (network) {
                        material = network.material;
                    }
                }
                manufacturer = getPipeManufacturerByMaterial(drawing, material);
                if (calculation) {
                    const pipeCalcEntry = calculation[e.uid] as PipeCalculationReportEntry;
                    size = pipeCalcEntry ? pipeCalcEntry.nominalSizeMM : null;
                    length = pipeCalcEntry ? pipeCalcEntry.lengthM : null;
                }
                break;
            case EntityType.RISER:
                const eR = e as RiserEntity;
                material = eR.material;
                if (!material) {
                    const system = getEntitySystem(drawing, eR);
                    if (system) {
                        material = system.networks[NetworkType.RISERS].material;
                    }
                }
                manufacturer = getPipeManufacturerByMaterial(drawing, material);
                component = "Pipe";
                if (calculation) {
                    const riserCalcEntry = calculation[e.uid] as RiserCalculationReportEntry;
                    if (riserCalcEntry) {
                        for (const pipeSeg of riserCalcEntry.expandedEntities) {
                            reportEntries.push({
                                material,
                                manufacturer,
                                component,
                                size: pipeSeg.nominalSizeMM ? pipeSeg.nominalSizeMM.toString() : null,
                                length: pipeSeg.lengthM,
                                count: 1,
                            });
                        }
                    }
                }
                break;
            case EntityType.FIXTURE:
                const eF = e as FixtureEntity;
                component = eF.name;
                const fixtureDocumentEntry = drawing.metadata.catalog.fixtures.find((f) => f.uid === eF.name);
                manufacturer = fixtureDocumentEntry ? fixtureDocumentEntry.manufacturer : manufacturer;
                break;
            case EntityType.BIG_VALVE:
                const eBv = e as BigValveEntity;
                component = eBv.valve.type;
                const manObject = drawing.metadata.catalog.mixingValves.find(
                    (mat: SelectedMaterialManufacturer) => mat.uid === eBv.valve.catalogId);
                manufacturer = manObject ? manObject.manufacturer : 'generic';
                material = null;
                break;
            case EntityType.DIRECTED_VALVE:
                const eV = e as DirectedValveEntity;
                manufacturer = "generic";
                const catId = eV.valve.catalogId.toLowerCase();
                if (catId === "isolationvalve" || catId === "prv" || catId === "rpzd") {
                    component = eV.valve.type;
                } else {
                    component = eV.valve.catalogId;
                }
                if (catId === "rpzd") {
                    const manObject = drawing.metadata.catalog.backflowValves.find(
                        (mat: SelectedMaterialManufacturer) => mat.uid === eV.valve.catalogId);
                    manufacturer = manObject ? manObject.manufacturer : 'generic';
                }
                if (catId === "balancing") {
                    const manObject = drawing.metadata.catalog.balancingValves.find(
                        (mat: SelectedMaterialManufacturer) => mat.uid === eV.valve.catalogId);
                    manufacturer = manObject ? manObject.manufacturer : 'generic';
                }
                if (catId === "prv") {
                    const manObject = drawing.metadata.catalog.prv.find(
                        (mat: SelectedMaterialManufacturer) => mat.uid === eV.valve.catalogId);
                    manufacturer = manObject ? manObject.manufacturer : 'generic';
                }
                material = null;
                break;
            case EntityType.PLANT:
                const ePl = e as PlantEntity;
                material = ePl.plant.type;
                if (ePl.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP &&
                    drawing.metadata.catalog.greaseInterceptorTrap) {
                    const manObject = drawing.metadata.catalog.greaseInterceptorTrap.find(
                        (mat: SelectedMaterialManufacturer) => mat.uid === "greaseInterceptorTrap");
                    manufacturer = manObject ? manObject.manufacturer : 'generic';
                    material = null;
                    const greaseInterceptor = ePl.plant as DrainageGreaseInterceptorTrap;
                    size = greaseInterceptor.capacity;
                } else if (ePl.plant.type === PlantType.RETURN_SYSTEM) {
                    const manObject = drawing.metadata.catalog.hotWaterPlant.find(
                        (mat: SelectedMaterialManufacturer) => mat.uid === "hotWaterPlant");
                    manufacturer = manObject ? manObject.manufacturer : 'generic';
                } else {
                    manufacturer = "generic";
                }
                break;
            case EntityType.GAS_APPLIANCE:
                break;
            default:
                return null;
                break;
        }

        if (!reportEntries.length) {
            reportEntries.push({ manufacturer, component, material, size, length, count: 1 });
        }
        reportEntries.forEach((re) => re.manufacturer = cleanseName(re.manufacturer));

        return reportEntries;
    }

}
function cleanseName(name: string): string {
    return name.replace(/\//g, '');
}
