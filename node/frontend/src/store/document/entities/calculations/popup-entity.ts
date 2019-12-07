import {CenteredEntity, DrawableEntity} from '../../../../../src/store/document/types';
import {EntityType} from '../../../../../src/store/document/entities/types';

export enum MessageType {
    CALCULATION = 'CALCULATION',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

export interface CalculationMessage {
    type: MessageType.CALCULATION;
}

export interface WarningMessage {
    type: MessageType.WARNING;
    text: string;
}

export interface ErrorMessage {
    type: MessageType.ERROR;
    text: string;
}

export default interface PopupEntity extends CenteredEntity {
    type: EntityType.RESULTS_MESSAGE;
    targetUids: string[];
    params: CalculationMessage | WarningMessage | ErrorMessage;
}
