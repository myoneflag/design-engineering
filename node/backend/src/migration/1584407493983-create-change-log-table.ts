import {MigrationInterface, QueryRunner} from "typeorm";

export class createChangeLogTable1584407493983 implements MigrationInterface {
    name = 'createChangeLogTable1584407493983'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "change_log_message" ("id" SERIAL NOT NULL, "message" character varying NOT NULL, "submittedBy" character varying NOT NULL, "tags" character varying NOT NULL, "version" character varying NOT NULL, "createdOn" TIMESTAMP NOT NULL, CONSTRAINT "PK_3ba5344bc9fd986cf3d75992f27" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "lastNoticeSeenOn" TIMESTAMP`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "lastNoticeSeenOn"`, undefined);
        await queryRunner.query(`DROP TABLE "change_log_message"`, undefined);
    }

}
