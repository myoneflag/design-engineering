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

export interface ValveByPipe {
    'PEX': PipesBySize;
    'Copper': PipesBySize;
    'Stainless Steel': PipesBySize;
    'HDPE': PipesBySize;
    'GMS': PipesBySize;
    'Cast Iron': PipesBySize;
}

export interface PlantTable {
    'Hot Water Plant': number;
    'Storage Tank': number;
    'Pump': number;
    'Custom': number;
}

export interface PipesTable {
    'PEX': PipesBySize;
    'Copper': PipesBySize;
    'Stainless Steel': PipesBySize;
    'HDPE': PipesBySize;
    'GMS': PipesBySize;
    'Cast Iron': PipesBySize;
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
}

export function getEquimentFullName(name: keyof EquipmentTable): string {
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
    }
    assertUnreachable(name);
}