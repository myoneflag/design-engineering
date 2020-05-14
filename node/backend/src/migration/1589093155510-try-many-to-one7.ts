import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToOne71589093155510 implements MigrationInterface {
    name = 'tryManyToOne71589093155510'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TYPE "requirement_type_enum" AS ENUM('0', '1', '2')`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD "type" "requirement_type_enum" NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 16:26:18.442722'`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" DROP COLUMN "type"`, undefined);
        await queryRunner.query(`DROP TYPE "requirement_type_enum"`, undefined);
    }

}
