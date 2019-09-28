import {Coord, DocumentState} from '@/store/document/types';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';
import FixtureEntity from '@/store/document/entities/fixtures/fixture-entity';
import {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {StandardFlowSystemUids} from '@/store/catalog';
import SystemNode from '@/htmlcanvas/objects/tmv/system-node';

export default function insertFixture(
    context: CanvasContext,
    fixtureName: string,
) {
    const coldUid = uuid();
    const warmUid = uuid();
    const fixtureUid = uuid();

    let hasWarm = true;
    if (fixtureName === 'wc') {
        hasWarm = false;
    }

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted) => {
            MainEventBus.$emit('set-tool-handler', null);
        },
        (wc: Coord) => {
            // Preview
        },
        (wc: Coord) => {
            const doc = context.document as DocumentState;

            // Maybe we drew onto a background
            const [parentUid, oc] = getInsertCoordsAt(context, wc);

            const newEntity: FixtureEntity = {
                center: oc,
                parentUid,
                type: EntityType.FIXTURE,
                uid: fixtureUid,


                coldRoughInUid: coldUid,
                fixtureUnits: null,
                loadingUnitsCold: null,
                loadingUnitsHot: null,
                maxInletPressureKPA: null,
                minInletPressureKPA: null,
                name: fixtureName,
                outletAboveFloorM: null,
                pipeDistanceMM: 200,
                probabilityOfUsagePCT: null,
                rotation: 0,
                warmRoughInUid: hasWarm ? warmUid : null,
                warmTempC: null,
                calculation: null,
            };


            const coldEntity: SystemNodeEntity = {
                center: hasWarm ? {x: -newEntity.pipeDistanceMM / 2, y: 0} : {x: 0, y: 0},
                connections: [],
                parentUid: fixtureUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.ColdWater,
                uid: coldUid,
            };

            doc.drawing.entities.push(newEntity, coldEntity);

            if (hasWarm) {
                const warmEntity: SystemNodeEntity = {
                    center: {x: newEntity.pipeDistanceMM / 2, y: 0},
                    connections: [],
                    parentUid: fixtureUid,
                    type: EntityType.SYSTEM_NODE,
                    systemUid: StandardFlowSystemUids.WarmWater,
                    uid: warmUid,
                };

                doc.drawing.entities.push(warmEntity);
            }

            context.$store.dispatch('document/commit');
        },
    ));
}
