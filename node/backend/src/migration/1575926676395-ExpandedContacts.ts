import {MigrationInterface, QueryRunner} from "typeorm";

export class ExpandedContacts1575926676395 implements MigrationInterface {
    name = 'ExpandedContacts1575926676395';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "error_report" ("id" SERIAL NOT NULL, "ip" character varying NOT NULL, "type" character varying NOT NULL, "message" character varying NOT NULL, "trace" character varying NOT NULL, "threwOn" TIMESTAMP NOT NULL, "appVersion" character varying NOT NULL, "userUsername" character varying, CONSTRAINT "PK_368fd477c388ac0109087da6daf" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "contact_message" ADD "sentOn" TIMESTAMP NULL`, undefined);
        await queryRunner.query(`UPDATE "contact_message" SET "sentOn" = $1`, [new Date()]);
        await queryRunner.query(`ALTER TABLE "contact_message" ALTER COLUMN "sentOn" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "contact_message" ADD "ip" character varying`, undefined);
        await queryRunner.query(`UPDATE "contact_message" SET "ip" = $1`, ["0.0.0.0"]);
        await queryRunner.query(`ALTER TABLE "contact_message" ALTER COLUMN "ip" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "error_report" ADD CONSTRAINT "FK_8f0e81e4362e1cf49bed5ae3ee8" FOREIGN KEY ("userUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "error_report" DROP CONSTRAINT "FK_8f0e81e4362e1cf49bed5ae3ee8"`, undefined);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "ip"`, undefined);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "sentOn"`, undefined);
        await queryRunner.query(`DROP TABLE "error_report"`, undefined);
    }

}
