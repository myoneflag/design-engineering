import {Coord, DocumentState, FlowSystemParameters} from '@/store/document/types';
import {MainEventBus} from '@/store/main-event-bus';
import PointTool from '@/htmlcanvas/tools/point-tool';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import {EntityType} from '@/store/document/entities/types';
import uuid from 'uuid';
import Layer from '@/htmlcanvas/layers/layer';
import BackgroundLayer from '@/htmlcanvas/layers/background-layer';
import DrawingCanvas from '@/components/editor/DrawingCanvas.vue';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import _ from 'lodash';
import {getInsertCoordsAt} from '@/htmlcanvas/lib/utils';

export default function insertFlowSource(
    context: CanvasContext,
    system: FlowSystemParameters,
) {
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

            const newEntity: FlowSourceEntity = {
                connections: [],
                center: oc,
                color: null,
                heightAboveFloorM: 0,
                material: null,
                maximumVelocityMS: null,
                parentUid,
                pressureKPA: 0,
                diameterMM: 100,
                spareCapacity: null,
                systemUid: system.uid,
                temperatureC: null,
                type: EntityType.FLOW_SOURCE,
                uid: uuid(),
            };
            doc.drawing.entities.push(newEntity);
            context.$store.dispatch('document/commit');
        },
    ));
}
