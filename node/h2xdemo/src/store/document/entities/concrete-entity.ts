import {BackgroundEntity} from '@/store/document/entities/background-entity';
import ValveEntity from '@/store/document/entities/valve-entity';
import PipeEntity from '@/store/document/entities/pipe-entity';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import PopupEntity from '@/store/document/entities/calculations/popup-entity';
import FixtureEntity from '@/store/document/entities/fixtures/fixture-entity';
import TmvEntity, {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {CenteredEntity, ConnectableEntity} from '@/store/document/types';

export type DrawableEntityConcrete =
    BackgroundEntity |
    ValveEntity |
    PipeEntity |
    FlowSourceEntity |
    PopupEntity |
    SystemNodeEntity |
    TmvEntity |
    FixtureEntity;


export type ConnectableEntityConcrete =
    ValveEntity |
    FlowSourceEntity |
    SystemNodeEntity;

export type CenteredEntityConcrete =
    BackgroundEntity |
    ValveEntity |
    FlowSourceEntity |
    SystemNodeEntity |
    TmvEntity |
    FixtureEntity |
    PopupEntity;

export type InvisibleNodeEntityConcrete =
    SystemNodeEntity;
