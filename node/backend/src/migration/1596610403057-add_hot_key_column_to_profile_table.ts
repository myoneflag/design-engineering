import {MigrationInterface, QueryRunner} from "typeorm";

export class addHotKeyColumnToProfileTable1596610403057 implements MigrationInterface {
    name = 'addHotKeyColumnToProfileTable1596610403057'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "hotKeyId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "UQ_ba8d034528aa3c44dc8ade931c6" UNIQUE ("hotKeyId")`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_ba8d034528aa3c44dc8ade931c6" FOREIGN KEY ("hotKeyId") REFERENCES "hot_key"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_ba8d034528aa3c44dc8ade931c6"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-08-05 12:57:36.672378'`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "UQ_ba8d034528aa3c44dc8ade931c6"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "hotKeyId"`, undefined);
    }

}
