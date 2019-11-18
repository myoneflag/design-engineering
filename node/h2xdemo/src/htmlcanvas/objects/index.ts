import SystemNode from '@/htmlcanvas/objects/tmv/system-node';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
import {BackgroundImage} from '@/htmlcanvas/objects/background-image';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import Pipe from '@/htmlcanvas/objects/pipe';
import Fitting from '@/htmlcanvas/objects/fitting';
import Fixture from '@/htmlcanvas/objects/fixture';
import DirectedValve from '@/htmlcanvas/objects/directed-valve';

export function registerObjectBuilders() {
    SystemNode.register();
    Tmv.register();
    BackgroundImage.register();
    FlowSource.register();
    Pipe.register();
    Fitting.register();
    Fixture.register();
    DirectedValve.register();
}
