import { BackgroundEntity } from "../../../../src/store/document/entities/background-entity";
import FittingEntity from "../../../../src/store/document/entities/fitting-entity";
import PipeEntity from "../../../../src/store/document/entities/pipe-entity";
import RiserEntity from "./riser-entity";
import FixtureEntity from "../../../../src/store/document/entities/fixtures/fixture-entity";
import BigValveEntity, { SystemNodeEntity } from "./big-valve/big-valve-entity";
import RiserCalculation from "../calculations/riser-calculation";
import PipeCalculation from "../../../../src/store/document/calculations/pipe-calculation";
import BigValveCalculation from "../calculations/big-valve-calculation";
import FittingCalculation from "../../../../src/store/document/calculations/fitting-calculation";
import FixtureCalculation from "../../../../src/store/document/calculations/fixture-calculation";
import DirectedValveEntity from "../../../../src/store/document/entities/directed-valves/directed-valve-entity";
import SystemNodeCalculation from "../../../../src/store/document/calculations/system-node-calculation";
import LoadNodeEntity from "./load-node-entity";
import LoadNodeCalculation from "../calculations/load-node-calculation";
import FlowSourceCalculation from "../calculations/flow-source-calculation";
import FlowSourceEntity from "./flow-source-entity";
import PlantEntity from "./plant-entity";
import { EntityType } from "./types";
import { assertUnreachable } from "../../../config";
import PlantCalculation from "../calculations/plant-calculation";

export type DrawableEntityConcrete =
    | BackgroundEntity
    | FittingEntity
    | PipeEntity
    | RiserEntity
    | SystemNodeEntity
    | BigValveEntity
    | FixtureEntity
    | DirectedValveEntity
    | LoadNodeEntity
    | FlowSourceEntity
    | PlantEntity;

export type ConnectableEntityConcrete =
    | FittingEntity
    | RiserEntity
    | SystemNodeEntity
    | DirectedValveEntity
    | LoadNodeEntity
    | FlowSourceEntity;

export type HasExplicitSystemUid =
    | FittingEntity
    | RiserEntity
    | SystemNodeEntity
    | PipeEntity
    | FlowSourceEntity;

export type CenteredEntityConcrete =
    | BackgroundEntity
    | FittingEntity
    | RiserEntity
    | SystemNodeEntity
    | BigValveEntity
    | FixtureEntity
    | DirectedValveEntity
    | LoadNodeEntity
    | FlowSourceEntity
    | PlantEntity;

export type InvisibleNodeEntityConcrete = SystemNodeEntity;

export type CalculatableEntityConcrete =
    | RiserEntity
    | PipeEntity
    | BigValveEntity
    | FittingEntity
    | FixtureEntity
    | DirectedValveEntity
    | SystemNodeEntity
    | LoadNodeEntity
    | FlowSourceEntity
    | PlantEntity;

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

export type EdgeLikeEntity = PipeEntity | FixtureEntity | BigValveEntity | PlantEntity;

export function isConnectableEntityType(eType: EntityType) {
    switch (eType) {
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.DIRECTED_VALVE:
        case EntityType.FLOW_SOURCE:
        case EntityType.RETURN:
        case EntityType.LOAD_NODE:
            return true;
        case EntityType.BIG_VALVE:
        case EntityType.FIXTURE:
        case EntityType.PLANT:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            return false;
    }
    assertUnreachable(eType);
}

export function isConnectableEntity(e: DrawableEntityConcrete): e is ConnectableEntityConcrete {
    switch (e.type) {
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.DIRECTED_VALVE:
        case EntityType.FLOW_SOURCE:
        case EntityType.LOAD_NODE:
            return true;
        case EntityType.BIG_VALVE:
        case EntityType.FIXTURE:
        case EntityType.PLANT:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            return false;
    }
    assertUnreachable(e);
}

export function hasExplicitSystemUid(e: DrawableEntityConcrete): e is HasExplicitSystemUid {
    switch (e.type) {
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.FLOW_SOURCE:
        case EntityType.PIPE:
            return true;
        case EntityType.DIRECTED_VALVE:
        case EntityType.LOAD_NODE:
        case EntityType.BIG_VALVE:
        case EntityType.FIXTURE:
        case EntityType.PLANT:
        case EntityType.BACKGROUND_IMAGE:
            return false;
    }
}

export function isCentered(type: EntityType): boolean {
    switch (type) {
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.RETURN:
        case EntityType.BIG_VALVE:
        case EntityType.FIXTURE:
        case EntityType.FLOW_SOURCE:
        case EntityType.PLANT:
        case EntityType.LOAD_NODE:
        case EntityType.DIRECTED_VALVE:
            return true;
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            return false;
    }
    assertUnreachable(type);
}
