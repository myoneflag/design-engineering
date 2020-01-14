import {MigrationInterface, QueryRunner} from "typeorm";

export class jsonifyOperations1579009235002 implements MigrationInterface {
    name = 'jsonifyOperations1579009235002';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ADD "version" integer NOT NULL DEFAULT 0`, undefined);

        // tslint:disable-next-line:max-line-length
        await queryRunner.query(`ALTER TABLE "operation" ALTER COLUMN operation TYPE JSON USING operation::JSON`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "operation" ALTER COLUMN operation TYPE character varying USING operation #>> '{}'`);
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "version"`, undefined);
    }

}
