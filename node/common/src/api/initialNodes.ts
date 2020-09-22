import { EntityType } from './document/entities/types';
import { NodeProps } from "../models/CustomEntity";

export const initialNodes: NodeProps[] = [
    {
        name: "Ensuite",
        minPressure: 250,
        maxPressure: 500,
        fixtures: ["basin", "shower", "wc"],
        uid: "ensuite",
        dwelling: "",
        type: EntityType.LOAD_NODE,
    },
    {
        name: "WC & Basin",
        minPressure: 250,
        maxPressure: 500,
        fixtures: ["basin", "wc"],
        uid: "wc&basin",
        dwelling: "",
        type: EntityType.LOAD_NODE,
    },
    {
        name: "Dwelling",
        minPressure: 250,
        maxPressure: 450,
        fixtures: ["basin", "shower", "wc", "kitchenSink", "laundryTrough", "dishwasher", "washingMachine"],
        uid: "dwelling",
        dwelling: true,
        type: EntityType.LOAD_NODE,
    },
];
