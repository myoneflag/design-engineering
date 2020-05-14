import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne51589090247344 implements MigrationInterface {
    name = 'tryManyToOne51589090247344'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" RENAME COLUMN "id" TO "requirementId"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" RENAME CONSTRAINT "PK_5e3278ee8e2094dd0f10a4aec62" TO "PK_49fcf97af5c03d17c70ae226bcc"`, undefined);
        await queryRunner.query(`ALTER SEQUENCE "requirement_id_seq" RENAME TO "requirement_requirementId_seq"`, undefined);
        await queryRunner.query(`ALTER TABLE "level" RENAME COLUMN "id" TO "levelId"`, undefined);
        await queryRunner.query(`ALTER TABLE "level" RENAME CONSTRAINT "PK_d3f1a7a6f09f1c3144bacdc6bcc" TO "PK_3149ba236a27104efaa07119477"`, undefined);
        await queryRunner.query(`ALTER SEQUENCE "level_id_seq" RENAME TO "level_levelId_seq"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 15:51:58.472052'`, undefined);
        await queryRunner.query(`ALTER SEQUENCE "level_levelId_seq" RENAME TO "level_id_seq"`, undefined);
        await queryRunner.query(`ALTER TABLE "level" RENAME CONSTRAINT "PK_3149ba236a27104efaa07119477" TO "PK_d3f1a7a6f09f1c3144bacdc6bcc"`, undefined);
        await queryRunner.query(`ALTER TABLE "level" RENAME COLUMN "levelId" TO "id"`, undefined);
        await queryRunner.query(`ALTER SEQUENCE "requirement_requirementId_seq" RENAME TO "requirement_id_seq"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" RENAME CONSTRAINT "PK_49fcf97af5c03d17c70ae226bcc" TO "PK_5e3278ee8e2094dd0f10a4aec62"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" RENAME COLUMN "requirementId" TO "id"`, undefined);
    }

}
