import {MigrationInterface, QueryRunner} from "typeorm";

export class FloorPlanRenders1579556759588 implements MigrationInterface {
    name = 'FloorPlanRenders1579556759588'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "floor_plan" ("id" character varying NOT NULL, "renders" json NOT NULL, CONSTRAINT "PK_d16cdd3e52f897258d1587ef65c" PRIMARY KEY ("id"))`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "floor_plan"`, undefined);
    }

}
