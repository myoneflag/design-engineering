import { NodeProps } from './../../../../common/src/models/CustomEntity';

export default interface CustomEntityState {
    nodes: null | NodeProps[];
    loaded: boolean;
}
