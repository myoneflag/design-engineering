import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewColumsForEmailVerificationToUsersTable1591254567472 implements MigrationInterface {
    name = 'addNewColumsForEmailVerificationToUsersTable1591254567472'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "email_verified_at" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "email_verification_token" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "email_verification_dt" TIMESTAMP`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "email_verification_dt"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "email_verification_token"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "email_verified_at"`, undefined);
    }

}
