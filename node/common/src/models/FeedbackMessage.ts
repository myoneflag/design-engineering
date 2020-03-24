import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./User";
@Entity()
export class FeedbackMessage extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    message: string;

    @ManyToOne(() => User, { eager: true })
    submittedBy: User;

    @Column()
    category: string;

    @Column()
    createdOn: Date;
}
