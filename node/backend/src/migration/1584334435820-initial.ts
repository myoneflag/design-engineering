import {MigrationInterface, QueryRunner} from "typeorm";

export class initial1584334435820 implements MigrationInterface {
    name = 'initial1584334435820'

    public async up(queryRunner: QueryRunner): Promise<any> {
        let databaseInitialized = await queryRunner.hasTable('floor_plan')
        if (!databaseInitialized){
            await queryRunner.query(`CREATE TABLE "organization" ("id" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`CREATE TYPE "profile_accesslevel_enum" AS ENUM('0', '1', '2', '3')`, undefined);
            await queryRunner.query(`CREATE TABLE "profile" ("username" character varying NOT NULL, "name" character varying NOT NULL, "passwordHash" character varying NOT NULL, "accessLevel" "profile_accesslevel_enum" NOT NULL DEFAULT '3', "email" character varying, "subscribed" boolean NOT NULL DEFAULT false, "eulaAccepted" boolean NOT NULL DEFAULT false, "eulaAcceptedOn" TIMESTAMP, "lastActivityOn" TIMESTAMP, "organizationId" character varying, CONSTRAINT "PK_d80b94dc62f7467403009d88062" PRIMARY KEY ("username"))`, undefined);
            await queryRunner.query(`CREATE TYPE "access_events_type_enum" AS ENUM('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'SESSION_GET', 'SESSION_REFRESH', 'SESSION_EXPIRED', 'UNAUTHORISED_ACCESS', 'AUTHORISED_ACCESS', 'ACCEPT_EULA', 'DECLINE_EULA')`, undefined);
            await queryRunner.query(`CREATE TABLE "access_events" ("id" SERIAL NOT NULL, "type" "access_events_type_enum" NOT NULL, "url" character varying NOT NULL, "username" character varying, "dateTime" TIMESTAMP NOT NULL, "ip" character varying NOT NULL, "userAgent" character varying NOT NULL, "success" boolean NOT NULL, "userUsername" character varying, CONSTRAINT "PK_b5edb54463ff60f59a3d40f71e3" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`CREATE TABLE "contact_message" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "message" character varying NOT NULL, "email" character varying NOT NULL, "sentOn" TIMESTAMP NOT NULL, "ip" character varying NOT NULL, CONSTRAINT "PK_1476ca9a6265a586f618ea918fd" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`CREATE TABLE "operation" ("id" SERIAL NOT NULL, "orderIndex" integer NOT NULL, "operation" json NOT NULL, "dateTime" TIMESTAMP, "documentId" integer, "blameUsername" character varying, CONSTRAINT "PK_18556ee6e49c005fc108078f3ab" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`CREATE TABLE "document" ("id" SERIAL NOT NULL, "state" integer NOT NULL DEFAULT 0, "createdOn" TIMESTAMP NOT NULL, "metadata" json NOT NULL, "version" integer NOT NULL DEFAULT 0, "lastModifiedOn" TIMESTAMP, "organizationId" character varying, "createdByUsername" character varying, "lastModifiedByUsername" character varying, CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`CREATE TYPE "error_report_status_enum" AS ENUM('0', '1', '2', '3')`, undefined);
            await queryRunner.query(`CREATE TABLE "error_report" ("id" SERIAL NOT NULL, "ip" character varying NOT NULL, "name" character varying NOT NULL, "url" character varying NOT NULL, "message" character varying NOT NULL, "trace" character varying NOT NULL, "threwOn" TIMESTAMP NOT NULL, "appVersion" character varying NOT NULL, "status" "error_report_status_enum" NOT NULL, "userUsername" character varying, CONSTRAINT "PK_368fd477c388ac0109087da6daf" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`CREATE TABLE "floor_plan" ("id" character varying NOT NULL, "renders" json NOT NULL, CONSTRAINT "PK_d16cdd3e52f897258d1587ef65c" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`CREATE TABLE "session" ("id" character varying NOT NULL, "expiresOn" TIMESTAMP NOT NULL, "userUsername" character varying, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`, undefined);
            await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_2aa279b4f271cc87abcf1de3514" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "access_events" ADD CONSTRAINT "FK_18519d84059b27228748e70fcc8" FOREIGN KEY ("userUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "operation" ADD CONSTRAINT "FK_9fbd8ce3d758c9ec02e70896f8f" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "operation" ADD CONSTRAINT "FK_d3e3a33586eb1ef891fd3661a63" FOREIGN KEY ("blameUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_dfcea06c9f090a968a8076dccb5" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_ea49e4e390a85e9ad3c8ca14a88" FOREIGN KEY ("createdByUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_5c224f2c7e226fad5bc39e300b1" FOREIGN KEY ("lastModifiedByUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "error_report" ADD CONSTRAINT "FK_8f0e81e4362e1cf49bed5ae3ee8" FOREIGN KEY ("userUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
            await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_e93dfe3e7f719c793cadefb90fe" FOREIGN KEY ("userUsername") REFERENCES "profile"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_e93dfe3e7f719c793cadefb90fe"`, undefined);
        await queryRunner.query(`ALTER TABLE "error_report" DROP CONSTRAINT "FK_8f0e81e4362e1cf49bed5ae3ee8"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_5c224f2c7e226fad5bc39e300b1"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_ea49e4e390a85e9ad3c8ca14a88"`, undefined);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_dfcea06c9f090a968a8076dccb5"`, undefined);
        await queryRunner.query(`ALTER TABLE "operation" DROP CONSTRAINT "FK_d3e3a33586eb1ef891fd3661a63"`, undefined);
        await queryRunner.query(`ALTER TABLE "operation" DROP CONSTRAINT "FK_9fbd8ce3d758c9ec02e70896f8f"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_events" DROP CONSTRAINT "FK_18519d84059b27228748e70fcc8"`, undefined);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_2aa279b4f271cc87abcf1de3514"`, undefined);
        await queryRunner.query(`DROP TABLE "session"`, undefined);
        await queryRunner.query(`DROP TABLE "floor_plan"`, undefined);
        await queryRunner.query(`DROP TABLE "error_report"`, undefined);
        await queryRunner.query(`DROP TYPE "error_report_status_enum"`, undefined);
        await queryRunner.query(`DROP TABLE "document"`, undefined);
        await queryRunner.query(`DROP TABLE "operation"`, undefined);
        await queryRunner.query(`DROP TABLE "contact_message"`, undefined);
        await queryRunner.query(`DROP TABLE "access_events"`, undefined);
        await queryRunner.query(`DROP TYPE "access_events_type_enum"`, undefined);
        await queryRunner.query(`DROP TABLE "profile"`, undefined);
        await queryRunner.query(`DROP TYPE "profile_accesslevel_enum"`, undefined);
        await queryRunner.query(`DROP TABLE "organization"`, undefined);
    }

}
