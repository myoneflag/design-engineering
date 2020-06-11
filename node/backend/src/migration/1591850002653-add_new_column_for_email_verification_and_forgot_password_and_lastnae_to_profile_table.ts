import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewColumnForEmailVerificationAndForgotPasswordAndLastnaeToProfileTable1591850002653 implements MigrationInterface {
    name = 'addNewColumnForEmailVerificationAndForgotPasswordAndLastnaeToProfileTable1591850002653'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "email_verified_at" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "email_verification_token" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "email_verification_dt" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "password_reset_token" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "password_reset_dt" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "lastname" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-06-11 11:41:41.910546'`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "lastname"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "password_reset_dt"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "password_reset_token"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "email_verification_dt"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "email_verification_token"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "email_verified_at"`, undefined);
    }

}
