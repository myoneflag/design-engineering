import {MigrationInterface, QueryRunner} from "typeorm";

export class FeedbackMessage1585009577776 implements MigrationInterface {
    name = 'FeedbackMessage1585009577776'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "feedback_message" ("id" SERIAL NOT NULL, "message" character varying NOT NULL, "category" character varying NOT NULL, "createdOn" TIMESTAMP NOT NULL, "submittedByUsername" character varying, CONSTRAINT "PK_f05013bed3b4e032e80c6e8d8e4" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "feedback_message" ADD CONSTRAINT "FK_577d3c4bf4ed31a67cfa06b4520" FOREIGN KEY ("submittedByUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "feedback_message" DROP CONSTRAINT "FK_577d3c4bf4ed31a67cfa06b4520"`, undefined);
        await queryRunner.query(`DROP TABLE "feedback_message"`, undefined);
    }

}
