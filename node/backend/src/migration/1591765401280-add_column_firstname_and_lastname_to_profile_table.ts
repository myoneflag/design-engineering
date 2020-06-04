import {MigrationInterface, QueryRunner} from "typeorm";

export class addColumnFirstnameAndLastnameToProfileTable1591765401280 implements MigrationInterface {
    name = 'addColumnFirstnameAndLastnameToProfileTable1591765401280'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "firstname" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "lastname" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-06-09 13:05:27.872983'`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "lastname"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "firstname"`, undefined);
    }

}
