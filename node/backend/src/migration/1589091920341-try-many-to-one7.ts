import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne71589091920341 implements MigrationInterface {
    name = 'tryManyToOne71589091920341'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "requirement_video_video" ("requirementRequirementId" integer NOT NULL, "videoTitleId" character varying NOT NULL, CONSTRAINT "PK_850cd3c36c916bcc6270b0e8650" PRIMARY KEY ("requirementRequirementId", "videoTitleId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_69f88656a3e1949878fad9c1ce" ON "requirement_video_video" ("requirementRequirementId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_d14b2a5700928678d8ea8e8ce6" ON "requirement_video_video" ("videoTitleId") `, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement_video_video" ADD CONSTRAINT "FK_69f88656a3e1949878fad9c1ceb" FOREIGN KEY ("requirementRequirementId") REFERENCES "requirement"("requirementId") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement_video_video" ADD CONSTRAINT "FK_d14b2a5700928678d8ea8e8ce69" FOREIGN KEY ("videoTitleId") REFERENCES "video"("titleId") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement_video_video" DROP CONSTRAINT "FK_d14b2a5700928678d8ea8e8ce69"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement_video_video" DROP CONSTRAINT "FK_69f88656a3e1949878fad9c1ceb"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 16:19:26.587559'`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_d14b2a5700928678d8ea8e8ce6"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_69f88656a3e1949878fad9c1ce"`, undefined);
        await queryRunner.query(`DROP TABLE "requirement_video_video"`, undefined);
    }

}
