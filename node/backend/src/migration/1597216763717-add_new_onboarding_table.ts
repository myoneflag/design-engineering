import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewOnboardingTable1597216763717 implements MigrationInterface {
    name = 'addNewOnboardingTable1597216763717'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "onboarding" ("id" SERIAL NOT NULL, "home" integer NOT NULL DEFAULT 0, "document" integer NOT NULL DEFAULT 0, "document_plumbing" integer NOT NULL DEFAULT 0, "document_setting" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b8b6cfe63674aaee17874f033cf" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-08-05 14:53:41.736307'`, undefined);
        await queryRunner.query(`DROP TABLE "onboarding"`, undefined);
    }

}
