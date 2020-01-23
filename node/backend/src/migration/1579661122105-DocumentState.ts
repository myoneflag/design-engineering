import {MigrationInterface, QueryRunner} from "typeorm";

export class DocumentState1579661122105 implements MigrationInterface {
    name = 'DocumentState1579661122105'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ADD "state" integer NOT NULL DEFAULT 0`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "state"`, undefined);
    }

}
