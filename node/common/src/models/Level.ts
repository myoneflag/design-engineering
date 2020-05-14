//one row everytime a video is included in a category
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";
import { Requirement } from "./Requirement";

export enum LevelName {
    NOVICE = 0,
    BEGINNER = 1,
    INTERMEDIATE = 2,
    EXPERIENCED = 3,
    EXPERT = 4,
}

export interface LevelAndRequirements {
    currentLevel: LevelName;
    currentRequirements: Requirement[];
    tickedRequirements: Requirement[];
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

    // @OneToMany(
    //     type => Requirement,
    //     rq => rq.level,
    //     { cascade: true}
    // )
    // @JoinColumn()
    // requirements: Requirement[];
}
