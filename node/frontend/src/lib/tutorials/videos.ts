import { assertUnreachable } from "../../../../common/src/api/config";

export enum VideoPlatform {
    YOUTUBE,
}

export interface VideoRecord {
    id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    durationS: number;
}

export interface YoutubeVideoSpec {
    platform: VideoPlatform;

    id: string;
    videoId: string;
}

export type VideoSpec = YoutubeVideoSpec;

export async function videoSpec2Record(spec: VideoSpec) {
    switch (spec.platform) {
        case VideoPlatform.YOUTUBE:

            break;
        default:
            assertUnreachable(spec.platform);
    }
}

export const VIDEO_INDEX = {
    'upload-pdf-background': {
        platform: VideoPlatform.YOUTUBE,
        id: 'upload-pdf-background',
        videoId: '51Tfyvka2cc',
    },
    'scale-floor-plan': {
        platform: VideoPlatform.YOUTUBE,
        id: 'scale-floor-plan',
        videoId: 'ObfpjUBrBtA',
    },
    'replace-pdf-background': {
        platform: VideoPlatform.YOUTUBE,
        id: 'replace-pdf-background',
        videoId: '6DjJRan4byU',
    },
    'crop-pdf': {
        platform: VideoPlatform.YOUTUBE,
        id: 'crop-pdf',
        videoId: 'ndvh5abqFGs',
    },
    'align-floor-plans': {
        platform: VideoPlatform.YOUTUBE,
        id: 'align-floor-plans',
        videoId: 'Kh_-WC7CBxE',
    },
    'add-levels': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-levels',
        videoId: 'kuxmACUiOkA',
    },
    'add-booster-pump': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-booster-pump',
        videoId: 'wd-IjdLvOcw',
    },
    'add-continuous-flow': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-continuous-flow',
        videoId: '8Yc_JrwL_94',
    },
    'add-dwelling-node': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-dwelling-node',
        videoId: '2NbSsLgtDLc',
    },
    'add-storage-tank': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-storage-tank',
        videoId: 'FR6GsU5fXGo',
    },
    'add-hot-water-plant': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-hot-water-plant',
        videoId: '0CFMlU7h2wM',
    },
    'add-valves': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-valves',
        videoId: 'XhuTHz_d-_I',
    },
    'auto-connect-fixtures': {
        platform: VideoPlatform.YOUTUBE,
        id: 'auto-connect-fixtures',
        videoId: 'EGEVp8Tk-pU',
    },
    'heated-water-return-system': {
        platform: VideoPlatform.YOUTUBE,
        id: 'heated-water-return-system',
        videoId: 'ea9lHWNfzSA',
    },
    'differing-flow-systems': {
        platform: VideoPlatform.YOUTUBE,
        id: 'differing-flow-systems',
        videoId: 'DIrQcge2cB4',
    },
    'pipe-between-levels': {
        platform: VideoPlatform.YOUTUBE,
        id: 'pipe-between-levels',
        videoId: 't-UCVFyMnlw',
    },
    'draw-pipes': {
        platform: VideoPlatform.YOUTUBE,
        id: 'draw-pipes',
        videoId: 'xGCppZCUphU',
    },
    'override-component-properties': {
        platform: VideoPlatform.YOUTUBE,
        id: 'override-component-properties',
        videoId: 'XXzC62IFt1s',
    },
    'locate-water-source': {
        platform: VideoPlatform.YOUTUBE,
        id: 'locate-water-source',
        videoId: 'IxkSKRVqS1I',
    },
    'stamp-fixtures': {
        platform: VideoPlatform.YOUTUBE,
        id: 'stamp-fixtures',
        videoId: '9sEPfc-iXjw',
    },
};
