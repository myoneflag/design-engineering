import { BaseEntity, BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Organization } from "./Organization";
import { AccessLevel, User } from "./User";

export enum LoginEventType {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    SESSION_GET = "SESSION_GET",
    SESSION_REFRESH = "SESSION_REFRESH",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    UNAUTHORISED_ACCESS = "UNAUTHORISED_ACCESS",
    AUTHORISED_ACCESS = "AUTHORISED_ACCESS",
    ACCEPT_EULA = "ACCEPT_EULA",
    DECLINE_EULA = "DECLINE_EULA"
}

@Entity()
export class AccessEvents extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "enum",
        enum: LoginEventType
    })
    type: LoginEventType;

    @Column()
    url: string;

    @Column({ nullable: true })
    username?: string;

    @Column()
    dateTime: Date;

    @Column()
    ip: string;

    @Column()
    userAgent: string;

    @Column()
    success: boolean;

    @ManyToOne(() => User, { nullable: true, eager: false })
    user?: User;

    @BeforeInsert()
    logToUser() {
        if (this.user) {
            this.user.lastActivityOn = this.dateTime;
            this.user.save();
        }
    }
}
