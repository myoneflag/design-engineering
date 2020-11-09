import {assertUnreachable} from "../config";

export interface PriceTable {
  'Insulation': {[key: number]: number};
  'Pipes': PipesTable;
  'Valves': ValvesTable;
  'Fittings': FittingsTable;
  'Fixtures': {[key: string]: number};
  'Plants': PlantTable;
  'Equipment': EquipmentTable;
  'Node': NodeTable;
}

export interface PipesBySize {[key: number]: number;}

export interface NodeTable {
    'Dwelling Node - Hot': number;
    'Dwelling Node - Cold': number;
    'Dwelling Node - Other': number;
    'Load Node - Hot': number;
    'Load Node - Cold': number;
    'Load Node - Other': number;
    'Continuous Flow Node': number;
}

export type PipeMaterials =
    | 'PEX'
    | 'Copper'
    | 'Stainless Steel'
    | 'HDPE'
    | 'GMS'
    | 'Cast Iron'
    | 'Stainless Steel (Sewer)'
    | 'uPVC (Sewer)'
    | 'HDPE (Sewer)'
    | 'Cast Iron (Sewer)';

export type ValveByPipe = {
    [key in PipeMaterials]: PipesBySize;
};

export interface PlantTable {
    'Hot Water Plant': number;
    'Storage Tank': number;
    'Pump': number;
    'Custom': number;
}

export type PipesTable = {
    [key in PipeMaterials]: PipesBySize;
};

export interface FixturesTable {
    'Ablution Trough': number;
    'Basin': number;
    'Bath': number;
    'Bedpan Sanitiser': number;
    'Beverage Bay': number;
    'Birthing Pool': number;
    'Cleaners Sink': number;
    'Dishwasher': number;
    'Drinking Fountain': number;
    'Flushing Rim Sink': number;
    'Hose Tap': number;
    'Kitchen Sink': number;
    'Laundry Trough': number;
    'Shower': number;
    'Urinal': number;
    'Washing Machine': number;
    'WC': number;
}

export interface ValvesTable {
    'Brass Ball Valve': {[key: number]: number};
    'Brass Gate Valve': {[key: number]: number};
    'Butterfly Valve': {[key: number]: number};
    'Water Meter': {[key: number]: number};
    'Strainer': {[key: number]: number};
    'Check Valve': {[key: number]: number};
}

export interface FittingsTable {
    'Tee': ValveByPipe;
    'Elbow': ValveByPipe;
    'Reducer': ValveByPipe;
}

export interface EquipmentTable {
    'PRV': {[key: number]: number};
    'TMV': number;
    'RPZD': {[key: number]: number};
    'Tempering Valve': number;
    'Balancing Valve': {[key: number]: number};
    'Reflux Valve': {[key: number]: number};
    'Gas Meter': number;
    'Gas Regulator': number;
    'Gas Filter': number;
    'Inspection Opening': number;
    'Floor Waste': number;
    'Drainage Pit': number;
}

export function getEquipmentTitle(name: keyof EquipmentTable): string {
    switch (name) {
        case "PRV":
            return "PRV - Pressure Reduction Valves";
        case "TMV":
            return "TMV - Thermostatic Mixing Valves";
        case "RPZD":
            return "RPZD - Reduced Pressure Zone Device";
        case "Tempering Valve":
            return "Tempering Valves";
        case "Balancing Valve":
            return "Balancing Valves";
        case "Gas Filter":
            return "Gas Filters";
        case "Gas Meter":
            return "Gas Meters";
        case "Gas Regulator":
            return "Gas Regulators";
        case "Floor Waste":
            return 'Floor Wastes';
        case "Reflux Valve":
            return 'Reflux Valves';
        case "Inspection Opening":
            return 'Inspection Openings';
        case "Drainage Pit":
            return 'Drainage Pit';
    }
    assertUnreachable(name);
}

export function getEquipmentDescription(name: keyof EquipmentTable): string {
    switch (name) {
        case "PRV":
            return "PRV - Pressure Reduction Valve";
        case "TMV":
            return "TMV - Thermostatic Mixing Valve - All Sizes";
        case "RPZD":
            return "RPZD - Reduced Pressure Zone Device";
        case "Tempering Valve":
            return "Tempering Valve - All Sizes";
        case "Balancing Valve":
            return "Balancing Valve";
        case "Gas Filter":
            return "Gas Filter - All Sizes";
        case "Gas Meter":
            return "Gas Meter - All Sizes";
        case "Gas Regulator":
            return "Gas Regulator - All Sizes";
        case "Floor Waste":
            return 'Typical floor waste including grating and trap';
        case "Reflux Valve":
            return 'Reflux Valve';
        case "Inspection Opening":
            return 'Inspection Opening';
        case "Drainage Pit":
            return 'Allowance for drainage pit, engineer to define size and specification';
    }
    assertUnreachable(name);
}