import {MigrationInterface, QueryRunner} from "typeorm";

export class addNewTagsColumnInDocumentTable1628613156694 implements MigrationInterface {
    name = 'addNewTagsColumnInDocumentTable1628613156694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" ADD "tags" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "tags"`);
    }

}
