import {MigrationInterface, QueryRunner} from "typeorm";

export class videoRecords1587257954494 implements MigrationInterface {
    name = 'videoRecords1587257954494'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "video" ("titleId" character varying NOT NULL, "url" character varying NOT NULL, "submitterUsername" character varying, CONSTRAINT "PK_258e9d63c318f8be3acf0a934f0" PRIMARY KEY ("titleId"))`, undefined);
        await queryRunner.query(`CREATE TABLE "video_listing" ("id" SERIAL NOT NULL, "category" character varying NOT NULL, "order" numeric NOT NULL, "progressValue" integer NOT NULL, "videoTitleId" character varying, CONSTRAINT "PK_ed68cbc377ea741dd16d524bd1c" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "video_viewed_record" ("id" SERIAL NOT NULL, "completed" boolean NOT NULL, "playedTime" integer NOT NULL, "timeStamp" TIMESTAMP NOT NULL, "watchedByUsername" character varying, "videoTitleId" character varying, CONSTRAINT "PK_1b3b7854562b3d180065bd009f4" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "video" ADD CONSTRAINT "FK_719bd9b8773519c7128635d38ba" FOREIGN KEY ("submitterUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "video_listing" ADD CONSTRAINT "FK_035652115eaf07f49cd1d934c24" FOREIGN KEY ("videoTitleId") REFERENCES "video"("titleId") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "video_viewed_record" ADD CONSTRAINT "FK_2aea54341491fe69b99b112c57b" FOREIGN KEY ("watchedByUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "video_viewed_record" ADD CONSTRAINT "FK_f9488084fdf7ef07492889cd6f2" FOREIGN KEY ("videoTitleId") REFERENCES "video"("titleId") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "video_viewed_record" DROP CONSTRAINT "FK_f9488084fdf7ef07492889cd6f2"`, undefined);
        await queryRunner.query(`ALTER TABLE "video_viewed_record" DROP CONSTRAINT "FK_2aea54341491fe69b99b112c57b"`, undefined);
        await queryRunner.query(`ALTER TABLE "video_listing" DROP CONSTRAINT "FK_035652115eaf07f49cd1d934c24"`, undefined);
        await queryRunner.query(`ALTER TABLE "video" DROP CONSTRAINT "FK_719bd9b8773519c7128635d38ba"`, undefined);
        await queryRunner.query(`DROP TABLE "video_viewed_record"`, undefined);
        await queryRunner.query(`DROP TABLE "video_listing"`, undefined);
        await queryRunner.query(`DROP TABLE "video"`, undefined);
    }

}
