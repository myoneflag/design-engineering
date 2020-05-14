import {MigrationInterface, QueryRunner} from "typeorm";

export class changePlayedTimeType1587641225679 implements MigrationInterface {
    name = 'changePlayedTimeType1587641225679'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "video_viewed_record" DROP COLUMN "playedTime"`, undefined);
        await queryRunner.query(`ALTER TABLE "video_viewed_record" ADD "playedTime" numeric NOT NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "video_viewed_record" DROP COLUMN "playedTime"`, undefined);
        await queryRunner.query(`ALTER TABLE "video_viewed_record" ADD "playedTime" integer NOT NULL`, undefined);
    }

}
