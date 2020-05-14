import { LevelName } from "../models/Level";
import { RequirementType } from "../models/Requirement";


export interface Requirement {
    type: RequirementType,
    videoTitleId: String,
    numProjectStarted: number,
    numFeedback: number
}

export interface Level {
    name: LevelName,
    requirements: Requirement[],
}

export const ConcreteLevels: Level[] = [
    {
        name: LevelName.NOVICE,
        requirements: [],
    },
    {
        name: LevelName.BEGINNER,
        requirements: [],
    },
    {
        name: LevelName.INTERMEDIATE,
        requirements: [],
    },
    {
        name: LevelName.EXPERIENCED,
        requirements: [],
    },
    {
        name: LevelName.EXPERT,
        requirements: [],
    },
]

export const NoviceRequirements: Requirement[] = [
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to align the floor plans in your multi level project",
        numProjectStarted: 0,
        numFeedback: 0
    },
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to scale your floor plan",
        numProjectStarted: 0,
        numFeedback: 0
    }
]

export const BeginnerRequirements: Requirement[] = [
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to add hot water plant",
        numProjectStarted: 0,
        numFeedback: 0
    },
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to complete a heated water return system",
        numProjectStarted: 0,
        numFeedback: 0
    },
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to draw pipes",
        numProjectStarted: 0,
        numFeedback: 0
    },
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to draw a pipe between levels (a riser)",
        numProjectStarted: 0,
        numFeedback: 0
    },
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to auto connect fixtures",
        numProjectStarted: 0,
        numFeedback: 0
    },
    {
        type: RequirementType.VIDEO,
        videoTitleId: "H2X Engineering - How to locate the water source",
        numProjectStarted: 0,
        numFeedback: 0
    }
]
