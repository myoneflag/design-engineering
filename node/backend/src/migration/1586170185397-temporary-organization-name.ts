import {MigrationInterface, QueryRunner} from "typeorm";

export class temporaryOrganizationName1586170185397 implements MigrationInterface {
    name = 'temporaryOrganizationName1586170185397'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "temporaryOrganizationName" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" ADD "temporaryUser" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "temporaryUser"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "temporaryOrganizationName"`, undefined);
    }

}
