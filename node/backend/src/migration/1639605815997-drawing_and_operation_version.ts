import {MigrationInterface, QueryRunner} from "typeorm";

export class drawingAndOperationVersion1639605815997 implements MigrationInterface {
    name = 'drawingAndOperationVersion1639605815997';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "operation" ADD "version" integer NOT NULL DEFAULT 23`);
        await queryRunner.query(`ALTER TABLE "drawing" ADD "version" integer NOT NULL DEFAULT 23`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drawing" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "operation" DROP COLUMN "version"`);
    }
}
