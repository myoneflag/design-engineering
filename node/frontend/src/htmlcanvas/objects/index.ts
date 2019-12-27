import SystemNode from '../../../src/htmlcanvas/objects/tmv/system-node';
import Tmv from '../../../src/htmlcanvas/objects/tmv/tmv';
import {BackgroundImage} from '../../../src/htmlcanvas/objects/background-image';
import Riser from './riser';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import Fitting from '../../../src/htmlcanvas/objects/fitting';
import Fixture from '../../../src/htmlcanvas/objects/fixture';
import DirectedValve from '../../../src/htmlcanvas/objects/directed-valve';
import LoadNode from "./load-node";

export function registerObjectBuilders() {
    SystemNode.register();
    Tmv.register();
    BackgroundImage.register();
    Riser.register();
    Pipe.register();
    Fitting.register();
    Fixture.register();
    DirectedValve.register();
    LoadNode.register();
}
