import RiserCalculation from "./riser-calculation";
import PipeCalculation from "./pipe-calculation";
import BigValveCalculation from "./big-valve-calculation";
import FittingCalculation from "./fitting-calculation";
import FixtureCalculation from "./fixture-calculation";
import SystemNodeCalculation from "./system-node-calculation";
import LoadNodeCalculation from "./load-node-calculation";
import FlowSourceCalculation from "./flow-source-calculation";
import PlantCalculation from "./plant-calculation";

export type CalculationConcrete =
    | RiserCalculation
    | PipeCalculation
    | PipeCalculation
    | BigValveCalculation
    | FittingCalculation
    | FixtureCalculation
    | SystemNodeCalculation
    | LoadNodeCalculation
    | FlowSourceCalculation
    | PlantCalculation;
