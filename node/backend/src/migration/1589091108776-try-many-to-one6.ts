import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne61589091108776 implements MigrationInterface {
    name = 'tryManyToOne61589091108776'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP CONSTRAINT "FK_8fe38b7eb222f417dc9295827ed"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" RENAME COLUMN "level_id" TO "levelLevelId"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD CONSTRAINT "FK_0b765f3b23ca1f3a189f3c8a061" FOREIGN KEY ("levelLevelId") REFERENCES "level"("levelId") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP CONSTRAINT "FK_0b765f3b23ca1f3a189f3c8a061"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 15:59:06.018585'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" RENAME COLUMN "levelLevelId" TO "level_id"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD CONSTRAINT "FK_8fe38b7eb222f417dc9295827ed" FOREIGN KEY ("level_id") REFERENCES "level"("levelId") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

}
