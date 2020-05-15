import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
@Entity()
export class Video extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    url: string;

    @ManyToOne(() => User, { nullable: true, eager: true })
    submitter: User | null;
}
