import {MigrationInterface, QueryRunner} from "typeorm";

export class createNewCustomEntityTable1600746499924 implements MigrationInterface {
    name = 'createNewCustomEntityTable1600746499924'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "custom_entity" ("id" SERIAL NOT NULL, "entity" json NOT NULL, "type" character varying NOT NULL, "document_id" integer NOT NULL, "created_by" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_feec296bf7ece8519ade9ba7349" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-08-18 10:01:47.467317'`, undefined);
        await queryRunner.query(`DROP TABLE "custom_entity"`, undefined);
    }

}
