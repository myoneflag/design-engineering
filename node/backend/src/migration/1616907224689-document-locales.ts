import {MigrationInterface, QueryRunner} from "typeorm";

export class documentLocales1616907224689 implements MigrationInterface {
    name = 'documentLocales1616907224689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "document_locale_enum" AS ENUM('en-au', 'en-us', 'en-uk')`);
        await queryRunner.query(`ALTER TABLE "document" ADD "locale" "document_locale_enum" NOT NULL DEFAULT 'en-au'`);
        await queryRunner.query(`ALTER TABLE "operation" DROP CONSTRAINT "FK_9fbd8ce3d758c9ec02e70896f8f"`);
        await queryRunner.query(`DROP INDEX "IDX_4cfedf30406e87a7ca9d8437c1"`);
        await queryRunner.query(`delete from operation where operation."documentId" is null`);
        await queryRunner.query(`ALTER TABLE "operation" ALTER COLUMN "documentId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "lastCompression" SET DEFAULT '"1999-12-30T13:00:00.000Z"'`);
        await queryRunner.query(`CREATE INDEX "IDX_4cfedf30406e87a7ca9d8437c1" ON "operation" ("documentId", "orderIndex") `);
        await queryRunner.query(`ALTER TABLE "operation" ADD CONSTRAINT "FK_9fbd8ce3d758c9ec02e70896f8f" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "operation" DROP CONSTRAINT "FK_9fbd8ce3d758c9ec02e70896f8f"`);
        await queryRunner.query(`DROP INDEX "IDX_4cfedf30406e87a7ca9d8437c1"`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "lastCompression" SET DEFAULT '1999-12-30 13:00:00'`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2021-03-21 13:12:55.790016'`);
        await queryRunner.query(`ALTER TABLE "operation" ALTER COLUMN "documentId" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_4cfedf30406e87a7ca9d8437c1" ON "operation" ("orderIndex", "documentId") `);
        await queryRunner.query(`ALTER TABLE "operation" ADD CONSTRAINT "FK_9fbd8ce3d758c9ec02e70896f8f" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "locale"`);
        await queryRunner.query(`DROP TYPE "document_locale_enum"`);
    }

}
