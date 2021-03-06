import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseEntity } from "typeorm";
import { Document } from "./Document";
import { User } from "./User";

@Entity()
export class Session extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @ManyToOne(() => User, { eager: true })
    user: User;

    @Column()
    expiresOn: Date;
}
