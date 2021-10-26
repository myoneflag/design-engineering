import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./User";

export enum FeedbackCategory {
    Feature = "feature",
    Help = "help",
    Bug = "bug",
    Other = "other"
}

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

    document: {
        id: string,
        url: string,
    }
}
