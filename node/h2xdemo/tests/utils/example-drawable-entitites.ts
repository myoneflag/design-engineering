import PipeEntity from '../../src/store/document/entities/pipe-entity';
import {EntityType} from '@/store/document/entities/types';
import {StandardFlowSystemUids} from '@/store/catalog';
import {BackgroundEntity} from '@/store/document/entities/background-entity';

export const examplePipeEntity: PipeEntity = {
    calculation: null,
    color: null,
    diameterMM: null,
    endpointUid: ["pipe1ep1", "pipe1ep2"],
    heightAboveFloorM: 0,
    lengthM: null,
    material: null,
    maximumVelocityMS: null,
    parentUid: null,
    systemUid: StandardFlowSystemUids.ColdWater,
    type: EntityType.PIPE,
    uid: "pipe1",
};
