import {MigrationInterface, QueryRunner} from "typeorm";

export class operationIndices1586423144024 implements MigrationInterface {
    name = 'operationIndices1586423144024'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE INDEX "IDX_4cfedf30406e87a7ca9d8437c1" ON "operation" ("documentId", "orderIndex") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_4cfedf30406e87a7ca9d8437c1"`, undefined);
    }

}
