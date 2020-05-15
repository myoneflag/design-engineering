import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, Double } from "typeorm";
import { User } from "./User";
@Entity()
export class VideoView extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    user: User;

    @Column()
    videoId: string;

    @Column()
    completed: boolean;

    @Column()
    timeStamp: Date;
}
