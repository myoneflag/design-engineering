import {MigrationInterface, QueryRunner} from "typeorm";

export class nextOperationIndex1586414777430 implements MigrationInterface {
    name = 'nextOperationIndex1586414777430'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ADD "nextOperationIndex" integer NOT NULL DEFAULT 0`, undefined);
        const docs = await queryRunner.query(`SELECT id from "document"`);
        for (const {id} of docs) {
            const maxOpId = await queryRunner.query(`SELECT MAX("orderIndex") FROM "operation" WHERE "documentId" = ${id}`);
            let nextOpId = 0;
            if (maxOpId.length && maxOpId[0].max !== null && maxOpId[0].max !== undefined) {
                nextOpId = maxOpId[0].max + 1;
            }
            await queryRunner.query(`UPDATE "document" SET "nextOperationIndex"=${nextOpId} WHERE id=${id}`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "nextOperationIndex"`, undefined);
    }

}
