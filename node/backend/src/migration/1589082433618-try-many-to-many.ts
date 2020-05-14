import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToMany1589082433618 implements MigrationInterface {
    name = 'tryManyToMany1589082433618'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51"`, undefined);
        await queryRunner.query(`CREATE TABLE "level_requirements_requirement" ("levelId" integer NOT NULL, "requirementId" integer NOT NULL, CONSTRAINT "PK_29a9ec89d0703ce57a288b848fd" PRIMARY KEY ("levelId", "requirementId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_2163e575fa5239c7debb14f6d4" ON "level_requirements_requirement" ("levelId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_eeb38be7a7d8e3e605085b4575" ON "level_requirements_requirement" ("requirementId") `, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" DROP COLUMN "levelId"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "level_requirements_requirement" ADD CONSTRAINT "FK_2163e575fa5239c7debb14f6d40" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "level_requirements_requirement" ADD CONSTRAINT "FK_eeb38be7a7d8e3e605085b45750" FOREIGN KEY ("requirementId") REFERENCES "requirement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "level_requirements_requirement" DROP CONSTRAINT "FK_eeb38be7a7d8e3e605085b45750"`, undefined);
        await queryRunner.query(`ALTER TABLE "level_requirements_requirement" DROP CONSTRAINT "FK_2163e575fa5239c7debb14f6d40"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-07 12:18:04.742624'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD "levelId" integer`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_eeb38be7a7d8e3e605085b4575"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_2163e575fa5239c7debb14f6d4"`, undefined);
        await queryRunner.query(`DROP TABLE "level_requirements_requirement"`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

}
