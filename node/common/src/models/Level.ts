//one row everytime a video is included in a category
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToMany } from "typeorm";
import { Video } from "./Video";
import { JoinTable } from "../typeorm";

export enum LevelName {
    NOVICE = 0,
    BEGINNER = 1,
    INTERMEDIATE = 2,
    EXPERIENCED = 3,
    EXPERT = 4,
}

@Entity()
export class Level extends BaseEntity {
    @PrimaryGeneratedColumn()
    levelId: number;

    @Column({
        type: "enum",
        enum: LevelName,
    })
    name: LevelName;

    @ManyToMany(() => Video)
    @JoinTable()
    videoRequirements: Video[];

    @Column({default: 0})
    projectsStartedRequirement: number;

    @Column({default: 0})
    feedbackSentRequirement: number;

    @Column({type: 'decimal'})
    order: string;
}

export interface OnBoardingProgressReport {
    level: Level;
    progressElapsed: number;
    progressTotal: number;

    doneItems: {
        videos: Video[];
        projects: number;
        feedbackItems: number;
    };

    missingItems: {
        videos: Video[];
        projects: number;
        feedbackItems: number;
    };

    completed: boolean;
}
