import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./User";
@Entity()
export class Video extends BaseEntity {
    @PrimaryColumn()
    titleId: string;

    @Column()
    url: string;

    @ManyToOne(() => User, { nullable: true, eager: true })
    submitter: User | null;
}
