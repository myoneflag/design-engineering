import SystemNode from "./big-valve/system-node";
import BigValve from "./big-valve/bigValve";
import { BackgroundImage } from "../../../src/htmlcanvas/objects/background-image";
import Riser from "./riser";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import Fitting from "../../../src/htmlcanvas/objects/fitting";
import Fixture from "../../../src/htmlcanvas/objects/fixture";
import DirectedValve from "../../../src/htmlcanvas/objects/directed-valve";
import LoadNode from "./load-node";
import FlowSource from "./flow-source";
import Plant from "./plant";

export function registerObjectBuilders() {
    SystemNode.register();
    BigValve.register();
    BackgroundImage.register();
    Riser.register();
    Pipe.register();
    Fitting.register();
    Fixture.register();
    DirectedValve.register();
    LoadNode.register();
    FlowSource.register();
    Plant.register();
}
