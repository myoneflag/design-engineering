import { EntityManager, getManager } from "typeorm";
import {IsolationLevel} from "typeorm/driver/types/IsolationLevel";

export function withSerializableTransaction<T>(transaction: (tx: EntityManager) => Promise<T>) {
    return withTransaction('SERIALIZABLE', transaction);
}

export function withRepeatableReadTransaction<T>(transaction: (tx: EntityManager) => Promise<T>) {
    return withTransaction('REPEATABLE READ', transaction);
}

export function withReadUncommittedTransaction<T>(transaction: (tx: EntityManager) => Promise<T>) {
    return withTransaction('READ UNCOMMITTED', transaction);
}

export function withTransaction<T>(isolationLevel: IsolationLevel, transaction: (tx: EntityManager) => Promise<T>) {
    const txid = Date.now()    
    return new Promise<any>((res, rej) => {    
        return getManager().transaction(isolationLevel, async (tx) => {
            console.log(`transaction:${txid}`, 'start', { txid, isolationLevel })
            try {
                let result = await transaction(tx);
                res(result)
            } catch (e) {
                console.warn(`transaction:${txid}`, 'error', { txid, e })
                rej(e)                
            }
            finally { 
                console.log(`transaction:${txid}`, 'end', { txid })
            }
        });
    })
}
