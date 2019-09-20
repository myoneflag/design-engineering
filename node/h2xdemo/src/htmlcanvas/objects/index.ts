import ColdRoughIn from '@/htmlcanvas/objects/tmv/cold-rough-in';
import HotRoughIn from '@/htmlcanvas/objects/tmv/hot-rough-in';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
import WarmOut from '@/htmlcanvas/objects/tmv/warm-out';
import {BackgroundImage} from '@/htmlcanvas/objects/background-image';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import Pipe from '@/htmlcanvas/objects/pipe';
import Valve from '@/htmlcanvas/objects/valve';

export function registerObjectBuilders() {
    ColdRoughIn.register();
    HotRoughIn.register();
    Tmv.register();
    WarmOut.register();
    BackgroundImage.register();
    FlowSource.register();
    Pipe.register();
    Valve.register();
}
