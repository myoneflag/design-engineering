import { Between, LessThanOrEqual, MoreThanOrEqual, Not } from "typeorm";
import { Operation } from "../../../common/src/models/Operation";

const OPERATION_FETCH_SIZE = 1000;

export class OperationRepository {

    static async findOperationsBatch(documentId: number, accumulate: boolean, startWith: number, endWith: number,
                                     operationProcess: (op: Operation) => void) {
        let processedCount = 0;
        const allOperations: Operation[] = [];

        const whereCondition =
            (startWith && endWith) ? Between(startWith, endWith) :
                (startWith ? MoreThanOrEqual(startWith) :
                    (endWith ? LessThanOrEqual(endWith) : Not(-1)));

        let lastBatch = -1;
        while (lastBatch !== 0) {
            const operations = await Operation.getRepository().find(
                {
                    where: {
                        documentId,
                        orderIndex: whereCondition,
                    },
                    skip: processedCount,
                    take: OPERATION_FETCH_SIZE,
                    order: { orderIndex: "ASC" },
                },
            );
            lastBatch = operations.length;
            if (operationProcess) {
                operations.forEach((op: Operation) => {
                    operationProcess(op);
                });
            }
            if (accumulate) {
                allOperations.push(...operations);
            }
            processedCount += lastBatch;
        }
        console.info(`Retrieved ${processedCount} operations`);
        return allOperations;
    }

    static async findMigrationOperations(documentId: number, startWith: number,
                                         operationProcess: (op: Operation) => void) {
        const operations = await Operation.getRepository().find(
            {
                where: {
                    documentId,
                    orderIndex: MoreThanOrEqual(startWith),
                    migration: true,
                },
                order: { orderIndex: "ASC" },
            });
        if (operationProcess) {
            operations.forEach((op: Operation) => {
                operationProcess(op);
            });
        }
    }

}
