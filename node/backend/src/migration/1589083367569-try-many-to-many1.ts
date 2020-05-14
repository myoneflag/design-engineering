import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToMany11589083367569 implements MigrationInterface {
    name = 'tryManyToMany11589083367569'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 13:47:56.100869'`, undefined);
    }

}
