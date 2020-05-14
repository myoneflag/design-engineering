//one row everytime a video is included in a category
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, JoinTable, ManyToOne, JoinColumn, ManyToMany } from "typeorm";
import { Level } from "./Level";
import { Video } from "./Video";
export enum RequirementType {
    VIDEO = 0,
    NUM_PROJECT_STARTED = 1,
    NUM_FEEDBACK = 2,
}

@Entity()
export class Requirement extends BaseEntity {
    @PrimaryGeneratedColumn()
    requirementId: number;

    @Column({
        type: "enum",
        enum: RequirementType,
        default: RequirementType.VIDEO
    })
    type: RequirementType;

    @ManyToOne(type => Level)
    @JoinColumn()
    level: Level;

    @ManyToMany(type => Video)
    @JoinTable()
    video: Video;

    @Column({default: 0})
    numProjectStarted: number;

    @Column({default: 0})
    numFeedback: number;

}

