import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne41589089868860 implements MigrationInterface {
    name = 'tryManyToOne41589089868860'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" RENAME COLUMN "levelId" TO "level_id"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD CONSTRAINT "FK_8fe38b7eb222f417dc9295827ed" FOREIGN KEY ("level_id") REFERENCES "level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP CONSTRAINT "FK_8fe38b7eb222f417dc9295827ed"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 15:46:52.026572'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" RENAME COLUMN "level_id" TO "levelId"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

}
