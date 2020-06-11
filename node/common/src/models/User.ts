import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Organization } from "./Organization";
import { AccessEvents } from "./AccessEvents";

export interface OnBoardingStats {
    numDrawingsCreated: number;
    numFeedbackSubmitted: number;
    viewedVideoIds: string[];
}

export enum AccessLevel {
    SUPERUSER = 0, // Can access all data on the platform
    ADMIN = 1, // A h2x member - can manage users and companies
    MANAGER = 2, // Customer managers - can manage company projects and users within their license.
    USER = 3 // Regular user - has access to the product and their projects.
}

@Entity("profile")
export class User extends BaseEntity {
    @PrimaryColumn()
    username: string;

    @Column()
    name: string;

    @Column({ select: false })
    passwordHash: string;

    @Column({
        type: "enum",
        enum: AccessLevel,
        default: AccessLevel.USER
    })
    accessLevel: AccessLevel;

    @Column({ nullable: true })
    email: string | null;

    @Column({ default: false })
    subscribed: boolean;

    @ManyToOne(() => Organization, { nullable: true, eager: true })
    organization: Organization | null;

    @Column({ default: false })
    eulaAccepted: boolean;

    @Column({ nullable: true })
    eulaAcceptedOn: Date | null;

    @Column({ nullable: true })
    lastActivityOn: Date | null;

    @Column({ nullable: true })
    lastNoticeSeenOn: Date | null;

    @Column({ nullable: true })
    temporaryOrganizationName: String | null;

    @Column({ default: false })
    temporaryUser: boolean | null;

    @Column("timestamp", { nullable: true })
    email_verified_at: Date | null;

    @Column("varchar", { nullable: true })
    email_verification_token: string;

    @Column("timestamp", { nullable: true })
    email_verification_dt: Date;

    @Column("varchar", { nullable: true })
    password_reset_token: string;

    @Column("timestamp", { nullable: true })
    password_reset_dt: Date;

    @Column("varchar", { nullable: true})
    lastname: string;
}

export function allUserFields(except?: Array<keyof User>) {
    const val: Array<keyof User> = [
        "username",
        "name",
        "passwordHash",
        "accessLevel",
        "email",
        "subscribed",
        "organization"
    ];
    if (except) {
        return val.filter((v) => !except.includes(v));
    } else {
        return val;
    }
}
