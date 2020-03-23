import {MigrationInterface, QueryRunner} from "typeorm";

export class updateChangeLogUser1584425440529 implements MigrationInterface {
    name = 'updateChangeLogUser1584425440529'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "change_log_message" RENAME COLUMN "submittedBy" TO "submittedByUsername"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "lastNoticeSeenOn" SET DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "change_log_message" ALTER COLUMN "submittedByUsername" DROP NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "change_log_message" ADD CONSTRAINT "FK_fa3f7f40d6cbd2ea87f21e4cbc6" FOREIGN KEY ("submittedByUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "change_log_message" DROP CONSTRAINT "FK_fa3f7f40d6cbd2ea87f21e4cbc6"`, undefined);
        await queryRunner.query(`ALTER TABLE "change_log_message" ALTER COLUMN "submittedByUsername" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "lastNoticeSeenOn" DROP DEFAULT`, undefined);
        await queryRunner.query(`ALTER TABLE "change_log_message" RENAME COLUMN "submittedByUsername" TO "submittedBy"`, undefined);
    }

}
