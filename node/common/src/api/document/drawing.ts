import { DrawableEntityConcrete } from "./entities/concrete-entity";
import {
  assertUnreachable,
  ComponentPressureLossMethod,
  EN12056FrequencyFactor,
  InsulationJackets,
  InsulationMaterials,
  isDrainage,
  PIPE_SIZING_METHODS,
  RingMainCalculationMethod,
  StandardFlowSystemUids,
  SupportedDrainageMethods,
  SupportedDwellingStandards,
  SupportedPsdStandards,
} from "../config";
import RiserEntity from "./entities/riser-entity";
import { EntityType } from "./entities/types";
import { Choice, cloneSimple, DeepPartial } from "../../lib/utils";
import { PriceTable } from "../catalog/price-table";
import { SupportedLocales } from "../locale";
import { CurrencySymbol } from "../locale/values";
import {
  EnergyMeasurementSystem,
  f2C,
  ft2M,
  in2MM,
  MeasurementSystem,
  PressureMeasurementSystem,
  VelocityMeasurementSystem,
  VolumeMeasurementSystem,
} from "../../lib/measurements";
import { ReportingStatus } from "../../reporting/ReportingFilter";
import { Document } from "../../models/Document";

export interface Coord {
  x: number;
  y: number;
}

export function coordDist2(a: Coord, b: Coord) {
  return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}

export function coordDist(a: Coord, b: Coord) {
  return Math.sqrt(coordDist2(a, b));
}

export interface Coord3D extends Coord {
  z: number;
}

export interface WithID {
  uid: string;
  reference?: string;
}

export interface NamedEntity {
  entityName: string | null;
}

export interface DrawableEntity extends WithID {
  parentUid: string | null;
  type: EntityType;
}

export interface CenteredEntity extends DrawableEntity {
  center: Coord;
}

export interface ConnectableEntity extends CenteredEntity {
  calculationHeightM: number | null;
}

export interface Level {
  entities: { [key: string]: DrawableEntityConcrete };
  floorHeightM: number;
  name: string;
  abbreviation: string;
  uid: string;
}

/**
 * A drawing is a snapshot of a drawing - its shapes, pipes, fixtures, entities, title, etc, as is.
 */
export interface DrawingState {
  metadata: {
    generalInfo: GeneralInfo;
    units: UnitsParameters;
    flowSystems: FlowSystemParameters[];
    calculationParams: CalculationParameters;
    availableFixtures: string[];
    catalog: Catalog;

    priceTable: DeepPartial<PriceTable>;
  };

  levels: { [key: string]: Level };
  shared: { [key: string]: RiserEntity };
}

export interface UnitsParameters {
  lengthMeasurementSystem: MeasurementSystem;
  pressureMeasurementSystem: PressureMeasurementSystem;
  velocityMeasurementSystem: VelocityMeasurementSystem;
  temperatureMeasurementSystem: MeasurementSystem;
  volumeMeasurementSystem: VolumeMeasurementSystem;
  energyMeasurementSystem: EnergyMeasurementSystem;
  currency: {
    symbol: CurrencySymbol;
    multiplierPct: 100 | 75;
  };
}

export const LENGTH_MEASUREMENT_CHOICES: Choice[] = [
  { name: "Metric (mm)", key: MeasurementSystem.METRIC },
  { name: "Imperial (in, ft)", key: MeasurementSystem.IMPERIAL },
];

export const PRESSURE_MEASUREMENT_CHOICES: Choice[] = [
  { name: "Metric (kpa)", key: PressureMeasurementSystem.METRIC },
  { name: "Imperial (psi)", key: PressureMeasurementSystem.IMPERIAL },
  { name: "UK (bar)", key: PressureMeasurementSystem.UK },
];

export const TEMPERATURE_MEASUREMENT_CHOICES: Choice[] = [
  { name: "Metric (\u00B0C)", key: MeasurementSystem.METRIC },
  { name: "Imperial (\u00B0F)", key: MeasurementSystem.IMPERIAL },
];

export const VELOCITY_MEASUREMENT_CHOICES: Choice[] = [
  { name: "Metric (m/s)", key: VelocityMeasurementSystem.METRIC },
  { name: "Imperial (ft/s)", key: VelocityMeasurementSystem.IMPERIAL },
];

export const VOLUME_MEASUREMENT_CHOICES: Choice[] = [
  { name: "Metric (L)", key: VolumeMeasurementSystem.METRIC },
  { name: "UK Imperial (gal)", key: VolumeMeasurementSystem.IMPERIAL },
  { name: "US Imperial (US gal)", key: VolumeMeasurementSystem.US },
];

export const ENERGY_MEASUREMENT_CHOICES: Choice[] = [
  { name: "Megajoules (mj)", key: EnergyMeasurementSystem.METRIC },
  { name: "Therms (Btu)", key: EnergyMeasurementSystem.IMPERIAL },
];

export interface GeneralInfo {
  title: string;
  projectNumber: string;
  projectStage: string;
  designer: string;
  reviewed: string;
  approved: string;
  revision: number;
  client: string;
  description: string;
  reportingStatus?: ReportingStatus;
}

export interface Color {
  hex: string;
}

export const COLORS = {
  YELLOW: { hex: "#FFFF00" },
};

export enum NetworkType {
  RISERS = "RISERS",
  RETICULATIONS = "RETICULATIONS",
  CONNECTIONS = "CONNECTIONS",
}

export interface NetworkParams {
  velocityMS: number;
  spareCapacityPCT: number;
  material: string;
  minimumPipeSize: number;
}

export interface FlowSystemParametersV8 extends WithID {
  name: string;
  temperature: number;
  color: Color;
  fluid: string;

  networks: { [key in keyof typeof NetworkType]: NetworkParams };
}

export interface FlowSystemParametersV9 extends WithID {
  name: string;
  temperature: number;
  color: Color;
  fluid: string;

  hasReturnSystem: boolean;
  returnIsInsulated: boolean;
  returnMaxVelocityMS: number;
  insulationMaterial: InsulationMaterials;
  insulationThicknessMM: number;

  networks: { [key in keyof typeof NetworkType]: NetworkParams };
}

export interface HorizontalPipeSizing {
  minUnits: number;
  maxUnits: number;
  sizeMM: number;
  gradePCT: number;
}

export interface VentSizing {
  minUnits: number;
  maxUnits: number;
  sizeMM: number;
}

export interface StackPipeSizing {
  minUnits: number;
  maxUnits: number;
  sizeMM: number;
  maximumUnitsPerLevel: number;
}

export interface DrainageProperties {
  ventColor: Color;

  stackSizeDiminish: boolean;
  stackDedicatedVent: boolean;
  maxUnventedLengthM: { [key: number]: number | undefined };
  maxUnventedCapacityWCs: { [key: number]: number | undefined };

  horizontalPipeSizing: HorizontalPipeSizing[];
  availablePipeSizesMM: number[];
  ventSizing: VentSizing[];
  stackPipeSizing: StackPipeSizing[];
  stackVentPipeSizing: VentSizing[];
}

export interface FlowSystemParameters extends WithID {
  name: string;
  temperature: number;
  color: Color;
  fluid: string;

  hasReturnSystem: boolean;
  returnIsInsulated: boolean;
  returnMaxVelocityMS: number;
  insulationMaterial: InsulationMaterials;
  insulationJacket: InsulationJackets;
  insulationThicknessMM: number;

  drainageProperties: DrainageProperties;

  networks: { [key in NetworkType]: NetworkParams };
}

export interface CalculationParameters {
  psdMethod: SupportedPsdStandards;
  loadingUnitVariant: string;
  dwellingMethod: SupportedDwellingStandards | null;
  drainageMethod: SupportedDrainageMethods;
  drainageSystem: "drainageSystem1" | "drainageSystem2" | "drainageSystem3" | "drainageSystem4";
  en12056FrequencyFactor: EN12056FrequencyFactor;
  ringMainCalculationMethod: RingMainCalculationMethod;
  pipeSizingMethod: string;
  componentPressureLossMethod: ComponentPressureLossMethod;
  pipePressureLossAddOnPCT: number;

  ceilingPipeHeightM: number;
  roomTemperatureC: number;
  windSpeedForHeatLossMS: number;
  gravitationalAcceleration: number;
  combineLUs: boolean;
}

export interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Catalog {
  pipes: SelectedMaterialManufacturer[];
  backflowValves: SelectedMaterialManufacturer[];
  mixingValves: SelectedMaterialManufacturer[];
  prv: SelectedMaterialManufacturer[];
  balancingValves: SelectedMaterialManufacturer[];
  hotWaterPlant: SelectedMaterialManufacturer[];
  fixtures: SelectedMaterialManufacturer[];
  greaseInterceptorTrap?: SelectedMaterialManufacturer[];
  floorWaste: SelectedMaterialManufacturer[];
  inspectionOpening: SelectedMaterialManufacturer[];
  [key: string]: SelectedMaterialManufacturer[] | undefined;
}

export interface SelectedMaterialManufacturer {
  uid: string;
  manufacturer: string;
  selected: string | null;
}

export const initialDrainageProperties: DrainageProperties = {
  ventColor: { hex: "#ff7755" },
  availablePipeSizesMM: [40, 50, 65, 80, 100, 125, 150, 225, 300, 375],
  horizontalPipeSizing: [
    { minUnits: 0, maxUnits: 165, sizeMM: 100, gradePCT: 1.65 },
    { minUnits: 166, maxUnits: 855, sizeMM: 150, gradePCT: 1 },
    { minUnits: 856, maxUnits: 1310, sizeMM: 150, gradePCT: 1.65 },
    { minUnits: 1311, maxUnits: 4500, sizeMM: 225, gradePCT: 1 },
    { minUnits: 4501, maxUnits: 11400, sizeMM: 300, gradePCT: 1 },
  ],
  maxUnventedCapacityWCs: {
    40: 2,
    50: 2,
    65: 2,
    80: 2,
    100: 2,
    125: 2,
    150: 2,
    225: 2,
    300: 2,
    375: 2,
  },
  maxUnventedLengthM: {
    40: 10,
    50: 10,
    65: 10,
    80: 10,
    100: 10,
    125: 10,
    150: 10,
    225: 10,
    300: 10,
    375: 10,
  },
  stackDedicatedVent: false,
  stackPipeSizing: [
    { minUnits: 0, maxUnits: 500, sizeMM: 100, maximumUnitsPerLevel: 125 },
    { minUnits: 501, maxUnits: 1000, sizeMM: 125, maximumUnitsPerLevel: 250 },
    { minUnits: 1001, maxUnits: 2400, sizeMM: 150, maximumUnitsPerLevel: 600 },
    { minUnits: 2401, maxUnits: 7000, sizeMM: 225, maximumUnitsPerLevel: 1750 },
  ],
  stackSizeDiminish: false,
  stackVentPipeSizing: [
    { minUnits: 0, maxUnits: 56, sizeMM: 65 },
    { minUnits: 57, maxUnits: 80, sizeMM: 80 },
    { minUnits: 81, maxUnits: 500, sizeMM: 100 },
    { minUnits: 501, maxUnits: 1100, sizeMM: 125 },
    { minUnits: 1101, maxUnits: 2400, sizeMM: 150 },
    { minUnits: 2401, maxUnits: 7000, sizeMM: 225 },
  ],
  ventSizing: [
    { minUnits: 0, maxUnits: 10, sizeMM: 40 },
    { minUnits: 11, maxUnits: 30, sizeMM: 50 },
    { minUnits: 31, maxUnits: 175, sizeMM: 65 },
    { minUnits: 176, maxUnits: 400, sizeMM: 80 },
    { minUnits: 401, maxUnits: 600, sizeMM: 100 },
  ],
};

export const DRAINAGE_FLOW_SYSTEMS: FlowSystemParameters[] = [
  {
    name: "Sewer Drainage",
    temperature: 20,
    color: { hex: "#119911" },
    uid: StandardFlowSystemUids.SewerDrainage,
    fluid: "sewage",
    hasReturnSystem: false,
    returnIsInsulated: false,
    returnMaxVelocityMS: 1,
    insulationMaterial: InsulationMaterials.calciumSilicate,
    insulationJacket: InsulationJackets.allServiceJacket,
    insulationThicknessMM: 25,

    networks: {
      RISERS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "uPVCSewer",
        minimumPipeSize: 15,
      },
      RETICULATIONS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "uPVCSewer",
        minimumPipeSize: 15,
      },
      CONNECTIONS: {
        spareCapacityPCT: 0,
        velocityMS: 3,
        material: "uPVCSewer",
        minimumPipeSize: 16,
      },
    },

    drainageProperties: cloneSimple(initialDrainageProperties),
  },

  {
    name: "Sanitary Plumbing",
    temperature: 20,
    color: { hex: "#66FF66" },
    uid: StandardFlowSystemUids.SanitaryPlumbing,
    fluid: "sewage",
    hasReturnSystem: false,
    returnIsInsulated: false,
    returnMaxVelocityMS: 1,
    insulationMaterial: InsulationMaterials.calciumSilicate,
    insulationJacket: InsulationJackets.allServiceJacket,
    insulationThicknessMM: 25,

    networks: {
      RISERS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "uPVCSewer",
        minimumPipeSize: 15,
      },
      RETICULATIONS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "uPVCSewer",
        minimumPipeSize: 15,
      },
      CONNECTIONS: {
        spareCapacityPCT: 0,
        velocityMS: 3,
        material: "uPVCSewer",
        minimumPipeSize: 16,
      },
    },

    drainageProperties: cloneSimple(initialDrainageProperties),
  },

  {
    name: "Grease Waste",
    temperature: 20,
    color: { hex: "#90403e" },
    uid: StandardFlowSystemUids.GreaseWaste,
    fluid: "sewage",
    hasReturnSystem: false,
    returnIsInsulated: false,
    returnMaxVelocityMS: 1,
    insulationMaterial: InsulationMaterials.calciumSilicate,
    insulationJacket: InsulationJackets.allServiceJacket,
    insulationThicknessMM: 25,

    networks: {
      RISERS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "hdpeSdr11Sewer",
        minimumPipeSize: 15,
      },
      RETICULATIONS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "hdpeSdr11Sewer",
        minimumPipeSize: 15,
      },
      CONNECTIONS: {
        spareCapacityPCT: 0,
        velocityMS: 3,
        material: "hdpeSdr11Sewer",
        minimumPipeSize: 16,
      },
    },

    drainageProperties: cloneSimple(initialDrainageProperties),
  },

  {
    name: "Trade Waste",
    temperature: 20,
    color: { hex: "#a10000" },
    uid: StandardFlowSystemUids.TradeWaste,
    fluid: "sewage",
    hasReturnSystem: false,
    returnIsInsulated: false,
    returnMaxVelocityMS: 1,
    insulationMaterial: InsulationMaterials.calciumSilicate,
    insulationJacket: InsulationJackets.allServiceJacket,
    insulationThicknessMM: 25,

    networks: {
      RISERS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "stainlessSteelSewer",
        minimumPipeSize: 15,
      },
      RETICULATIONS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "stainlessSteelSewer",
        minimumPipeSize: 15,
      },
      CONNECTIONS: {
        spareCapacityPCT: 0,
        velocityMS: 3,
        material: "stainlessSteelSewer",
        minimumPipeSize: 16,
      },
    },

    drainageProperties: cloneSimple(initialDrainageProperties),
  },

  {
    name: "Rising Main",
    temperature: 20,
    color: { hex: "#7100c2" },
    uid: StandardFlowSystemUids.RisingMain,
    fluid: "sewage",
    hasReturnSystem: false,
    returnIsInsulated: false,
    returnMaxVelocityMS: 1,
    insulationMaterial: InsulationMaterials.calciumSilicate,
    insulationJacket: InsulationJackets.allServiceJacket,
    insulationThicknessMM: 25,

    networks: {
      RISERS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "uPVCSewer",
        minimumPipeSize: 15,
      },
      RETICULATIONS: {
        spareCapacityPCT: 0,
        velocityMS: 20,
        material: "uPVCSewer",
        minimumPipeSize: 15,
      },
      CONNECTIONS: {
        spareCapacityPCT: 0,
        velocityMS: 3,
        material: "uPVCSewer",
        minimumPipeSize: 16,
      },
    },

    drainageProperties: cloneSimple(initialDrainageProperties),
  },
];

export function initialDrawing(locale: SupportedLocales): DrawingState {
  const result = cloneSimple(initialAustralianDrawing);
  switch (locale) {
    case SupportedLocales.AU:
      result.metadata.catalog = {
        ...result.metadata.catalog,
        greaseInterceptorTrap: [
          {
            uid: "greaseInterceptorTrap",
            manufacturer: "viking",
            selected: null,
          },
        ],
      };
      break;
    case SupportedLocales.UK:
      result.metadata.calculationParams = {
        ...result.metadata.calculationParams,
        psdMethod: SupportedPsdStandards.bs806,
        drainageMethod: SupportedDrainageMethods.EN1205622000DischargeUnits,
        drainageSystem: "drainageSystem3",
        combineLUs: true,
      };
      // 0 index is cold water.
      result.metadata.flowSystems[0].temperature = 10;
      result.metadata.flowSystems[3].networks = {
        ...result.metadata.flowSystems[3].networks,
        RISERS: {
          ...result.metadata.flowSystems[3].networks.RISERS,
          material: "stainlessSteel",
        },
        RETICULATIONS: {
          ...result.metadata.flowSystems[3].networks.RETICULATIONS,
          material: "stainlessSteel",
        },
      };
      result.metadata.units.currency = {
        symbol: CurrencySymbol.POUNDS,
        multiplierPct: 100,
      };

      // default pipes manufacturers
      result.metadata.catalog.pipes[0].manufacturer = "bsen1057Cu";
      result.metadata.catalog.pipes[1].manufacturer = "enIso15875pex";
      result.metadata.catalog.pipes[2].manufacturer = "bs1387ss";
      result.metadata.units.pressureMeasurementSystem = PressureMeasurementSystem.UK;

      result.metadata.catalog.mixingValves = [
        { manufacturer: "caleffi", uid: "temperingValve", selected: null },
        { manufacturer: "caleffi", uid: "tmv", selected: null },
      ];
      result.metadata.catalog.hotWaterPlant = [
        { uid: "circulatingPumps", manufacturer: "generic", selected: null },
        { uid: "hotWaterPlant", manufacturer: "generic", selected: null },
      ];

      break;
    case SupportedLocales.US:
      result.metadata.units = {
        energyMeasurementSystem: EnergyMeasurementSystem.IMPERIAL,
        lengthMeasurementSystem: MeasurementSystem.IMPERIAL,
        pressureMeasurementSystem: PressureMeasurementSystem.IMPERIAL,
        temperatureMeasurementSystem: MeasurementSystem.IMPERIAL,
        velocityMeasurementSystem: VelocityMeasurementSystem.IMPERIAL,
        volumeMeasurementSystem: VolumeMeasurementSystem.US,
        currency: {
          symbol: CurrencySymbol.DOLLARS,
          multiplierPct: 75,
        },
      };

      result.metadata.calculationParams = {
        ...result.metadata.calculationParams,
        psdMethod: SupportedPsdStandards.upc2018FlushTanks,
        drainageMethod: SupportedDrainageMethods.UPC2018DrainageFixtureUnits,
        combineLUs: true,
      };

      const coldWater = result.metadata.flowSystems.find((item) => item.uid === StandardFlowSystemUids.ColdWater)!;
      coldWater.temperature = f2C(70);
      coldWater.networks.CONNECTIONS.velocityMS =
        coldWater.networks.RISERS.velocityMS =
        coldWater.networks.RETICULATIONS.velocityMS =
          ft2M(8);

      const hotWater = result.metadata.flowSystems.find((item) => item.uid === StandardFlowSystemUids.HotWater)!;
      hotWater.temperature = f2C(140);
      hotWater.insulationThicknessMM = in2MM(1);
      hotWater.insulationMaterial = InsulationMaterials.mineralWool;
      hotWater.returnMaxVelocityMS = ft2M(3);
      hotWater.networks.RISERS.velocityMS =
        hotWater.networks.RETICULATIONS.velocityMS =
        hotWater.networks.CONNECTIONS.velocityMS =
          ft2M(5);

      const warmWater = result.metadata.flowSystems.find((item) => item.uid === StandardFlowSystemUids.WarmWater)!;
      warmWater.temperature = f2C(120);
      warmWater.networks.RISERS.velocityMS =
        warmWater.networks.RETICULATIONS.velocityMS =
        warmWater.networks.CONNECTIONS.velocityMS =
          ft2M(5);

      const gas = result.metadata.flowSystems.find((item) => item.uid === StandardFlowSystemUids.Gas)!;
      gas.networks.RISERS.velocityMS =
        gas.networks.RETICULATIONS.velocityMS =
        gas.networks.CONNECTIONS.velocityMS =
          ft2M(60);

      const fireHydrant = result.metadata.flowSystems.find((item) => item.uid === StandardFlowSystemUids.FireHydrant)!;
      fireHydrant.networks.RISERS.velocityMS =
        fireHydrant.networks.RETICULATIONS.velocityMS =
        fireHydrant.networks.CONNECTIONS.velocityMS =
          ft2M(10);
      fireHydrant.temperature = f2C(70);

      const fireHoseReel = result.metadata.flowSystems.find(
        (item) => item.uid === StandardFlowSystemUids.FireHoseReel
      )!;
      fireHoseReel.networks.RISERS.velocityMS =
        fireHoseReel.networks.RETICULATIONS.velocityMS =
        fireHoseReel.networks.CONNECTIONS.velocityMS =
          ft2M(8);
      fireHoseReel.temperature = f2C(70);

      const sewageAll = result.metadata.flowSystems.filter((item) => isDrainage(item.uid, result.metadata.flowSystems));
      for (const sewage of sewageAll) {
        sewage.temperature = f2C(70);
      }

      result.metadata.calculationParams.ceilingPipeHeightM = ft2M(9);

      for (const flowSystem of result.metadata.flowSystems) {
        // tslint:disable-next-line:forin
        for (const j in flowSystem.drainageProperties.maxUnventedLengthM) {
          flowSystem.drainageProperties.maxUnventedLengthM[j] = ft2M(30);
        }
      }

      result.metadata.catalog.mixingValves = [
        { manufacturer: "caleffi", uid: "temperingValve", selected: null },
        { manufacturer: "caleffi", uid: "tmv", selected: null },
      ];
      result.metadata.catalog.pipes[0].manufacturer = "atsmB88Cu";
      result.metadata.catalog.pipes[1].manufacturer = "atsmF877pex";
      result.metadata.catalog.pipes[2].manufacturer = "bs1387ss";
      result.metadata.catalog.hotWaterPlant = [
        { uid: "circulatingPumps", manufacturer: "generic", selected: null },
        { uid: "hotWaterPlant", manufacturer: "generic", selected: null },
      ];

      result.levels = {
        ground: {
          entities: {},
          floorHeightM: 0,
          name: "Level 1",
          abbreviation: "L1",
          uid: "ground",
        },
      };
      break;
    default:
      assertUnreachable(locale);
  }

  return result;
}

export const initialAustralianDrawing: DrawingState = {
  metadata: {
    generalInfo: {
      title: "Untitled",
      projectNumber: "",
      projectStage: "",
      designer: "",
      reviewed: "",
      approved: "",
      revision: 1,
      client: "",
      description: "",
    },
    units: {
      lengthMeasurementSystem: MeasurementSystem.METRIC,
      volumeMeasurementSystem: VolumeMeasurementSystem.METRIC,
      velocityMeasurementSystem: VelocityMeasurementSystem.METRIC,
      pressureMeasurementSystem: PressureMeasurementSystem.METRIC,
      temperatureMeasurementSystem: MeasurementSystem.METRIC,
      energyMeasurementSystem: EnergyMeasurementSystem.METRIC,
      currency: {
        symbol: CurrencySymbol.DOLLARS,
        multiplierPct: 100,
      },
    },
    flowSystems: [
      // TODO: these values should get got from the database.
      {
        name: "Cold Water",
        temperature: 20,
        color: { hex: "#009CE0" },
        uid: "cold-water",
        fluid: "water",
        hasReturnSystem: false,
        returnIsInsulated: false,
        returnMaxVelocityMS: 1,
        insulationMaterial: InsulationMaterials.mmKemblaInsulation,
        insulationJacket: InsulationJackets.allServiceJacket,
        insulationThicknessMM: 25,

        networks: {
          RISERS: {
            spareCapacityPCT: 0,
            velocityMS: 1.5,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          RETICULATIONS: {
            spareCapacityPCT: 0,
            velocityMS: 1.5,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          CONNECTIONS: {
            spareCapacityPCT: 0,
            velocityMS: 3,
            material: "pexSdr74",
            minimumPipeSize: 16,
          },
        },

        drainageProperties: cloneSimple(initialDrainageProperties),
      },
      {
        name: "Hot Water",
        temperature: 65,
        color: { hex: "#F44E3B" },
        uid: "hot-water",
        fluid: "water",
        hasReturnSystem: true,
        returnIsInsulated: true,
        returnMaxVelocityMS: 1,
        insulationMaterial: InsulationMaterials.mmKemblaInsulation,
        insulationJacket: InsulationJackets.allServiceJacket,
        insulationThicknessMM: 25,

        networks: {
          RISERS: {
            spareCapacityPCT: 0,
            velocityMS: 1.2,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          RETICULATIONS: {
            spareCapacityPCT: 0,
            velocityMS: 1.2,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          CONNECTIONS: {
            spareCapacityPCT: 0,
            velocityMS: 3,
            material: "pexSdr74",
            minimumPipeSize: 16,
          },
        },

        drainageProperties: cloneSimple(initialDrainageProperties),
      },
      {
        name: "Warm Water",
        temperature: 50,
        color: { hex: "#F49000" },
        uid: "warm-water",
        fluid: "water",
        hasReturnSystem: false,
        returnIsInsulated: false,
        returnMaxVelocityMS: 1,
        insulationMaterial: InsulationMaterials.mmKemblaInsulation,
        insulationJacket: InsulationJackets.allServiceJacket,
        insulationThicknessMM: 25,

        networks: {
          RISERS: {
            spareCapacityPCT: 0,
            velocityMS: 1.2,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          RETICULATIONS: {
            spareCapacityPCT: 0,
            velocityMS: 1.2,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          CONNECTIONS: {
            spareCapacityPCT: 0,
            velocityMS: 3,
            material: "pexSdr74",
            minimumPipeSize: 16,
          },
        },

        drainageProperties: cloneSimple(initialDrainageProperties),
      },
      {
        name: "Gas",
        temperature: 20,
        color: { hex: "#FCDC00" },
        uid: StandardFlowSystemUids.Gas,
        fluid: "naturalGas",
        hasReturnSystem: false,
        returnIsInsulated: false,
        returnMaxVelocityMS: 1,
        insulationMaterial: InsulationMaterials.mmKemblaInsulation,
        insulationJacket: InsulationJackets.allServiceJacket,
        insulationThicknessMM: 25,

        networks: {
          RISERS: {
            spareCapacityPCT: 0,
            velocityMS: 20,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          RETICULATIONS: {
            spareCapacityPCT: 0,
            velocityMS: 20,
            material: "copperTypeB",
            minimumPipeSize: 15,
          },
          CONNECTIONS: {
            spareCapacityPCT: 0,
            velocityMS: 3,
            material: "pexSdr74",
            minimumPipeSize: 16,
          },
        },

        drainageProperties: cloneSimple(initialDrainageProperties),
      },
      {
        name: "Fire Hydrant",
        temperature: 20,
        color: { hex: "#9F0500" },
        uid: StandardFlowSystemUids.FireHydrant,
        fluid: "water",
        hasReturnSystem: false,
        returnIsInsulated: false,
        returnMaxVelocityMS: 1,
        insulationMaterial: InsulationMaterials.calciumSilicate,
        insulationJacket: InsulationJackets.allServiceJacket,
        insulationThicknessMM: 25,
        networks: {
          RISERS: {
            spareCapacityPCT: 0,
            velocityMS: 4,
            material: "gmsMedium",
            minimumPipeSize: 100,
          },
          RETICULATIONS: {
            spareCapacityPCT: 0,
            velocityMS: 4,
            material: "gmsMedium",
            minimumPipeSize: 100,
          },
          CONNECTIONS: {
            spareCapacityPCT: 0,
            velocityMS: 4,
            material: "gmsMedium",
            minimumPipeSize: 100,
          },
        },
        drainageProperties: cloneSimple(initialDrainageProperties),
      },
      {
        name: "Fire Hose Reel",
        temperature: 20,
        color: { hex: "#FCDC00" },
        uid: StandardFlowSystemUids.FireHoseReel,
        fluid: "water",
        hasReturnSystem: false,
        returnIsInsulated: false,
        returnMaxVelocityMS: 1,
        insulationMaterial: InsulationMaterials.calciumSilicate,
        insulationJacket: InsulationJackets.allServiceJacket,
        insulationThicknessMM: 25,

        networks: {
          RISERS: {
            spareCapacityPCT: 0,
            velocityMS: 1.5,
            material: "copperTypeB",
            minimumPipeSize: 25,
          },
          RETICULATIONS: {
            spareCapacityPCT: 0,
            velocityMS: 1.5,
            material: "copperTypeB",
            minimumPipeSize: 25,
          },
          CONNECTIONS: {
            spareCapacityPCT: 0,
            velocityMS: 1.5,
            material: "copperTypeB",
            minimumPipeSize: 25,
          },
        },

        drainageProperties: cloneSimple(initialDrainageProperties),
      },
      ...DRAINAGE_FLOW_SYSTEMS,
    ],
    calculationParams: {
      psdMethod: SupportedPsdStandards.as35002018LoadingUnits,
      loadingUnitVariant: "low",
      dwellingMethod: null,
      drainageMethod: SupportedDrainageMethods.AS2018FixtureUnits,
      drainageSystem: "drainageSystem1",
      en12056FrequencyFactor: EN12056FrequencyFactor.CongestedUse,
      ringMainCalculationMethod: RingMainCalculationMethod.ISOLATION_CASES,
      pipeSizingMethod: PIPE_SIZING_METHODS[0].key as string,
      componentPressureLossMethod: ComponentPressureLossMethod.INDIVIDUALLY,
      pipePressureLossAddOnPCT: 0,

      ceilingPipeHeightM: 3.0,
      roomTemperatureC: 20,
      windSpeedForHeatLossMS: 0,
      gravitationalAcceleration: 9.80665,
      combineLUs: false,
    },
    availableFixtures: ["basin", "bath", "shower", "kitchenSink", "wc", "washingMachine", "laundryTrough"],
    catalog: {
      pipes: [
        { manufacturer: "kemblaCu", uid: "copperTypeB", selected: null },
        { manufacturer: "rehauPex", uid: "pexSdr74", selected: null },
        { manufacturer: "kemblaS/s", uid: "stainlessSteel", selected: null },
        { manufacturer: "blucherSS", uid: "stainlessSteelSewer", selected: null },
      ],
      backflowValves: [{ manufacturer: "apolloRpzd", uid: "RPZD", selected: null }],
      mixingValves: [
        { manufacturer: "caleffi", uid: "temperingValve", selected: null },
        { manufacturer: "enware", uid: "tmv", selected: null },
      ],
      prv: [{ manufacturer: "caleffi", uid: "prv", selected: null }],
      balancingValves: [{ manufacturer: "cimberio", uid: "balancingValves", selected: null }],
      hotWaterPlant: [
        { uid: "circulatingPumps", manufacturer: "grundfos", selected: null },
        { uid: "hotWaterPlant", manufacturer: "rheem", selected: null },
      ],
      fixtures: [],
      floorWaste: [{ manufacturer: "blucher", uid: "floorWaste", selected: null }],
      inspectionOpening: [{ manufacturer: "blucher", uid: "inspectionOpening", selected: null }],
    },
    priceTable: {},
  },
  levels: {
    ground: {
      entities: {},
      floorHeightM: 0,
      name: "Ground Floor",
      abbreviation: "G",
      uid: "ground",
    },
  },
  shared: {},
};
