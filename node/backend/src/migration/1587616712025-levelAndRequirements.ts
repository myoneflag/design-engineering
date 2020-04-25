import {MigrationInterface, QueryRunner} from "typeorm";

export class levelAndRequirements1587616712025 implements MigrationInterface {
    name = 'levelAndRequirements1587616712025'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE "requirement_type_enum" AS ENUM('0', '1', '2')`, undefined);
        await queryRunner.query(`CREATE TABLE "requirement" ("id" SERIAL NOT NULL, "type" "requirement_type_enum" NOT NULL DEFAULT '0', "numProjectStarted" integer NOT NULL DEFAULT 0, "numFeedback" integer NOT NULL DEFAULT 0, "levelId" integer, CONSTRAINT "PK_5e3278ee8e2094dd0f10a4aec62" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TYPE "level_name_enum" AS ENUM('0', '1', '2', '3', '4')`, undefined);
        await queryRunner.query(`CREATE TABLE "level" ("id" SERIAL NOT NULL, "name" "level_name_enum" NOT NULL, CONSTRAINT "PK_d3f1a7a6f09f1c3144bacdc6bcc" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "video_listing" DROP COLUMN "progressValue"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51"`, undefined);
        await queryRunner.query(`ALTER TABLE "video_listing" ADD "progressValue" integer NOT NULL`, undefined);
        await queryRunner.query(`DROP TABLE "level"`, undefined);
        await queryRunner.query(`DROP TYPE "level_name_enum"`, undefined);
        await queryRunner.query(`DROP TABLE "requirement"`, undefined);
        await queryRunner.query(`DROP TYPE "requirement_type_enum"`, undefined);
    }

}
