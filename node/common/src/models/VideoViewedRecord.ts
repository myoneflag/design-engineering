import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, Double } from "typeorm";
import { User } from "./User";
import { Video } from "./Video";
@Entity()
export class VideoViewedRecord extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    watchedBy: User;

    @ManyToOne(() => Video, { eager: true })
    video: Video;

    @Column()
    completed: boolean;

    @Column({ type: "numeric" })
    playedTime: number;

    @Column()
    timeStamp: Date;
}
