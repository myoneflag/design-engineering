import {MigrationInterface, QueryRunner} from "typeorm";

export class lastCompression1605363824458 implements MigrationInterface {
    name = 'lastCompression1605363824458'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" ADD "lastCompression" TIMESTAMP NOT NULL DEFAULT '"1999-12-30T13:00:00.000Z"'`);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-09-27 18:36:30.78702'`);
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "lastCompression"`);
    }

}
