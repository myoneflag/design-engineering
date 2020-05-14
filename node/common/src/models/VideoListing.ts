//one row everytime a video is included in a category
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Video } from "./Video";

@Entity()
export class VideoListing extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Video, { eager: true })
    video: Video;

    @Column()
    category: string;

    @Column({type: "decimal"})
    order: string;

}
