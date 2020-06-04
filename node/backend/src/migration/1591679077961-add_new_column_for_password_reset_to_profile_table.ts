import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewColumnForPasswordResetToProfileTable1591679077961 implements MigrationInterface {
    name = 'addNewColumnForPasswordResetToProfileTable1591679077961'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "password_reset_token" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "password_reset_dt" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-29 09:57:53.095184'`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "password_reset_dt"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "password_reset_token"`, undefined);
    }

}
