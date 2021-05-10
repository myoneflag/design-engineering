import { EntityManager, getManager } from "typeorm";
import retry from "retry";
import {IsolationLevel} from "typeorm/driver/types/IsolationLevel";

export function withSerializableTransaction<T>(retryable: (tx: EntityManager) => Promise<T>) {
    return withTransaction('SERIALIZABLE', retryable);
}

export function withTransaction<T>(isolationLevel: IsolationLevel, retryable: (tx: EntityManager) => Promise<T>) {
    return new Promise<any>((res, rej) => {
        // randomize so that conflicting transactions don't just cancel each other over and over.
        const operation = retry.operation({randomize: true, minTimeout: 200, maxTimeout: 1000, retries: 10});

        operation.attempt(async () => {
            try {
                console.log('transactionStart', isolationLevel)
                await getManager().transaction(isolationLevel, async (tx) => {
                    console.debug('attemptTransaction', tx)                    
                    res(await retryable(tx));
                });
            } catch (e) {
                console.warn('tentativeTransactionFail', e)
                if (operation.retry(e)) {
                    console.warn('retryTransaction', e);
                    return;
                } else {
                    console.error('transactionFinalError', e)
                    rej(e);
                }
            }
        });
    });
}
