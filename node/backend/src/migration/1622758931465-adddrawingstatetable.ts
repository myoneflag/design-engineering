import {MigrationInterface, QueryRunner} from "typeorm";

export class adddrawingstatetable1622758931465 implements MigrationInterface {
    name = 'adddrawingstatetable1622758931465'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "drawing" ("id" SERIAL NOT NULL, "status" integer NOT NULL DEFAULT 0, "documentId" integer NOT NULL, "drawing" json NOT NULL, "dateTime" TIMESTAMP, "blameUsername" character varying, CONSTRAINT "PK_80443da0cf8c74d73c4535f0d27" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fec2e22867a9a1e29e8a702c4a" ON "drawing" ("documentId") `);
        await queryRunner.query(`ALTER TABLE "drawing" ADD CONSTRAINT "FK_fec2e22867a9a1e29e8a702c4ac" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drawing" ADD CONSTRAINT "FK_2f7ff2775b9e4fb9e404e0a737f" FOREIGN KEY ("blameUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drawing" DROP CONSTRAINT "FK_2f7ff2775b9e4fb9e404e0a737f"`);
        await queryRunner.query(`ALTER TABLE "drawing" DROP CONSTRAINT "FK_fec2e22867a9a1e29e8a702c4ac"`);
        await queryRunner.query(`DROP INDEX "IDX_fec2e22867a9a1e29e8a702c4a"`);
        await queryRunner.query(`DROP TABLE "drawing"`);
    }

}
