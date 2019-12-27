import {BackgroundEntity} from '../../../../src/store/document/entities/background-entity';
import FittingEntity from '../../../../src/store/document/entities/fitting-entity';
import PipeEntity from '../../../../src/store/document/entities/pipe-entity';
import RiserEntity from './riser-entity';
import FixtureEntity from '../../../../src/store/document/entities/fixtures/fixture-entity';
import TmvEntity, {SystemNodeEntity} from '../../../../src/store/document/entities/tmv/tmv-entity';
import {CenteredEntity, ConnectableEntity, FlowSystemParameters} from '../../../../src/store/document/types';
import RiserCalculation from '../calculations/riser-calculation';
import PipeCalculation from '../../../../src/store/document/calculations/pipe-calculation';
import TmvCalculation from '../../../../src/store/document/calculations/tmv-calculation';
import FittingCalculation from '../../../../src/store/document/calculations/fitting-calculation';
import FixtureCalculation from '../../../../src/store/document/calculations/fixture-calculation';
import DirectedValveEntity from '../../../../src/store/document/entities/directed-valves/directed-valve-entity';
import SystemNodeCalculation from '../../../../src/store/document/calculations/system-node-calculation';
import LoadNodeEntity from "./load-node-entity";
import LoadNodeCalculation from "../calculations/load-node-calculation";

export type DrawableEntityConcrete =
    BackgroundEntity |
    FittingEntity |
    PipeEntity |
    RiserEntity |
    SystemNodeEntity |
    TmvEntity |
    FixtureEntity |
    DirectedValveEntity |
    LoadNodeEntity;


export type ConnectableEntityConcrete =
    FittingEntity |
    RiserEntity |
    SystemNodeEntity |
    DirectedValveEntity |
    LoadNodeEntity;

export type CenteredEntityConcrete =
    BackgroundEntity |
    FittingEntity |
    RiserEntity |
    SystemNodeEntity |
    TmvEntity |
    FixtureEntity |
    DirectedValveEntity |
    LoadNodeEntity;

export type InvisibleNodeEntityConcrete =
    SystemNodeEntity;

export type CalculatableEntityConcrete =
    RiserEntity |
    PipeEntity |
    TmvEntity |
    FittingEntity |
    FixtureEntity |
    DirectedValveEntity |
    SystemNodeEntity |
    LoadNodeEntity;

export type CalculationConcrete =
    RiserCalculation |
    PipeCalculation |
    PipeCalculation |
    TmvCalculation |
    FittingCalculation |
    FixtureCalculation |
    SystemNodeCalculation |
    LoadNodeCalculation;

export type EdgeLikeEntity =
    PipeEntity |
    FixtureEntity |
    TmvEntity;
