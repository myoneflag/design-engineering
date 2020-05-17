import { VIDEO_INDEX } from "./videos";

export interface SkillLevel {
    name: string;
    videoRequirements: string[];
    requiredDrawingsCreated: number;
    requiredFeedbacksSubmitted: number;
}

export const SKILL_LEVELS: SkillLevel[] = [
    {
        name: 'Beginner',
        videoRequirements: [
            VIDEO_INDEX["upload-pdf-background"].id,
            VIDEO_INDEX["scale-floor-plan"].id,
            VIDEO_INDEX["align-floor-plans"].id,
        ],
        requiredDrawingsCreated: 0,
        requiredFeedbacksSubmitted: 0,
    },

    {
        name: 'Novice',
        videoRequirements: [
            VIDEO_INDEX["stamp-fixtures"].id,
            VIDEO_INDEX["locate-water-source"].id,
            VIDEO_INDEX["draw-pipes"].id,
            VIDEO_INDEX["auto-connect-fixtures"].id,
            VIDEO_INDEX["add-valves"].id,
            VIDEO_INDEX["add-levels"].id,
            VIDEO_INDEX["pipe-between-levels"].id,
        ],
        requiredDrawingsCreated: 1,
        requiredFeedbacksSubmitted: 0,
    },

    {
        name: 'Intermediate',
        videoRequirements: [
            VIDEO_INDEX["override-component-properties"].id,
            VIDEO_INDEX["crop-pdf"].id,
            VIDEO_INDEX["add-booster-pump"].id,
            VIDEO_INDEX["heated-water-return-system"].id,
        ],
        requiredDrawingsCreated: 3,
        requiredFeedbacksSubmitted: 0,
    },


    {
        name: 'Experienced',
        videoRequirements: [
            VIDEO_INDEX["replace-pdf-background"].id,
            VIDEO_INDEX["add-continuous-flow"].id,
            VIDEO_INDEX["add-dwelling-node"].id,
            VIDEO_INDEX["add-storage-tank"].id,
            VIDEO_INDEX["differing-flow-systems"].id,
        ],
        requiredDrawingsCreated: 0,
        requiredFeedbacksSubmitted: 0,
    },

    {
        name: 'Expert',
        videoRequirements: [

        ],
        requiredDrawingsCreated: 0,
        requiredFeedbacksSubmitted: 1,
    }
];
