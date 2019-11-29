import {BackgroundEntity} from '@/store/document/entities/background-entity';
import FittingEntity from '@/store/document/entities/fitting-entity';
import PipeEntity from '@/store/document/entities/pipe-entity';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import PopupEntity from '@/store/document/entities/calculations/popup-entity';
import FixtureEntity from '@/store/document/entities/fixtures/fixture-entity';
import TmvEntity, {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {CenteredEntity, ConnectableEntity} from '@/store/document/types';
import FlowSourceCalculation from '@/store/document/calculations/flow-source-calculation';
import PipeCalculation from '@/store/document/calculations/pipe-calculation';
import TmvCalculation from '@/store/document/calculations/tmv-calculation';
import FittingCalculation from '@/store/document/calculations/fitting-calculation';
import FixtureCalculation from '@/store/document/calculations/fixture-calculation';
import DirectedValveEntity from '@/store/document/entities/directed-valves/directed-valve-entity';
import SystemNodeCalculation from '@/store/document/calculations/system-node-calculation';

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
