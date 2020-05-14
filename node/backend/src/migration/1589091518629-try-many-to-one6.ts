import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne61589091518629 implements MigrationInterface {
    name = 'tryManyToOne61589091518629'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 16:12:33.171288'`, undefined);
    }

}
