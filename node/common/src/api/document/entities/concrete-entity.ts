import { BackgroundEntity } from "./background-entity";
import FittingEntity from "./fitting-entity";
import PipeEntity from "./pipe-entity";
import RiserEntity from "./riser-entity";
import FixtureEntity from "./fixtures/fixture-entity";
import BigValveEntity, { SystemNodeEntity } from "./big-valve/big-valve-entity";
import DirectedValveEntity from "./directed-valves/directed-valve-entity";
import LoadNodeEntity from "./load-node-entity";
import FlowSourceEntity from "./flow-source-entity";
import PlantEntity from "./plants/plant-entity";
import { EntityType } from "./types";
import { assertUnreachable } from "../../config";
import GasApplianceEntity from "./gas-appliance";

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
    | PlantEntity
    | GasApplianceEntity;

export type ConnectableEntityConcrete =
    | FittingEntity
    | RiserEntity
    | SystemNodeEntity
    | DirectedValveEntity
    | LoadNodeEntity
    | FlowSourceEntity;

export type HasExplicitSystemUid = FittingEntity | RiserEntity | SystemNodeEntity | PipeEntity | FlowSourceEntity;

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
    | PlantEntity
    | GasApplianceEntity;

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
    | PlantEntity
    | GasApplianceEntity;

export type EdgeLikeEntity = PipeEntity | FixtureEntity | BigValveEntity | PlantEntity | GasApplianceEntity;

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
        case EntityType.GAS_APPLIANCE:
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
        case EntityType.GAS_APPLIANCE:
        case EntityType.PLANT:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            return false;
    }
    assertUnreachable(e);
}

export function isCenteredEntity(e: DrawableEntityConcrete): e is CenteredEntityConcrete {
    switch (e.type) {
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.DIRECTED_VALVE:
        case EntityType.FLOW_SOURCE:
        case EntityType.LOAD_NODE:
        case EntityType.BIG_VALVE:
        case EntityType.FIXTURE:
        case EntityType.GAS_APPLIANCE:
        case EntityType.PLANT:
            return true;
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
        case EntityType.GAS_APPLIANCE:
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
        case EntityType.GAS_APPLIANCE:
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
