import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne31589089511443 implements MigrationInterface {
    name = 'tryManyToOne31589089511443'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 15:36:44.178162'`, undefined);
    }

}
