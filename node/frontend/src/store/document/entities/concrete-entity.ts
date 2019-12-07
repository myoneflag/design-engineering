import {BackgroundEntity} from '../../../../src/store/document/entities/background-entity';
import FittingEntity from '../../../../src/store/document/entities/fitting-entity';
import PipeEntity from '../../../../src/store/document/entities/pipe-entity';
import FlowSourceEntity from '../../../../src/store/document/entities/flow-source-entity';
import PopupEntity from '../../../../src/store/document/entities/calculations/popup-entity';
import FixtureEntity from '../../../../src/store/document/entities/fixtures/fixture-entity';
import TmvEntity, {SystemNodeEntity} from '../../../../src/store/document/entities/tmv/tmv-entity';
import {CenteredEntity, ConnectableEntity} from '../../../../src/store/document/types';
import FlowSourceCalculation from '../../../../src/store/document/calculations/flow-source-calculation';
import PipeCalculation from '../../../../src/store/document/calculations/pipe-calculation';
import TmvCalculation from '../../../../src/store/document/calculations/tmv-calculation';
import FittingCalculation from '../../../../src/store/document/calculations/fitting-calculation';
import FixtureCalculation from '../../../../src/store/document/calculations/fixture-calculation';
import DirectedValveEntity from '../../../../src/store/document/entities/directed-valves/directed-valve-entity';
import SystemNodeCalculation from '../../../../src/store/document/calculations/system-node-calculation';

export type DrawableEntityConcrete =
    BackgroundEntity |
    FittingEntity |
    PipeEntity |
    FlowSourceEntity |
    PopupEntity |
    SystemNodeEntity |
    TmvEntity |
    FixtureEntity |
    DirectedValveEntity;


export type ConnectableEntityConcrete =
    FittingEntity |
    FlowSourceEntity |
    SystemNodeEntity |
    DirectedValveEntity;

export type CenteredEntityConcrete =
    BackgroundEntity |
    FittingEntity |
    FlowSourceEntity |
    SystemNodeEntity |
    TmvEntity |
    FixtureEntity |
    PopupEntity |
    DirectedValveEntity;

export type InvisibleNodeEntityConcrete =
    SystemNodeEntity;

export type CalculatableEntityConcrete =
    FlowSourceEntity |
    PipeEntity |
    TmvEntity |
    FittingEntity |
    FixtureEntity |
    DirectedValveEntity |
    SystemNodeEntity;

export type CalculationConcrete =
    FlowSourceCalculation |
    PipeCalculation |
    PipeCalculation |
    TmvCalculation |
    FittingCalculation |
    FixtureCalculation |
    SystemNodeCalculation;
