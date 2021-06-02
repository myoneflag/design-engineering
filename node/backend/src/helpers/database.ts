import { EntityManager, getManager } from "typeorm";
import {IsolationLevel} from "typeorm/driver/types/IsolationLevel";

export function withSerializableTransaction<T>(retryable: (tx: EntityManager) => Promise<T>) {
    return withTransaction('SERIALIZABLE', retryable);
}

export function withRepeatableReadTransaction<T>(retryable: (tx: EntityManager) => Promise<T>) {
    return withTransaction('REPEATABLE READ', retryable);
}

export function withTransaction<T>(isolationLevel: IsolationLevel, retryable: (tx: EntityManager) => Promise<T>) {
    const txid = Date.now()    
    return new Promise<any>((res, rej) => {    
        return getManager().transaction(isolationLevel, async (tx) => {
            console.log('transactionStart', `txid=${txid}`, isolationLevel)
            try {
                let result = await retryable(tx);
                res(result)
            } catch (e) {
                console.warn('transactionError', `txid=${txid}`, e)
                rej(e)                
            }
        });
    })
}
