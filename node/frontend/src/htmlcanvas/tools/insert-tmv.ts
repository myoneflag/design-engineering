import {ConnectableEntity, Coord, DocumentState, DrawableEntity} from '../../../src/store/document/types';
import {MainEventBus} from '../../../src/store/main-event-bus';
import PointTool from '../../../src/htmlcanvas/tools/point-tool';
import {EntityType} from '../../../src/store/document/entities/types';
import uuid from 'uuid';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import TmvEntity, {FlowConfiguration, SystemNodeEntity} from '../../../src/store/document/entities/tmv/tmv-entity';
import {getInsertCoordsAt} from '../../../src/htmlcanvas/lib/utils';
import {InteractionType} from '../../../src/htmlcanvas/lib/interaction';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import Flatten from '@flatten-js/core';
import PipeEntity from '../../../src/store/document/entities/pipe-entity';
import {StandardFlowSystemUids} from '../../../src/store/catalog';
import DrawableObjectFactory from '../../../src/htmlcanvas/lib/drawable-object-factory';
import Tmv from '../../../src/htmlcanvas/objects/tmv/tmv';
import SystemNode from '../../../src/htmlcanvas/objects/tmv/system-node';
import {addValveAndSplitPipe} from '../../../src/htmlcanvas/lib/black-magic/split-pipe';
import {ConnectableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {isConnectable} from '../../../src/store/document';
import FittingEntity from '../../../src/store/document/entities/fitting-entity';
import {KeyCode} from '../../../src/htmlcanvas/utils';
import {connect} from '../../../src/lib/utils';
import connectTmvToSource from '../../../src/htmlcanvas/lib/black-magic/connect-tmv-to-source';

export default function insertTmv(
    context: CanvasContext,
    tmvhasCold: boolean,
    angle: number,
) {
    const tmvUid = uuid();
    const coldUid = uuid();
    const hotUid = uuid();
    const warmUid = uuid();
    const coldOutUid = uuid();

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
            if (interrupted) {
                context.$store.dispatch('document/revert');
            }
            if (!displaced) {
                MainEventBus.$emit('set-tool-handler', null);
                if (!interrupted) {
                    // stamp
                    insertTmv(context, tmvhasCold, angle);
                }
            }
        },
        (wc: Coord) => {
            context.$store.dispatch('document/revert', false);

            const doc = context.document as DocumentState;

            const newTmv: TmvEntity = {
                coldRoughInUid: coldUid,
                hotRoughInUid: hotUid,
                warmOutputUid: warmUid,
                coldOutputUid: tmvhasCold ? coldOutUid : null,

                maxFlowRateLS: null,
                maxHotColdPressureDifferentialPCT: null,
                maxInletPressureKPA: null,
                minFlowRateLS: null,
                minInletPressureKPA: null,
                pipeDistanceMM: 150,
                rotation: angle,
                valveLengthMM: 50,

                type: EntityType.TMV,
                center: wc,
                heightAboveFloorM: 1,
                parentUid: null,
                outputTemperatureC: 50,
                uid: tmvUid,
                calculation: null,
            };

            const newCold: SystemNodeEntity = {
                center: {x: newTmv.pipeDistanceMM / 2, y: 0},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.ColdWater,
                uid: coldUid,
                configuration: FlowConfiguration.INPUT,
                calculation: null,
            };

            const newHot: SystemNodeEntity = {
                center: {x: -newTmv.pipeDistanceMM / 2, y: 0},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.HotWater,
                uid: hotUid,
                configuration: FlowConfiguration.INPUT,
                calculation: null,
            };

            const newWarm: SystemNodeEntity = {
                center: {x: tmvhasCold ? newTmv.pipeDistanceMM / 3 : 0, y: newTmv.valveLengthMM},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.WarmWater,
                uid: warmUid,
                configuration: FlowConfiguration.OUTPUT,
                calculation: null,
            };

            const newColdOut: SystemNodeEntity = {
                center: {x: -newTmv.pipeDistanceMM / 3, y: newTmv.valveLengthMM},
                connections: [],
                parentUid: tmvUid,
                type: EntityType.SYSTEM_NODE,
                systemUid: StandardFlowSystemUids.ColdWater,
                uid: coldOutUid,
                configuration: FlowConfiguration.OUTPUT,
                calculation: null,
            };

            [newTmv, newCold, newHot, newWarm].forEach((e) => {
                context.$store.dispatch('document/addEntity', e);
            });

            if (tmvhasCold) {
                context.$store.dispatch('document/addEntity', newColdOut);
            }

            connectTmvToSource(context, context.objectStore.get(newTmv.uid) as Tmv);

            context.processDocument();
        },
        (wc: Coord) => {
            context.$store.dispatch('document/commit');
        },
        'Insert TMV',
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
