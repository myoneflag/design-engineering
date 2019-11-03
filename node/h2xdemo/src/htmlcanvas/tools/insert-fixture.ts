import {Coord, DocumentState} from '@/store/document/types';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt, parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';
import FixtureEntity from '@/store/document/entities/fixtures/fixture-entity';
import {FlowConfiguration, SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {StandardFlowSystemUids} from '@/store/catalog';
import {SupportedPsdStandards} from '@/config';
import {KeyCode} from '@/htmlcanvas/utils';

export default function insertFixture(
    context: CanvasContext,
    fixtureName: string,
    angle: number,
) {
    const coldUid = uuid();
    const warmUid = uuid();
    const fixtureUid = uuid();
    let newEntity: FixtureEntity | null = null;

    let hasWarm = false;
    if (parseCatalogNumberExact(
        context.effectiveCatalog.fixtures[fixtureName].loadingUnits[SupportedPsdStandards.as35002018LoadingUnits].hot,
        )) {
        hasWarm = true;
    }
    const abbreviation =  context.effectiveCatalog.fixtures[fixtureName].abbreviation;

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
            if (interrupted) {
                context.$store.dispatch('document/revert');
                if (!displaced) {
                    MainEventBus.$emit('set-tool-handler', null);
                }
            } else {
                insertFixture(context, fixtureName, angle);
            }
        },
        (wc: Coord) => {
            newEntity = null;
            // Preview
            context.$store.dispatch('document/revert', false);
            const doc = context.document as DocumentState;

            // Maybe we drew onto a background
            const [parentUid, oc] = getInsertCoordsAt(context, wc);

            newEntity = {
                abbreviation,
                center: oc,
                parentUid,
                type: EntityType.FIXTURE,
                uid: fixtureUid,

                coldRoughInUid: coldUid,
                fixtureUnits: null,
                loadingUnitsCold: null,
                loadingUnitsHot: null,
                designFlowRateCold: null,
                designFlowRateHot: null,

                maxInletPressureKPA: null,
                minInletPressureKPA: null,
                name: fixtureName,
                outletAboveFloorM: null,
                pipeDistanceMM: 200,
                probabilityOfUsagePCT: null,
                rotation: angle,
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
                configuration: FlowConfiguration.INPUT,
            };


            context.$store.dispatch('document/addEntity', newEntity);
            context.$store.dispatch('document/addEntity', coldEntity);

            if (hasWarm) {
                const warmEntity: SystemNodeEntity = {
                    center: {x: newEntity.pipeDistanceMM / 2, y: 0},
                    connections: [],
                    parentUid: fixtureUid,
                    type: EntityType.SYSTEM_NODE,
                    systemUid: StandardFlowSystemUids.WarmWater,
                    uid: warmUid,
                    configuration: FlowConfiguration.INPUT,
                };

                context.$store.dispatch('document/addEntity', warmEntity);
            }

            context.processDocument();
        },
        (wc: Coord) => {

            context.$store.dispatch('document/commit');
        },
        'Insert Fixture',
        [
            [KeyCode.SHIFT, {name: '+ Precise Rotating', fn: (event: KeyboardEvent) => { /* */ }}],
            [KeyCode.RIGHT, {name: 'Rotate Clockwise', fn: (event: KeyboardEvent, onRefresh: () => void) => {
                    if (event.shiftKey || event.ctrlKey) {
                        angle += 1;
                    } else {
                        angle += 15;
                    }
                    onRefresh();
                }}],
            [KeyCode.LEFT, {name: 'Rotate Counter-clockwise', fn: (event: KeyboardEvent, onRefresh: () => void) => {
                    if (event.shiftKey || event.ctrlKey) {
                        angle -= 1;
                    } else {
                        angle -= 15;
                    }
                    onRefresh();
                }}],
        ],
    ));
}
