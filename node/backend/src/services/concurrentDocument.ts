import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import {
    DocumentDeletedMessage,
    DocumentInternalEvent, DocumentUpdate,
    DocumentWSMessageType,
    OperationMessage
} from "../../../common/src/api/document/types";
import { OperationTransformConcrete } from "../../../common/src/api/document/operation-transforms";
import { assertUnreachable } from "../../../common/src/api/config";
import { EntityManager, getManager } from "typeorm";
import { Document } from "../../../common/src/models/Document";

export const OPERATION_ID_QUEUE = '/queue/document/operation/id';
export const OPERATION_PUSH_TOPIC = '/topic/document/operation';
import retry from 'retry';
import CONFIG from '../config/config';
import MqClient from "./MqClient";
import {withRepeatableReadTransaction, withSerializableTransaction, withReadUncommittedTransaction} from "../helpers/database";

/**
 * This class handles the management of a concurrent document.
 *
 * It used to be quite complex, but now it's just an event notification tool. Orchestration of
 * incrementing ids and remaining concurrency challenges are handled by SERIALIZABLE db transactions.
 *
 * Database operations are not the responsibility of this class - except for locking in transactions.
 */
export default class ConcurrentDocument {

    static async broadcastDelete(docId: number) {
        const op: DocumentDeletedMessage = {
            type: DocumentWSMessageType.DOCUMENT_DELETED,
        };
        // no need for the async version - this is merely used as an update notification.
        MqClient.client.publish({
            destination: OPERATION_PUSH_TOPIC + '/' + docId,
            body: JSON.stringify(op),
        });
    }

    /**
     * Concurrently runs a function while locking the document object.
     * Put only database code in the handler (and nothing with side effects) because this is supposed to retry when
     * transactions inevitably concurrently update.
     */
    static async withDocumentLock<T>(docId: number, transaction: (tx: EntityManager, doc: Document) => Promise<T>) {
        return await withSerializableTransaction(async (tx) => {
            const doc = await tx.findOne(Document, {id: docId});
            return await transaction(tx, doc);
        });
    }

    static async withDocumentLockRepeatableRead<T>(docId: number, transaction: (tx: EntityManager, doc: Document) => Promise<T>) {
        return await withRepeatableReadTransaction(async (tx) => {
            const doc = await tx.findOne(Document, {id: docId});
            return await transaction(tx, doc);
        });
    }

    static async withDocumentLockReadUncommitted<T>(docId: number, transaction: (tx: EntityManager, doc: Document) => Promise<T>) {
        return await withReadUncommittedTransaction(async (tx) => {
            const doc = await tx.findOne(Document, {id: docId});
            return await transaction(tx, doc);
        });
    }

    operationPushTopic: string;
    operationPushSub: StompSubscription;
    documentId: number;

    onDocumentUpdate: (nextOpId: number) => any;
    onDocumentDeleted: () => any;

    constructor(documentId: number, onDocumentUpdate: (nextOpId: number) => any, onDocumentDeleted: () => any) {
        this.operationPushTopic = OPERATION_PUSH_TOPIC + '/' + documentId;
        this.documentId = documentId;

        this.onDocumentUpdate = onDocumentUpdate;
        this.onDocumentDeleted = onDocumentDeleted;
        this.operationPushSub = MqClient.subscribe(this.operationPushTopic, this.onOperationEvent.bind(this));
    }


    onOperationEvent(msg: IMessage) {
        const op: DocumentInternalEvent = JSON.parse(msg.body);
        switch (op.type) {
            case 'UPDATE':
                this.onDocumentUpdate(op.nextOpId);
                break;
            case DocumentWSMessageType.DOCUMENT_DELETED:
                this.onDocumentDeleted();
                break;
            default:
                assertUnreachable(op);
        }
    }

    async withDocumentLock<T>(retryable: (tx: EntityManager, doc: Document) => Promise<T>) {
        return ConcurrentDocument.withDocumentLock(this.documentId, retryable);
    }


    async notifyUpdate(nextOpId: number) {
        const msg: DocumentUpdate = {
            type: "UPDATE",
            nextOpId,
        };
        // no need for the async version - this is merely used as an update notification.
        MqClient.client.publish({destination: this.operationPushTopic, body: JSON.stringify(msg)});
    }

    async close() {
        this.operationPushSub.unsubscribe();
    }
}
