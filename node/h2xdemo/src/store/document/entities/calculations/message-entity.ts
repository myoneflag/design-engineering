import {CenteredEntity, DrawableEntity} from '@/store/document/types';
import {EntityType} from '@/store/document/entities/types';


export default interface MessageEntity extends CenteredEntity {
    type: EntityType.RESULTS_MESSAGE;
    targetUids: string[];
}
