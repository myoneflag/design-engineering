import {MigrationInterface, QueryRunner} from "typeorm";

export class operationMigration1645325201119 implements MigrationInterface {
    name = 'operationMigration1645325201119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "operation" ADD "migration" boolean DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_operation_orderindex_migration" ON "operation" ("documentId", "orderIndex") INCLUDE ("migration")`);
        await queryRunner.query(`DROP INDEX "IDX_4cfedf30406e87a7ca9d8437c1"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_operation_orderindex_migration"`);
        await queryRunner.query(`ALTER TABLE "operation" DROP COLUMN "migration"`);
        await queryRunner.query(`CREATE INDEX "IDX_4cfedf30406e87a7ca9d8437c1" ON "operation" ("documentId", "orderIndex")`);
    }

}
