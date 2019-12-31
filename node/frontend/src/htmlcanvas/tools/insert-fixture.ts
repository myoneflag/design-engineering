import {Coord, DocumentState} from '../../../src/store/document/types';
import {MainEventBus} from '../../../src/store/main-event-bus';
import PointTool from '../../../src/htmlcanvas/tools/point-tool';
import {EntityType} from '../../../src/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt, parseCatalogNumberExact} from '../../../src/htmlcanvas/lib/utils';
import FixtureEntity from '../../../src/store/document/entities/fixtures/fixture-entity';
import {FlowConfiguration, SystemNodeEntity} from '../../store/document/entities/big-valve/big-valve-entity';
import {StandardFlowSystemUids} from '../../../src/store/catalog';
import {SupportedPsdStandards} from '../../../src/config';
import {KeyCode} from '../../../src/htmlcanvas/utils';

export default function insertFixture(
    context: CanvasContext,
    fixtureName: string,
    angle: number,
) {
    const fixtureUid = uuid();
    let newEntity: FixtureEntity | null = null;
    const abbreviation =  context.effectiveCatalog.fixtures[fixtureName].abbreviation;

    MainEventBus.$emit('set-tool-handler', new PointTool(
        async (interrupted, displaced) => {
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

            newEntity = {
                abbreviation,
                center: wc,
                parentUid: null,
                type: EntityType.FIXTURE,
                uid: fixtureUid,

                fixtureUnits: null,

                name: fixtureName,
                outletAboveFloorM: null,
                pipeDistanceMM: 200,
                probabilityOfUsagePCT: null,
                rotation: angle,
                warmTempC: null,
                roughInsInOrder: context.effectiveCatalog.fixtures[fixtureName].roughIns,
                roughIns: {},
            };

            for (const suid of newEntity.roughInsInOrder) {
                newEntity.roughIns[suid] = {
                    continuousFlowLS: null,
                    designFlowRateLS: null,
                    loadingUnits: null,
                    maxPressureKPA: null,
                    minPressureKPA: null,
                    uid: uuid(),
                }
            }

            context.$store.dispatch('document/addEntity', newEntity);


            for (let i = 0; i < newEntity.roughInsInOrder.length; i++) {
                const suid = newEntity.roughInsInOrder[i];
                const snuid = newEntity.roughIns[suid].uid;
                const snEntity: SystemNodeEntity = {
                    center: {
                        x: newEntity.pipeDistanceMM * i -
                            (newEntity.pipeDistanceMM * (newEntity.roughInsInOrder.length - 1)) / 2,
                        y: 0,
                    },
                    parentUid: fixtureUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: suid,
                    uid: snuid,
                    configuration: FlowConfiguration.INPUT,
                };
                context.$store.dispatch('document/addEntity', snEntity);
            }



            context.objectStore.get(newEntity.uid)!.rebase(context);
            context.scheduleDraw();
        },
        (wc: Coord) => {
            context.$store.dispatch('document/commit').then(() => {});
        },
        'Insert Fixture',
        [
            [KeyCode.SHIFT, {name: '+ Precise Rotating', fn: (event: KeyboardEvent) => { /* */ }}],
            [KeyCode.RIGHT, {name: 'Rotate Clockwise', fn: (event: KeyboardEvent, onRefresh: () => void) => {
                    if (event.shiftKey || event.ctrlKey) {
                        angle += 1;
                    } else {
                        angle += 45;
                    }
                    onRefresh();
                }}],
            [KeyCode.LEFT, {name: 'Rotate Counter-clockwise', fn: (event: KeyboardEvent, onRefresh: () => void) => {
                    if (event.shiftKey || event.ctrlKey) {
                        angle -= 1;
                    } else {
                        angle -= 45;
                    }
                    onRefresh();
                }}],
        ],
    ));
}
