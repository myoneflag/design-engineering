import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {Coord, FlowSystemParameters} from '../../../src/store/document/types';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import {MainEventBus} from '../../../src/store/main-event-bus';
import PointTool from '../../../src/htmlcanvas/tools/point-tool';
import {InteractionType} from '../../../src/htmlcanvas/lib/interaction';
import {EntityType} from '../../../src/store/document/entities/types';
import {addValveAndSplitPipe} from '../../../src/htmlcanvas/lib/black-magic/split-pipe';
import DirectedValveEntity from '../../../src/store/document/entities/directed-valves/directed-valve-entity';
import {DirectedValveConcrete, ValveType} from '../../../src/store/document/entities/directed-valves/valve-types';
import uuid from 'uuid';
import {KeyCode} from '../../../src/htmlcanvas/utils';
import DirectedValve from '../../../src/htmlcanvas/objects/directed-valve';

export default function insertDirectedValve(
    context: CanvasContext,
    valveType: ValveType,
    catalogId: string,
    system: FlowSystemParameters,
) {

    let pipe: Pipe | null = null;
    let flipped = false;

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
            MainEventBus.$emit('set-tool-handler', null);
            if (interrupted) {
                context.$store.dispatch('document/revert');
            } else {
                if (!displaced) {
                    insertDirectedValve(context, valveType, catalogId, system);
                }
            }
        },
        (wc, event) => {
            context.$store.dispatch('document/revert', false);

            context.offerInteraction(
                {
                    type: InteractionType.INSERT,
                    entityType: EntityType.DIRECTED_VALVE,
                    worldCoord: wc,
                    worldRadius: 30,
                },
                (drawable) => {
                    return drawable[0].type === EntityType.PIPE;
                },
            );

            const valveEntity: DirectedValveEntity = createBareValveEntity(valveType, catalogId, wc, null);
            context.$store.dispatch('document/addEntity', valveEntity);

            if (context.interactive && context.interactive.length) {
                const pipeE = context.interactive[0];
                pipe = context.objectStore.get(pipeE.uid) as Pipe;
                // Project onto pipe
                addValveAndSplitPipe(context, pipe, wc, system.uid, 10, valveEntity);

                if (flipped) {
                    (context.objectStore.get(valveEntity.uid)! as DirectedValve).flip();
                }
            } else {

                pipe = null;
            }


            context.scheduleDraw();
        },
        (worldCoord, event) => {
            context.interactive = null;
            context.$store.dispatch('document/commit').then(() => {});
        },
        'Insert',
        [
            [
                KeyCode.F,
                {
                    name: 'Flip',
                    fn: (e, r) => {
                        flipped = !flipped;
                        r();
                    },
                },
            ],
        ],
    ));
}

function createBareValveEntity(
    type: ValveType,
    catalogId: string,
    wc: Coord,
    systemUidOption: string | null,
): DirectedValveEntity {
    return {
        center: wc,
        color: null,
        parentUid: null,
        sourceUid: '',
        systemUidOption,
        type: EntityType.DIRECTED_VALVE,
        calculationHeightM: null,
        uid: uuid(),
        valve: createBareValve(type, catalogId),
    };
}

function createBareValve(type: ValveType, catalogId: string): DirectedValveConcrete {
    switch (type) {
        case ValveType.CHECK_VALVE:
        case ValveType.WATER_METER:
        case ValveType.STRAINER:
        case ValveType.RPZD:
            return {
                catalogId: catalogId as any,
                type,
            };
        case ValveType.ISOLATION_VALVE:
            return {
                isClosed: true,
                catalogId: catalogId as any,
                type,
            };
        case ValveType.PRESSURE_RELIEF_VALVE:
            return {
                targetPressureKPA: 0,
                catalogId: catalogId as any,
                type,
            };
    }
}
