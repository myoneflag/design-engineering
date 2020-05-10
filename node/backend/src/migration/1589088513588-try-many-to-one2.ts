import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne21589088513588 implements MigrationInterface {
    name = 'tryManyToOne21589088513588'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 15:20:35.390261'`, undefined);
    }

}
