import {MigrationInterface, QueryRunner} from "typeorm";

export class tryManyToMany11589084041552 implements MigrationInterface {
    name = 'tryManyToMany11589084041552'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "requirement" DROP COLUMN "type"`, undefined);
        await queryRunner.query(`DROP TYPE "public"."requirement_type_enum"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT 'now'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "document" ALTER COLUMN "upgradingLockExpires" SET DEFAULT '2020-05-10 14:03:40.928704'`, undefined);
        await queryRunner.query(`CREATE TYPE "public"."requirement_type_enum" AS ENUM('0', '1', '2')`, undefined);
        await queryRunner.query(`ALTER TABLE "requirement" ADD "type" "requirement_type_enum" NOT NULL DEFAULT '0'`, undefined);
    }

}
