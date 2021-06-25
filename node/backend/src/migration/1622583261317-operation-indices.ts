import { MigrationInterface, QueryRunner } from "typeorm";

export class operationIndices1622583261317 implements MigrationInterface {
    name = 'operationIndices1622583261317'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE INDEX operation_documentid_1622583261317 ON public.operation ("documentId" ASC NULLS LAST);`, undefined);
        await queryRunner.query(`CREATE INDEX operation_id_1622583261317 ON public.operation ("id" ASC NULLS LAST);`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX public.operation_documentid_1622583261317;`, undefined);
        await queryRunner.query(`DROP INDEX public.operation_id_1622583261317;`, undefined);        
    }

}
