import {MigrationInterface, QueryRunner} from "typeorm";

export class lastAccessPrimitive1581499420536 implements MigrationInterface {
    name = 'lastAccessPrimitive1581499420536'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "lastActivityOn" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ADD "lastModifiedOn" TIMESTAMP`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ADD "lastModifiedByUsername" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_5c224f2c7e226fad5bc39e300b1" FOREIGN KEY ("lastModifiedByUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_5c224f2c7e226fad5bc39e300b1"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "lastModifiedByUsername"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "lastModifiedOn"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "lastActivityOn"`, undefined);
    }

}
