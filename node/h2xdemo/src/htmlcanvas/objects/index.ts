import SystemNode from '@/htmlcanvas/objects/tmv/system-node';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
import {BackgroundImage} from '@/htmlcanvas/objects/background-image';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import Pipe from '@/htmlcanvas/objects/pipe';
import Valve from '@/htmlcanvas/objects/valve';
import Fixture from '@/htmlcanvas/objects/fixture';

export function registerObjectBuilders() {
    SystemNode.register();
    Tmv.register();
    BackgroundImage.register();
    FlowSource.register();
    Pipe.register();
    Valve.register();
    Fixture.register();
}
