import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewShareDocumentTable1592896926707 implements MigrationInterface {
    name = 'addNewShareDocumentTable1592896926707'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "share_document" ("id" SERIAL NOT NULL, "token" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_87aa5f8511016906cf17ac9c098" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ADD "shareDocumentId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "UQ_8aacbb6190a3f7fcacf5d0365a3" UNIQUE ("shareDocumentId")`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_8aacbb6190a3f7fcacf5d0365a3" FOREIGN KEY ("shareDocumentId") REFERENCES "share_document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_8aacbb6190a3f7fcacf5d0365a3"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-06-23 15:21:57.853619'`, undefined);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "UQ_8aacbb6190a3f7fcacf5d0365a3"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "shareDocumentId"`, undefined);
        await queryRunner.query(`DROP TABLE "share_document"`, undefined);
    }

}
