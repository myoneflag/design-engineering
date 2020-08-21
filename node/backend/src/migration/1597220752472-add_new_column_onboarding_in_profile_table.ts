import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewColumnOnboardingInProfileTable1597220752472 implements MigrationInterface {
    name = 'addNewColumnOnboardingInProfileTable1597220752472'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "onboardingId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "UQ_bb8f8a616bd1273037f522ab837" UNIQUE ("onboardingId")`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_bb8f8a616bd1273037f522ab837" FOREIGN KEY ("onboardingId") REFERENCES "onboarding"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_bb8f8a616bd1273037f522ab837"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-08-12 15:19:59.556407'`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "UQ_bb8f8a616bd1273037f522ab837"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "onboardingId"`, undefined);
    }

}
