import {MigrationInterface, QueryRunner} from "typeorm";

export class OperationAudit1579059169116 implements MigrationInterface {
    name = 'OperationAudit1579059169116'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "operation" ADD "dateTime" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "operation" ADD "blameUsername" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "operation" ADD CONSTRAINT "FK_d3e3a33586eb1ef891fd3661a63" FOREIGN KEY ("blameUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "operation" DROP CONSTRAINT "FK_d3e3a33586eb1ef891fd3661a63"`, undefined);
        await queryRunner.query(`ALTER TABLE "operation" DROP COLUMN "blameUsername"`, undefined);
        await queryRunner.query(`ALTER TABLE "operation" DROP COLUMN "dateTime"`, undefined);
    }

}
