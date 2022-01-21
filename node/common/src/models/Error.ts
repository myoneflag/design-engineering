import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne } from "typeorm";
import { BaseEntity } from "typeorm";
import { User } from "./User";

export enum ErrorStatus {
    NEW,
    DOING,
    RESOLVED,
    HIDDEN
}

@Entity()
export class ErrorReport extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: true, eager: true })
    user: User | null;

    @Column()
    ip: string;

    @Column()
    name: string;

    @Column()
    url: string;

    @Column()
    message: string;

    @Column()
    trace: string;

    @Column()
    threwOn: Date;

    @Column()
    appVersion: string;

    @Column({ type: "enum", enum: ErrorStatus })
    status: ErrorStatus;
}
