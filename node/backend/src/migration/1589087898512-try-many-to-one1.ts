import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne11589087898512 implements MigrationInterface {
    name = 'tryManyToOne11589087898512'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" ADD "levelId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP CONSTRAINT "FK_62d0cb55cfac147dddb4d81de51"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 14:15:38.618261'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" DROP COLUMN "levelId"`, undefined);
    }

}
