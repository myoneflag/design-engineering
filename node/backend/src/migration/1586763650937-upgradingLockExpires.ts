import {MigrationInterface, QueryRunner} from "typeorm";

export class upgradingLockExpires1586763650937 implements MigrationInterface {
    name = 'upgradingLockExpires1586763650937'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ADD "upgradingLockExpires" TIMESTAMP NOT NULL DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "upgradingLockExpires"`, undefined);
    }

}
