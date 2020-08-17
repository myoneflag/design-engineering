import {MigrationInterface, QueryRunner} from "typeorm";

export class createHotKeysTable1596602366879 implements MigrationInterface {
    name = 'createHotKeysTable1596602366879'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "hot_key" ("id" SERIAL NOT NULL, "setting" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c756d3ae4473c25b992194caee0" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-06-23 15:22:28.807911'`, undefined);
        await queryRunner.query(`DROP TABLE "hot_key"`, undefined);
    }

}
