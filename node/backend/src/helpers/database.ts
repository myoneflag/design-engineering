import { EntityManager, getManager } from "typeorm";
import { Document } from "../../../common/src/models/Document";
import retry from "retry";
import {IsolationLevel} from "typeorm/driver/types/IsolationLevel";

export function withSerializableTransaction<T>(retryable: (tx: EntityManager) => Promise<T>) {
    return withTransaction('SERIALIZABLE', retryable);
}

export function withTransaction<T>(isolationLevel: IsolationLevel, retryable: (tx: EntityManager) => Promise<T>) {
    return new Promise<any>((res, rej) => {
        // randomize so that conflicting transactions don't just cancel each other over and over.
        const operation = retry.operation({randomize: true, minTimeout: 200, forever: true});

        operation.attempt(async () => {
            try {
                await getManager().transaction(isolationLevel, async (tx) => {
                    res(await retryable(tx));
                });
            } catch (e) {
                if (operation.retry(e)) {
                    console.log(e);
                    console.warn('retrying transaction');
                    console.trace();
                    return;
                } else {
                    console.warn('cannot retry transaction: failed completely and gave up');
                    rej(e);
                }
            }
        });
    });
}
