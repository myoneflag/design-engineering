import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { SelectedMaterialManufacturer } from "../../../../../common/src/api/document/drawing";
import {
    ComponentPressureLossMethod,
    COMPONENT_PRESSURE_LOSS_METHODS,
    DISPLAY_PSD_METHODS,
    DRAINAGE_METHOD_CHOICES,
    isDrainage,
    StandardFlowSystemUids,
    SupportedDrainageMethods,
    SupportedPsdStandards,
    INSULATION_MATERIAL_CHOICES,
} from "../../../../../common/src/api/config";
import {
    DesignParameterReport,
    DesignSummaryReport,
    DrainageFSParameterReport,
    PressureFSParameterReport,
    ProductSelectionReport,
    DesignCalculationReport,
    initDesignCalculationReport,
    DesignCalculationKey,
    ReferenceDrawing,
    contacts,
} from "./types";
import { HotWaterPlantGrundfosSettingsName, PlantType } from "../../../../../common/src/api/document/entities/plants/plant-types";
import { EntityType, getEntityName } from "../../../../../common/src/api/document/entities/types";
import PipeEntity, { fillPipeDefaultFields } from "../../../../../common/src/api/document/entities/pipe-entity";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import { cloneSimple } from "../../../../../common/src/lib/utils";
import BigValveEntity, { BigValveType, fillDefaultBigValveFields, SystemNodeEntity } from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import DirectedValveEntity from "../../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { defaultCatalog } from "../../../../src/store/catalog/types";
import PlantEntity, { fillPlantDefaults } from "../../../../../common/src/api/document/entities/plants/plant-entity";
import { getEntitySystem } from "../../../../src/calculations/utils";
import _ from "lodash";
import FlowSourceEntity, { fillFlowSourceDefaults } from "../../../../../common/src/api/document/entities/flow-source-entity";
import FixtureEntity, { fillFixtureFields } from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import LoadNodeEntity, { NodeType } from "../../../../../common/src/api/document/entities/load-node-entity";
import { Units } from "../../../../../common/src/lib/measurements";
import DirectedValve from "../../../../src/htmlcanvas/objects/directed-valve"
import { NodeProps } from "../../../../../common/src/models/CustomEntity";
import Pipe from "../../../../src/htmlcanvas/objects/pipe";
import Fitting from "../../../../src/htmlcanvas/objects/fitting";
import BigValve from "../../../../src/htmlcanvas/objects/big-valve/bigValve";
import GasAppliance from "../../../../src/htmlcanvas/objects/gas-appliance";
import GasApplianceEntity, { fillGasApplianceFields } from "../../../../../common/src/api/document/entities/gas-appliance";
import { CalculationFilterSettings, FilterSettingViewKeyValues, initCalculationFilterSettings, PressureOrDrainage } from "../../../../src/store/document/types";
import { fillDefaultLoadNodeFields } from "../../../../src/store/document/entities/fillDefaultLoadNodeFields";
import { fillDirectedValveFields } from "../../../../src/store/document/entities/fillDirectedValveFields";
import { fillValveDefaultFields } from "../../../../src/store/document/entities/fillDefaultEntityFields";
import { globalStore } from "../../../../src/store/document/mutations";

export function getDrawnFlowsystems(context: CanvasContext): Set<string> {
    const drawnFlowSystems = new Set<string>();

    Array.from(context.globalStore.values()).forEach((o) => {
        const entitySystem = getEntitySystem(o.entity, context)!;
        if (entitySystem) {
            drawnFlowSystems.add(entitySystem);
        }
    });

    return drawnFlowSystems;
}

/* Document */

export function getDesignSummary(context: CanvasContext, drawnFlowSystemUids: Set<string>): DesignSummaryReport {
    const calculationParams = context.document.drawing.metadata.calculationParams;
    const waterCalcMethod = DISPLAY_PSD_METHODS.find(
        (e) => e.key == SupportedPsdStandards[calculationParams.psdMethod]
    )?.name || '';
    const waterLossMethod = COMPONENT_PRESSURE_LOSS_METHODS.find(
        (e) => e.key == ComponentPressureLossMethod[calculationParams.componentPressureLossMethod]
    )?.name || '';
    const wastewaterCalcMethod = DRAINAGE_METHOD_CHOICES.find(
        (e) => e.key == SupportedDrainageMethods[calculationParams.drainageMethod]
    )?.name || '';

    const drawnFlowSystems = context.document.drawing.metadata.flowSystems.filter((fs) => drawnFlowSystemUids.has(fs.uid))
    const hasWaterService = !!drawnFlowSystems.find((fs) => fs.fluid === 'water');
    const hasGasService = !!drawnFlowSystems.find((fs) => fs.fluid === "naturalGas" || fs.fluid === "LPG");
    const hasWastewaterService =
        drawnFlowSystemUids.has(StandardFlowSystemUids.GreaseWaste) ||
        drawnFlowSystemUids.has(StandardFlowSystemUids.TradeWaste);
    return {
        hasWaterService,
        waterCalcMethod,
        waterLossMethod,
        hasGasService,
        hasWastewaterService,
        wastewaterCalcMethod,
    }
}

export function getDesignParameter(context: CanvasContext, drawnFlowSystemUids: Set<string>): DesignParameterReport {
    const flowSystems = context.document.drawing.metadata.flowSystems;
    const catalog = context.effectiveCatalog;
    const pressureFlowSystems: PressureFSParameterReport[] = [];
    const drainageFlowSystems: DrainageFSParameterReport[] = [];
    flowSystems.forEach((fs) => {
        if (!drawnFlowSystemUids.has(fs.uid)) {
            return;
        }
        if (isDrainage(fs.uid, flowSystems)) {
            drainageFlowSystems.push({
                hexFS: fs.color.hex,
                nameFS: fs.name,
                nameStyle: {
                    cellBackground: fs.color.hex,
                    textColor: '#ffffff',
                },
                stacksMaterial: catalog.pipes[fs.networks.RISERS.material].name,
                pipesMaterial: catalog.pipes[fs.networks.RETICULATIONS.material].name,
                ventsMaterial: catalog.pipes[fs.networks.CONNECTIONS.material].name,
                horizontalPipeSizing: fs.drainageProperties.horizontalPipeSizing.map((e) => ({
                    ...e,
                    gradePCT: getPsdUnitString(e.gradePCT, Units.Percent),
                    sizeMM: getPsdUnitString(e.sizeMM, Units.Millimeters),
                })),
                ventSizing: fs.drainageProperties.ventSizing.map((e) => ({
                    ...e,
                    sizeMM: getPsdUnitString(e.sizeMM, Units.Millimeters),
                })),
                stackPipeSizing: fs.drainageProperties.stackPipeSizing.map((e) => ({
                    ...e,
                    sizeMM: getPsdUnitString(e.sizeMM, Units.Millimeters),
                })),
                stackVentPipeSizing: fs.drainageProperties.stackVentPipeSizing.map((e) => ({
                    ...e,
                    sizeMM: getPsdUnitString(e.sizeMM, Units.Millimeters),
                })),
                maxUnventedLengthM: Object.keys(fs.drainageProperties.maxUnventedLengthM).map((e) => ({
                    minLength: getPsdUnitString(fs.drainageProperties.maxUnventedLengthM[parseInt(e)], Units.Meters),
                    sizeMM: getPsdUnitString(e, Units.Millimeters),
                })),
            })
        } else {
            pressureFlowSystems.push({
                hexFS: fs.color.hex,
                temperatureFS: getPsdUnitString(fs.temperature, Units.Celsius),
                nameFS: fs.name,
                nameStyle: {
                    cellBackground: fs.color.hex,
                    textColor: '#ffffff',
                },            
                isHotwater: fs.uid === StandardFlowSystemUids.HotWater,
                isNotGasFS: fs.uid !== StandardFlowSystemUids.Gas,
                isGasFS: fs.uid === StandardFlowSystemUids.Gas,
                gasTypeFS: catalog.fluids[fs.fluid].name,

                insulationMaterial: INSULATION_MATERIAL_CHOICES.find((e) => e.key === fs.insulationMaterial)?.name,
                insulationThicknessMM: getPsdUnitString(fs.insulationThicknessMM, Units.Millimeters),
            
                riserVelocityMS: getPsdUnitString(fs.networks.RISERS.velocityMS, Units.MetersPerSecond),
                reticulationVelocityMS: getPsdUnitString(fs.networks.RETICULATIONS.velocityMS, Units.MetersPerSecond),
                connectionsVelocityMS: getPsdUnitString(fs.networks.CONNECTIONS.velocityMS, Units.MetersPerSecond),
                returnVelocityMS: getPsdUnitString(fs.returnMaxVelocityMS, Units.MetersPerSecond),
            
                riserMaterial: catalog.pipes[fs.networks.RISERS.material].name,
                reticulationMaterial: catalog.pipes[fs.networks.RETICULATIONS.material].name,
                connectionsMaterial: catalog.pipes[fs.networks.CONNECTIONS.material].name,
            
                riserMinimumPipeSize: getPsdUnitString(fs.networks.RISERS.minimumPipeSize, Units.Millimeters),
                reticulationMinimumPipeSize: getPsdUnitString(fs.networks.RETICULATIONS.minimumPipeSize, Units.Millimeters),
                connectionsMinimumPipeSize: getPsdUnitString(fs.networks.CONNECTIONS.minimumPipeSize, Units.Millimeters),
            
                riserSpareCapacityPCT: getPsdUnitString(fs.networks.RISERS.spareCapacityPCT, Units.Percent),
                reticulationSpareCapacityPCT: getPsdUnitString(fs.networks.RETICULATIONS.spareCapacityPCT, Units.Percent),
                connectionsSpareCapacityPCT: getPsdUnitString(fs.networks.CONNECTIONS.spareCapacityPCT, Units.Percent),
            })
        }
    });
    return {
        pressureFlowSystems,
        drainageFlowSystems,
    };
}

function getSelectedManufacturer(selectedMaterials: SelectedMaterialManufacturer[], uid: string): string {

    if (
        !selectedMaterials?.length ||
        !selectedMaterials.find((obj: SelectedMaterialManufacturer) => obj.uid === uid)
    ) {
        return "generic";
    }

    return selectedMaterials.find((obj: SelectedMaterialManufacturer) => obj.uid === uid)?.manufacturer!;
}

export function filterEffectiveCatalog(context: CanvasContext): Catalog {
    const flowSystems = context.document.drawing.metadata.flowSystems;
    const productiveCatalog = cloneSimple(defaultCatalog);

    for (const o of Array.from(context.globalStore.values())) {
        switch (o.type) {
            case EntityType.PIPE:
                const pipe = o.entity as PipeEntity;
                const material = pipe.material || flowSystems.find((fs) => fs.uid === pipe.systemUid)?.networks[pipe.network].material;
                if (material && !productiveCatalog.pipes[material]) {
                    productiveCatalog.pipes[material] = context.effectiveCatalog.pipes[material];
                }
                break;
            case EntityType.BIG_VALVE:
                const bigValve = o.entity as BigValveEntity;
                if (!productiveCatalog.mixingValves[bigValve.valve.catalogId] && context.effectiveCatalog.mixingValves[bigValve.valve.catalogId]) {
                    productiveCatalog.mixingValves[bigValve.valve.catalogId] = context.effectiveCatalog.mixingValves[bigValve.valve.catalogId];
                }
                break;
            case EntityType.DIRECTED_VALVE:
                const directedValve = o.entity as DirectedValveEntity;
                switch (directedValve.valve.catalogId) {
                    case 'prv':
                        productiveCatalog.prv = context.effectiveCatalog.prv;
                        break;
                    case 'balancing':
                        productiveCatalog.balancingValves = context.effectiveCatalog.balancingValves;
                        break;
                    case 'RPZD':
                        productiveCatalog.backflowValves = context.effectiveCatalog.backflowValves;
                        break;
                }
                break;
            case EntityType.PLANT:
                const plant = o.entity as PlantEntity;
                switch (plant.plant.type) {
                    case PlantType.RETURN_SYSTEM:
                        productiveCatalog.hotWaterPlant.rheemVariants = context.effectiveCatalog.hotWaterPlant.rheemVariants;
                        productiveCatalog.hotWaterPlant.size = context.effectiveCatalog.hotWaterPlant.size;
                        if (!productiveCatalog.hotWaterPlant?.manufacturer.find((e) => e.uid && !e.returns)) {
                            productiveCatalog.hotWaterPlant.manufacturer.push({
                                abbreviation: "Rheem",
                                name: "Rheem",
                                priceTableName: "Hot Water Plant",
                                uid: "rheem",
                            }, {
                                abbreviation: "Generic",
                                name: "Generic",
                                priceTableName: "Hot Water Plant",
                                uid: "generic",
                            });
                        }
                        break;
                    case PlantType.TANK:
                        productiveCatalog.hotWaterPlant.grundfosPressureDrop = context.effectiveCatalog.hotWaterPlant.grundfosPressureDrop;
                        productiveCatalog.hotWaterPlant.storageTanks = context.effectiveCatalog.hotWaterPlant.storageTanks;
                        if (!productiveCatalog.hotWaterPlant?.manufacturer.find((e) => e.returns)) {
                            productiveCatalog.hotWaterPlant.manufacturer.push({
                                abbreviation: "Generic",
                                name: "Generic",
                                priceTableName: "Hot Water Plant",
                                returns: true,
                                uid: "generic",
                            }, {
                                abbreviation: "Grundfos",
                                name: "Grundfos",
                                priceTableName: "Hot Water Plant",
                                returns: true,
                                uid: "grundfos",
                            });
                        }
                        break;
                    case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                        productiveCatalog.greaseInterceptorTrap = context.effectiveCatalog.greaseInterceptorTrap;
                        break;
                    default:
                        break
                }
            default:
                break;
        }
    }
    return productiveCatalog;
}

export function getProductSelection(context: CanvasContext): ProductSelectionReport {
    const productiveCatalog = filterEffectiveCatalog(context);
    const drawingCatalog = context.document.drawing.metadata.catalog;

    const pipes = Object.values(productiveCatalog.pipes).map((pipe) => {
        const manufacturerUid = getSelectedManufacturer(drawingCatalog.pipes, pipe.uid);
        const technicalData = Object.entries(pipe.pipesBySize[manufacturerUid])
            .map(([techKey, data]) => {
                return {
                    techKey,
                    ...data,
                }
            });
        const manufacturer = pipe?.manufacturer.find((m) => m.uid === manufacturerUid)?.name!;
        return {
            productName: `Pipe - ${pipe.name}`,
            manufacturer,
            contact: manufacturer && contacts[manufacturer] || '',
            technicalData,
            isSewer: pipe.name.includes('(Sewer)'),
            isNotSewer: !pipe.name.includes('(Sewer)'),
        }
    });

    const mixingValves = Object.values(productiveCatalog.mixingValves).map((mixingValve) => {
        const manufacturerUid = getSelectedManufacturer(drawingCatalog.mixingValves, mixingValve.uid);
        const technicalData = Object.entries(mixingValve.pressureLossKPAbyFlowRateLS[manufacturerUid])
            .map(([techKey, pressureLoss]) => {
                return {
                    techKey,
                    pressureLoss,
                }
            });
        const manufacturer = mixingValve?.manufacturer.find((m) => m.uid === manufacturerUid)?.name!;
        return {
            productName: `Mixing Valve - ${mixingValve.name}`,
            manufacturer,
            contact: manufacturer && contacts[manufacturer] || '',
            technicalData,
        }
    });

    const backflowValves = Object.values(productiveCatalog.backflowValves).map((item) => {
        const manufacturerUid = getSelectedManufacturer(drawingCatalog.backflowValves, item.uid);
        const technicalData = Object.entries(item.valvesBySize[manufacturerUid])
            .map(([techKey, data]) => {
                return {
                    techKey,
                    ...data,
                }
            });
        const manufacturer = item?.manufacturer.find((m) => m.uid === manufacturerUid)?.name!;
        return {
            productName: `Backflow Valves - ${item.name}`,
            manufacturer,
            contact: manufacturer && contacts[manufacturer] || '',
            technicalData,
        }
    });

    const prvHide = !productiveCatalog.prv?.manufacturer.length;
    const prvManufacturerUid = getSelectedManufacturer(drawingCatalog.prv, 'prv');
    const prvTechnicalData = prvHide ? [] : Object.entries(productiveCatalog.prv.size[prvManufacturerUid])
        .map(([techKey, data]) => {
            return {
                techKey,
                ...data,
            }
        });
    const prvManufacturer = productiveCatalog.prv?.manufacturer.find((m) => m.uid === prvManufacturerUid)?.name!;
    const prv = prvHide ? [] : [{
        productName: 'Pressure Reducing Valve',
        manufacturer: prvManufacturer,
        contact: prvManufacturer && contacts[prvManufacturer] || '',
        technicalData: prvTechnicalData,
    }];

    const balancingHide = !productiveCatalog.balancingValves?.manufacturer.length;
    const balancingValveManufacturerUid = getSelectedManufacturer(drawingCatalog.balancingValves, 'balancingValves');
    const balancingManufacturer = productiveCatalog.balancingValves?.manufacturer.find((m) => m.uid === balancingValveManufacturerUid)?.name!;
    const balancingValves = balancingHide ?  [] : [{
        productName: 'Balancing Valve',
        manufacturer: balancingManufacturer,
        contact: balancingManufacturer && contacts[balancingManufacturer] || '',
        technicalData: [],
    }];

    const circulatingPumpsManufacturerUid = getSelectedManufacturer(drawingCatalog.hotWaterPlant, 'circulatingPumps');
    const circulatingPumpsHide =
        circulatingPumpsManufacturerUid !== 'grundfos' ||
        _.isEmpty(productiveCatalog.hotWaterPlant.grundfosPressureDrop);
    const circulatingPumpsTechnicalData = Object.keys(productiveCatalog.hotWaterPlant.grundfosPressureDrop)
        .map((key) => {
            return {
                techKey: HotWaterPlantGrundfosSettingsName[key as keyof typeof HotWaterPlantGrundfosSettingsName] as string,
            }
        });
    const circulatingPumpManufacturer = productiveCatalog.hotWaterPlant?.manufacturer.find((m) => m.returns && m.uid === circulatingPumpsManufacturerUid)?.name!;
    const circulatingPumps = circulatingPumpsHide ? [] : [{
        productName: 'Heated Water Circulating Pumps',
        manufacturer: circulatingPumpManufacturer,
        contact: circulatingPumpManufacturer && contacts[circulatingPumpManufacturer] || '',
        technicalData: [], // circulatingPumpsTechnicalData,
    }];

    const hotWaterPlantManufacturerUid = getSelectedManufacturer(drawingCatalog.hotWaterPlant, 'hotWaterPlant');
    const hotWaterPlantPumpsHide =
        hotWaterPlantManufacturerUid !== 'rheem' ||
        !productiveCatalog.hotWaterPlant.rheemVariants.length;
    const hotWaterPlantTechnicalData = productiveCatalog.hotWaterPlant.rheemVariants
        .map((item) => {
            return {
                techKey: item.name as string,
            }
        });
    const hotWaterPlantManufacturer = productiveCatalog.hotWaterPlant?.manufacturer.find((m) => !m.returns && m.uid === hotWaterPlantManufacturerUid)?.name!;
    const hotWaterPlant = hotWaterPlantPumpsHide ? [] : [{
        productName: 'Heated Water Plant',
        manufacturer: hotWaterPlantManufacturer,
        contact: hotWaterPlantManufacturer && contacts[hotWaterPlantManufacturer] || '',
        technicalData: [], // hotWaterPlantTechnicalData,
    }];

    const greaseInterceptorTrapHide = !productiveCatalog.greaseInterceptorTrap;
    const greaseInterceptorTrapManufacturerUid = getSelectedManufacturer(drawingCatalog.greaseInterceptorTrap!, 'greaseInterceptorTrap');
    const greaseInterceptorTrapTechnicalData = greaseInterceptorTrapHide ? [] : productiveCatalog.greaseInterceptorTrap!.location
        .map((item) => {
            return {
                techKey: item.name,
            }
        });
    const greaseInterceptorTrapManufacturer = productiveCatalog.greaseInterceptorTrap?.manufacturer.find((m) => m.uid === greaseInterceptorTrapManufacturerUid)?.name!;
    const greaseInterceptorTrap = greaseInterceptorTrapHide ? [] : [{
        productName: 'Grease Interceptor Trap',
        manufacturer: greaseInterceptorTrapManufacturer,
        contact: greaseInterceptorTrapManufacturer && contacts[greaseInterceptorTrapManufacturer] || '',
        technicalData: [], // greaseInterceptorTrapTechnicalData,
    }];

    return {
        backflowValves,
        balancingValves,
        greaseInterceptorTrap,
        circulatingPumps,
        hotWaterPlant,
        mixingValves,
        pipes,
        prv,
        // TODO: later
        floorWaste: [],
        inspectionOpening: [],
    }
}

/* Excel */

function retrieveReference(context: CanvasContext, reference: string): { exportKey: DesignCalculationKey, levelName: string } {
    const exportKey: DesignCalculationKey = reference[0] === 'W'
        ? DesignCalculationKey.WATER
        : reference[0] === 'G'
            ? DesignCalculationKey.GAS
            : DesignCalculationKey.DRAINAGE;
    const levels = context.document.drawing.levels;
    // TODO: if levelName is empty
    const levelName = Object.values(levels).find((level) => reference.includes(`-${level.abbreviation}-`))?.name!;
    return {
        exportKey,
        levelName,
    }
}

function getPsdUnitString(
    value: string | string[] | number | [number, number] | undefined | null,
    unit: string | null = '',
    emptyStr: string | number = 'N/A'
): string {
    if (value == 0) {
        return '0';
    }
    if (value) {
        if (typeof value === 'number') {
            return `${parseFloat(value.toFixed(3)).toString()} ${unit}`;
        } else if (typeof value === 'string') {
            return `${value} ${unit}`;
        } else if (typeof value[0] === 'number' && typeof value[1] === 'number') {
            return `${parseFloat(value[0].toFixed(3)).toString()} ${unit} to ${parseFloat(value[1].toFixed(3)).toString()} ${unit}`;
        } else {
            return value.join(', ');
        }
    } else {
        return emptyStr.toString();
    }
}

export function getWaterCalculationReport(context: CanvasContext): DesignCalculationReport {
    const designCalculationReport = cloneSimple(initDesignCalculationReport);
    const catalog = context.effectiveCatalog;
    const flowSystems = context.document.drawing.metadata.flowSystems;
    const drawingCatalog = context.document.drawing.metadata.catalog;

    for (const o of Array.from(context.globalStore.values())) {
        const reference = o.entity.reference;
        if (!reference) {
            continue;
        }

        const { exportKey, levelName } = retrieveReference(context, reference);
        if (!levelName) {
            continue;
        }

        Object.values(designCalculationReport[exportKey]).forEach((entityReport) => {
            if (!entityReport[levelName]) {
                entityReport[levelName] = [];
            }
        });

        const flowSystemUid = getEntitySystem(o.entity, context);

        switch (o.type) {
            case EntityType.FLOW_SOURCE:
                const flowSource = o.entity as FlowSourceEntity;
                const filledFlowSource = fillFlowSourceDefaults(context.document.drawing, flowSource)
                const flowSourceCalc = context.globalStore.getCalculation(flowSource);
                switch (exportKey) {
                    case DesignCalculationKey.WATER:
                        designCalculationReport[exportKey]['Flow Sources'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Residual Pressure': getPsdUnitString(flowSourceCalc?.pressureKPA, Units.KiloPascals),
                            'Static Pressure': getPsdUnitString(flowSourceCalc?.staticPressureKPA, Units.KiloPascals),
                            'Height': getPsdUnitString(filledFlowSource.heightAboveGroundM, Units.Meters, 0),
                        });
                        break;
                    case DesignCalculationKey.GAS:
                        designCalculationReport[exportKey]['Flow Sources'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Pressure': getPsdUnitString(flowSourceCalc?.pressureKPA, Units.KiloPascals),
                            'Height': getPsdUnitString(filledFlowSource.heightAboveGroundM, Units.Meters, 0),
                        });
                        break;
                    case DesignCalculationKey.DRAINAGE:
                        designCalculationReport[exportKey]['Flow Sources'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                        });
                        break;
                    default:
                        break;
                }

                break;
            case EntityType.PIPE:
                const pipe = o.entity as PipeEntity;
                const filledPipe = fillPipeDefaultFields(
                    context.document.drawing,
                    (o as Pipe).computedLengthM,
                    pipe
                );
                const pipeCalc = context.globalStore.getCalculation(pipe);
                const pipeMaterial = filledPipe.material || flowSystems.find((fs) => fs.uid === flowSystemUid)?.networks[filledPipe.network].material;
                switch (exportKey) {
                    case DesignCalculationKey.WATER:
                        const manufacturerUid = getSelectedManufacturer(drawingCatalog.pipes, pipeMaterial!);
                        const pipeCoefficient = catalog.pipes[pipeMaterial!]?.pipesBySize[manufacturerUid]
                            ? catalog.pipes[pipeMaterial!]?.pipesBySize[manufacturerUid][pipeCalc?.realNominalPipeDiameterMM!]?.colebrookWhiteCoefficient
                            : '';
                        designCalculationReport[exportKey]['Pipes'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Loading Units': getPsdUnitString(pipeCalc?.psdUnits?.units),
                            'Continuous Flow Rates': getPsdUnitString(pipeCalc?.psdUnits?.continuousFlowLS, Units.LitersPerSecond),
                            'Peak Flow Rate': getPsdUnitString(pipeCalc?.PSDFlowRateLS, Units.LitersPerSecond),
                            'Nominal Diameter': getPsdUnitString(pipeCalc?.realNominalPipeDiameterMM, Units.Millimeters),
                            'Internal Diameter': getPsdUnitString(pipeCalc?.realInternalDiameterMM, Units.Millimeters),
                            'Material': catalog.pipes[pipeMaterial!]?.name,
                            'Velocity': getPsdUnitString(pipeCalc?.velocityRealMS, Units.MetersPerSecond),
                            'Colebrook White Coefficient': getPsdUnitString(pipeCoefficient),
                            'Pressure Drop': getPsdUnitString(pipeCalc?.pressureDropKPA, Units.KiloPascals),
                            'Length': getPsdUnitString(pipeCalc?.lengthM, Units.Meters),
                            'Heat Loss Flow Rate': getPsdUnitString(pipeCalc?.rawReturnFlowRateLS, Units.LitersPerSecond),
                        });
                        break;
                    case DesignCalculationKey.GAS:
                        designCalculationReport[exportKey]['Pipes'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Peak Flow Rate': getPsdUnitString(pipeCalc?.gasMJH, Units.MegajoulesPerHour),
                            'Nominal Diameter': getPsdUnitString(pipeCalc?.realNominalPipeDiameterMM, Units.Millimeters),
                            'Internal Diameter': getPsdUnitString(pipeCalc?.realInternalDiameterMM, Units.Millimeters),
                            'Material': catalog.pipes[pipeMaterial!]?.name,
                            'Velocity': getPsdUnitString(pipeCalc?.velocityRealMS, Units.MetersPerSecond),
                            'Length': getPsdUnitString(pipeCalc?.lengthM, Units.Meters),
                        });
                        break;
                    case DesignCalculationKey.DRAINAGE:
                        designCalculationReport[exportKey]['Pipes'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Fixture Units': getPsdUnitString(pipeCalc?.psdUnits?.drainageUnits),
                            'Nominal Diameter': getPsdUnitString(pipeCalc?.realNominalPipeDiameterMM, Units.Millimeters),
                            'Material': catalog.pipes[pipeMaterial!]?.name,
                            'Length': getPsdUnitString(pipeCalc?.lengthM, Units.Meters),
                            'Grade': getPsdUnitString(pipeCalc?.gradePCT, Units.Percent),
                            'Fall': getPsdUnitString(pipeCalc?.fallM, Units.Meters),
                        });
                        break;
                    default:
                        break;
                }
                break;
            case EntityType.FITTING:
                const fitting = o as Fitting;
                // const filledFitting = fillValveDefaultFields(context.document.drawing, fitting.entity, globalStore);
                const fittingCalc = context.globalStore.getCalculation(fitting.entity);
                const connectedPipeToFittings = fitting.getConnetectedSidePipe('');
                const connectedPipeToFittingCalc = connectedPipeToFittings[0] && context.globalStore.getCalculation(connectedPipeToFittings[0].entity);

                const largestPipeDiameterMM = Math.max(
                    ...connectedPipeToFittings.map((pipe) =>
                        context.globalStore.getCalculation(pipe.entity)?.realNominalPipeDiameterMM!
                    )
                );
                const largestPipeFlowRate = Math.max(
                    ...connectedPipeToFittings.map((pipe) =>
                        context.globalStore.getCalculation(pipe.entity)?.PSDFlowRateLS! // rawReturnFlowRateLS
                    )
                );
                const largestGasPipeFlowRate = Math.max(
                    ...connectedPipeToFittings.map((pipe) =>
                        context.globalStore.getCalculation(pipe.entity)?.gasMJH!
                    )
                );
                switch (exportKey) {
                    case DesignCalculationKey.WATER:
                        designCalculationReport[exportKey]['Fittings'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': getPsdUnitString(fitting.friendlyTypeName),
                            'Size': getPsdUnitString(largestPipeDiameterMM, Units.Millimeters),
                            'kV Value': getPsdUnitString(fittingCalc?.kvValue),
                            'Flow Rate': getPsdUnitString(largestPipeFlowRate || fittingCalc?.flowRateLS, Units.LitersPerSecond),
                            'Pressure Drop Including Height Change': getPsdUnitString(fittingCalc?.pressureDropKPA, Units.KiloPascals),
                        });
                        break;
                    case DesignCalculationKey.GAS:
                        designCalculationReport[exportKey]['Fittings'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': getPsdUnitString(fitting.friendlyTypeName),
                            'Size': getPsdUnitString(largestPipeDiameterMM, Units.Millimeters),
                            'Flow Rate': getPsdUnitString(largestGasPipeFlowRate, Units.MegajoulesPerHour),
                        });
                        break;
                    case DesignCalculationKey.DRAINAGE:
                        designCalculationReport[exportKey]['Fittings'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': getPsdUnitString(fitting.friendlyTypeName),
                            'Size': getPsdUnitString(largestPipeDiameterMM, Units.Millimeters),
                            'Fixture Units': getPsdUnitString(connectedPipeToFittingCalc?.psdUnits?.drainageUnits),
                        });
                        break;
                    default:
                        break;
                }
                break;
            case EntityType.FIXTURE:
                const fixture = o.entity as FixtureEntity;
                const fixtureCalc = context.globalStore.getCalculation(fixture);
                const filledFixture = fillFixtureFields(context.document.drawing, catalog, fixture);
                const systemUids = filledFixture.roughInsInOrder.filter(
                    (suid) => !isDrainage(suid, context.document.drawing.metadata.flowSystems)
                );
                switch (exportKey) {
                    case DesignCalculationKey.WATER:
                        for (let i = 0; i < systemUids.length; i++) {
                            designCalculationReport[exportKey]['FixturesNodes'][levelName].push({
                                flowSystemUid,
                                'Reference': i === 0 ? reference : '',
                                'Name': i === 0 ? catalog.fixtures[filledFixture.name]?.name || filledFixture.name : '',
                                'Loading Units': getPsdUnitString(filledFixture.roughIns[systemUids[i]]?.loadingUnits),
                                'Continuous Flow Rates': getPsdUnitString(filledFixture.roughIns[systemUids[i]]?.continuousFlowLS, Units.LitersPerSecond),
                                'Residual Pressure': getPsdUnitString(fixtureCalc?.inlets[systemUids[i]]?.pressureKPA, Units.KiloPascals),
                                'Static Pressure': getPsdUnitString(fixtureCalc?.inlets[systemUids[i]]?.staticPressureKPA, Units.KiloPascals),
                                'Dead Leg Volume': getPsdUnitString(fixtureCalc?.inlets[systemUids[i]]?.deadlegVolumeL, Units.Liters),
                                'Dead Leg Length': getPsdUnitString(fixtureCalc?.inlets[systemUids[i]]?.deadlegLengthM, Units.Meters),
                            });
                        }
                        break;
                    case DesignCalculationKey.DRAINAGE:
                    case DesignCalculationKey.GAS:
                    default:
                        break;
                }
                break;
            case EntityType.LOAD_NODE:
                const loadNode = o.entity as LoadNodeEntity;
                const nodes = context.$store.getters["customEntity/nodes"];
                const filledLoadNode = fillDefaultLoadNodeFields(
                  context.document,
                  o.globalStore,
                  loadNode,
                  catalog,
                  nodes
                );
                if (!filledLoadNode?.name) {
                    switch (filledLoadNode.node.type) {
                      case NodeType.LOAD_NODE:
                        filledLoadNode.name = "Loading Node";
                        break;
                      case NodeType.DWELLING:
                        filledLoadNode.name = "Dwelling Node";
                        break;
                    }
                }
                const loadNodeCalc = context.globalStore.getCalculation(loadNode);
                switch (exportKey) {
                    case DesignCalculationKey.WATER:
                        designCalculationReport[exportKey]['FixturesNodes'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': filledLoadNode.name || '',
                            'Loading Units': getPsdUnitString(loadNodeCalc?.psdUnits?.units),
                            'Continuous Flow Rates': getPsdUnitString(null),
                            'Residual Pressure': getPsdUnitString(loadNodeCalc?.pressureKPA, Units.KiloPascals),
                            'Static Pressure': getPsdUnitString(loadNodeCalc?.staticPressureKPA, Units.KiloPascals),
                            'Dead Leg Volume': getPsdUnitString(null),
                            'Dead Leg Length': getPsdUnitString(null),
                        });
                        break;
                    case DesignCalculationKey.DRAINAGE:
                        designCalculationReport[exportKey]['FixturesNodes'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': filledLoadNode.name || '',
                            'Fixture Units': getPsdUnitString(loadNodeCalc?.psdUnits?.units),
                        });
                        break;
                    case DesignCalculationKey.GAS:
                        designCalculationReport[exportKey]['Outlets'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': filledLoadNode.name || '',
                            'Inlet Pressure': getPsdUnitString(filledLoadNode?.node?.gasPressureKPA, Units.KiloPascals),
                            'Flow Rates': getPsdUnitString(loadNodeCalc?.gasFlowRateMJH, Units.MegajoulesPerHour),
                        });
                    default:
                        break;
                }
                break;
            case EntityType.DIRECTED_VALVE:
                const valve = o as DirectedValve;
                // const filledDirectedValve = fillDirectedValveFields(context.document.drawing, globalStore, valve.entity);
                const connectedPipe = valve.getConnetectedSidePipe('')[0];
                const connectedPipeCalc = connectedPipe && context.globalStore.getCalculation(connectedPipe.entity);
                const valveCalc = context.globalStore.getCalculation(valve.entity);
                switch (exportKey) {
                    case DesignCalculationKey.WATER:
                        const valveSize = valveCalc?.sizeMM || connectedPipeCalc?.realNominalPipeDiameterMM;
                        let valveKvValue;
                        if (!valveSize || valveCalc?.kvValue) {
                            valveKvValue = valveCalc?.kvValue;
                        } else {
                            const valvesBySize = catalog.valves[valve.entity.valve.catalogId]?.valvesBySize;
                            if (valvesBySize) {
                                if (valvesBySize[valveSize!]?.kValue) {
                                    valveKvValue = valvesBySize[valveSize!]?.kValue;
                                } else {
                                    for (const range of Object.keys(valvesBySize)) {
                                        if (!range.includes('-') || range.split('-').length !== 2) {
                                            continue;
                                        }
                                        if (valveSize >= Number(range.split('-')[0]) && valveSize <= Number(range.split('-')[1])) {
                                            valveKvValue = valvesBySize[range]?.kValue;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        designCalculationReport[exportKey]['Valves'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': valve.friendlyTypeName(catalog),
                            'Size': getPsdUnitString(valveSize, Units.Millimeters),
                            'kV Value': getPsdUnitString(valveKvValue, Units.Kv),
                            'Flow Rate': getPsdUnitString(valveCalc?.flowRateLS || connectedPipeCalc?.rawReturnFlowRateLS, Units.LitersPerSecond),
                            'Pressure Drop': getPsdUnitString(valveCalc?.pressureDropKPA, Units.KiloPascals),
                        });
                        break;
                    case DesignCalculationKey.GAS:
                        designCalculationReport[exportKey]['Valves'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': valve.friendlyTypeName(catalog),
                            'Flow Rate': getPsdUnitString(connectedPipeCalc?.gasMJH, Units.MegajoulesPerHour),
                        });
                        break;
                    case DesignCalculationKey.DRAINAGE:
                        designCalculationReport[exportKey]['Valves'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': valve.friendlyTypeName(catalog),
                            'Fixture Units': getPsdUnitString(connectedPipeCalc?.psdUnits?.drainageUnits),
                        });
                        break;
                    default:
                        break;
                }
                break;
            case EntityType.BIG_VALVE:
                const bigValve = o as BigValve;
                // const filledBigValve = fillDefaultBigValveFields(catalog, bigValve.entity, context.document.drawing);
                const bigValveCalc = context.globalStore.getCalculation(bigValve.entity);

                const outPipes = bigValve.getOutPipes();
                const warmOutPipe = outPipes.find((p) => p.entity.systemUid === StandardFlowSystemUids.WarmWater)!;
                const coldOutPipe = outPipes.find((p) => p.entity.systemUid === StandardFlowSystemUids.ColdWater)!;
                const hotOutPipe = outPipes.find((p) => p.entity.systemUid === StandardFlowSystemUids.HotWater)!;

                let bigValveName;

                const suids: string[] = [];
                const bigValveFlowRates: any[] = [];
                const bigValveSizes: any[] = [];
                switch (bigValve.entity.valve.type) {
                    case BigValveType.TMV:
                        bigValveName = "TMV";
                        suids.push(StandardFlowSystemUids.WarmWater, StandardFlowSystemUids.ColdWater);
                        bigValveFlowRates.push(
                            warmOutPipe && context.globalStore.getCalculation(warmOutPipe.entity)!.PSDFlowRateLS,
                            coldOutPipe && context.globalStore.getCalculation(coldOutPipe.entity)!.PSDFlowRateLS,
                        );
                        bigValveSizes.push(
                            bigValveCalc?.mixingValveSizeMM,
                            bigValveCalc?.mixingValveSizeMM,
                        );
                        break;
                    case BigValveType.TEMPERING:
                        bigValveName = "Tempering Valve";
                        suids.push(StandardFlowSystemUids.WarmWater);
                        bigValveFlowRates.push(
                            warmOutPipe && context.globalStore.getCalculation(warmOutPipe.entity)!.PSDFlowRateLS,
                        );
                        bigValveSizes.push(
                            bigValveCalc?.mixingValveSizeMM,
                        );
                        break;
                    case BigValveType.RPZD_HOT_COLD:
                        bigValveName = "RPZD Hot/Cold Valve";
                        suids.push(StandardFlowSystemUids.HotWater, StandardFlowSystemUids.ColdWater);
                        bigValveFlowRates.push(
                            hotOutPipe && context.globalStore.getCalculation(hotOutPipe.entity)!.PSDFlowRateLS,
                            coldOutPipe && context.globalStore.getCalculation(coldOutPipe.entity)!.PSDFlowRateLS,
                        );
                        bigValveSizes.push(
                            bigValveCalc?.rpzdSizeMM && bigValveCalc.rpzdSizeMM[StandardFlowSystemUids.HotWater],
                            bigValveCalc?.rpzdSizeMM && bigValveCalc.rpzdSizeMM[StandardFlowSystemUids.ColdWater],
                        );
                        break;
                }

                switch (exportKey) {
                    case DesignCalculationKey.WATER:
                        for (let i = 0; i < suids.length; i++) {
                            designCalculationReport[exportKey]['Valves'][levelName].push({
                                flowSystemUid,
                                'Reference': i === 0 ? reference : '',
                                'Name': i === 0 ? bigValveName : '',
                                'Size': getPsdUnitString(bigValveSizes[i], Units.Millimeters),
                                'kV Value': getPsdUnitString(null),
                                'Flow Rate': getPsdUnitString(bigValveFlowRates[i], Units.LitersPerSecond),
                                'Pressure Drop': getPsdUnitString(bigValveCalc?.outputs[suids[i]]?.pressureDropKPA, Units.KiloPascals),
                            });
                        }
                        break;
                    case DesignCalculationKey.GAS:
                    case DesignCalculationKey.DRAINAGE:
                    default:
                        break;
                }
                break;
            case EntityType.PLANT:
                const plant = o.entity as PlantEntity;
                const filledPlant = fillPlantDefaults(
                    plant,
                    context.document.drawing,
                    catalog,
                    context.document.entityDependencies.get(plant.uid)
                  );
                const plantCalc = context.globalStore.getCalculation(plant);
                switch (plant.plant.type) {
                    case PlantType.RETURN_SYSTEM:
                        switch (exportKey) {
                            case DesignCalculationKey.GAS:
                                designCalculationReport[exportKey]['Outlets'][levelName].push({
                                    flowSystemUid,
                                    'Reference': reference,
                                    'Name': 'Hot Water Plant',
                                    'Inlet Pressure': getPsdUnitString(plantCalc?.gasPressureKPA, Units.KiloPascals),
                                    'Flow Rates': getPsdUnitString(plantCalc?.gasFlowRateMJH, Units.MegajoulesPerHour),
                                });
                                break;
                            case DesignCalculationKey.DRAINAGE:
                            case DesignCalculationKey.WATER:
                            default:
                                break;
                        }
                    case PlantType.TANK:
                    case PlantType.PUMP:
                    case PlantType.CUSTOM:
                        switch (exportKey) {
                            case DesignCalculationKey.WATER:
                                const outlet = context.globalStore.get(plant.outletUid);
                                const inlet = context.globalStore.get(plant.inletUid);
                                const outletCalc = outlet && context.globalStore.getCalculation(outlet.entity as SystemNodeEntity);
                                const inletCalc = inlet && context.globalStore.getCalculation(inlet.entity as SystemNodeEntity);
                                const plantSize = plantCalc?.size ||
                                    `${filledPlant.widthMM}${Units.Millimeters} (W) x ${filledPlant.heightMM}${Units.Millimeters} (H)`;
                                designCalculationReport[exportKey]['Plants'][levelName].push({
                                    flowSystemUid,
                                    'Reference': reference,
                                    'Type': plant.plant.type,
                                    'Model': getPsdUnitString(plantCalc?.model),
                                    'Inlet Pressure': getPsdUnitString(inletCalc?.pressureKPA, Units.KiloPascals),
                                    'Outlet Pressure': getPsdUnitString(outletCalc?.pressureKPA, Units.KiloPascals),
                                    'Dimensions': plantSize,
                                });
                                break;
                            case DesignCalculationKey.GAS:
                            case DesignCalculationKey.DRAINAGE:
                            default:
                                break;
                        }
                        break;
                    case PlantType.DRAINAGE_PIT:
                        switch (exportKey) {
                            case DesignCalculationKey.DRAINAGE:
                                const plantSize = plantCalc?.size ||
                                    `${filledPlant.widthMM}${Units.Millimeters} (W) x ${filledPlant.heightMM}${Units.Millimeters} (H)`;
                                designCalculationReport[exportKey]['Pits'][levelName].push({
                                    flowSystemUid,
                                    'Reference': reference,
                                    'Name': getEntityName(plant, context.document.drawing),
                                    'Size': plantSize,
                                    'Model': getPsdUnitString(null),
                                });
                                break;
                            default:
                                break;
                        }
                        break;
                    case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                        switch (exportKey) {
                            case DesignCalculationKey.DRAINAGE:
                                designCalculationReport[exportKey]['Pits'][levelName].push({
                                    flowSystemUid,
                                    'Reference': reference,
                                    'Name': getEntityName(plant, context.document.drawing),
                                    'Size': getPsdUnitString(plantCalc?.size),
                                    'Model': getPsdUnitString(plantCalc?.model),
                                });
                                break;
                            default:
                                break;
                        }
                        break;
                    default:
                        break;
                }
                break;
            case EntityType.GAS_APPLIANCE:
                const gasAppliance = o.entity as GasApplianceEntity;
                const filledGasAppliance = fillGasApplianceFields(
                    gasAppliance,
                    context.document.entityDependencies.get(gasAppliance.uid)
                );
                // const gasApplianceCalc = context.globalStore.getOrCreateCalculation(gasAppliance);
                switch (exportKey) {
                    case DesignCalculationKey.GAS:
                        designCalculationReport[exportKey]['Outlets'][levelName].push({
                            flowSystemUid,
                            'Reference': reference,
                            'Name': filledGasAppliance?.name || filledGasAppliance?.abbreviation || '',
                            'Inlet Pressure': getPsdUnitString(filledGasAppliance?.inletPressureKPA, Units.KiloPascals),
                            'Flow Rates': getPsdUnitString(filledGasAppliance?.flowRateMJH, Units.MegajoulesPerHour),
                        });
                        break;
                    case DesignCalculationKey.WATER:
                    case DesignCalculationKey.DRAINAGE:
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    }

    return designCalculationReport;
}

/* Appendix */

export function referenceFilterSettings(currentCalculationFilterSettings: CalculationFilterSettings): CalculationFilterSettings {
    const initReferenceFilterSettings = {...currentCalculationFilterSettings};
    for (const key in initReferenceFilterSettings.view.filters) {
        initReferenceFilterSettings.view.filters[key as FilterSettingViewKeyValues].enabled = false;
    }
    initReferenceFilterSettings.view.filters.reference.enabled = true;

    return initReferenceFilterSettings;
}
