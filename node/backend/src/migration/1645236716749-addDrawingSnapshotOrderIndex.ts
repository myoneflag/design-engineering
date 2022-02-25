import {MigrationInterface, QueryRunner} from "typeorm";

export class true1645236716749 implements MigrationInterface {
    name = 'addDrawingSnapshotOrderIndex1645236716749';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drawing" ADD "orderIndex" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_drawing_docId_snapshot_orderIndex" ON "drawing" ("documentId", "status", "orderIndex") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_drawing_docId_snapshot_orderIndex"`);
        await queryRunner.query(`ALTER TABLE "drawing" DROP COLUMN "orderIndex"`);
    }

}
