import {MigrationInterface, QueryRunner} from "typeorm";

export class videoview1589638692797 implements MigrationInterface {
    name = 'videoview1589638692797'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "video_view" ("id" SERIAL NOT NULL, "videoId" character varying NOT NULL, "completed" boolean NOT NULL, "timeStamp" TIMESTAMP NOT NULL, "userUsername" character varying, CONSTRAINT "PK_6902548160655a376f5d3705de0" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "video_view" ADD CONSTRAINT "FK_c253e433cc7108e42a49f89137e" FOREIGN KEY ("userUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "video_view" DROP CONSTRAINT "FK_c253e433cc7108e42a49f89137e"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-14 22:14:20.075996'`, undefined);
        await queryRunner.query(`DROP TABLE "video_view"`, undefined);
    }

}
