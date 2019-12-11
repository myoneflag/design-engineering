import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {FlowSystemParameters} from '../../../src/store/document/types';
import {MainEventBus} from '../../../src/store/main-event-bus';
import PointTool from '../../../src/htmlcanvas/tools/point-tool';
import {InteractionType} from '../../../src/htmlcanvas/lib/interaction';
import {EntityType} from '../../../src/store/document/entities/types';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import {addValveAndSplitPipe} from '../../../src/htmlcanvas/lib/black-magic/split-pipe';

export default function insertValve(context: CanvasContext, system: FlowSystemParameters) {

    let pipe: Pipe | null = null;

    MainEventBus.$emit('set-tool-handler', new PointTool(
        (interrupted, displaced) => {
            MainEventBus.$emit('set-tool-handler', null);
            if (interrupted) {
                context.$store.dispatch('document/revert');
            } else {
                if (!displaced) {
                    insertValve(context, system);
                }
            }
        },
        (wc, event) => {
            context.$store.dispatch('document/revert', false);

            context.offerInteraction(
                {
                    type: InteractionType.INSERT,
                    entityType: EntityType.FITTING,
                    worldCoord: wc,
                    worldRadius: 30,
                },
                (drawable) => {
                    return drawable[0].type === EntityType.PIPE;
                },
            );

            if (context.interactive && context.interactive.length) {
                const pipeE = context.interactive[0];
                pipe = context.objectStore.get(pipeE.uid) as Pipe;
                // Project onto pipe
                addValveAndSplitPipe(context, pipe, wc, system.uid, 50);
            } else {
                pipe = null;
            }


            context.scheduleDraw();
        },
        (worldCoord, event) => {
            context.interactive = null;
            context.$store.dispatch('document/commit');
        },
        'Insert',
    ));
}

