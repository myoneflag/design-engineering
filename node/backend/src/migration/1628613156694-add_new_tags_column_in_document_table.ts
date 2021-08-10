import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewTagsColumnInDocumentTable1628613156694 implements MigrationInterface {
    name = 'addNewTagsColumnInDocumentTable1628613156694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "operation_documentid_1622583261317"`);
        await queryRunner.query(`DROP INDEX "operation_id_1622583261317"`);
        await queryRunner.query(`ALTER TABLE "document" ADD "tags" character varying`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "lastCompression" SET DEFAULT '"1999-12-31T00:00:00.000Z"'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "lastCompression" SET DEFAULT '1999-12-30 13:00:00'`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2021-08-05 15:04:38.527149'`);
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "tags"`);
        await queryRunner.query(`CREATE INDEX "operation_id_1622583261317" ON "operation" ("id") `);
        await queryRunner.query(`CREATE INDEX "operation_documentid_1622583261317" ON "operation" ("documentId") `);
    }

}
