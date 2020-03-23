import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./User";
@Entity()
export class ChangeLogMessage extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    message: string;

    @ManyToOne(() => User, { eager: true })
    submittedBy: User;

    @Column()
    tags: string;

    @Column()
    version: string | null;

    @Column()
    createdOn: Date;
}
