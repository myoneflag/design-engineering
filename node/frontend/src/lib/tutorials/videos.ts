import { assertUnreachable } from "../../../../common/src/api/config";
import axios from 'axios';

export enum VideoPlatform {
    YOUTUBE,
}

export interface VideoRecord {
    id: string;
    title: string;
    shortTitle: string;
    videoUrl: string;
    thumbnailUrl: string;
}

export interface YoutubeVideoSpec {
    platform: VideoPlatform;

    id: string;
    shortTitle: string;
    videoId: string;
}

export type VideoSpec = YoutubeVideoSpec;

export interface YoutubeOEmbed {
    title: string;
    author_url: string;
    provider_name: string;
    width: number;
    thumbnail_url: string;
    version: string;
    thumbnail_height: number;
    provider_url: string;
    thumbnail_width: number;
    type: string;
    height: number;
    author_name: string;
    html: string;
}

export async function videoSpec2Record(spec: VideoSpec): Promise<VideoRecord> {
    switch (spec.platform) {
        case VideoPlatform.YOUTUBE:
            const youtubeUrl = 'https://www.youtube.com/watch?v=' + spec.videoId;
            const result = await axios.get('https://noembed.com/embed?url=' + youtubeUrl);
            if (result.status === 200) {
                const oembed: YoutubeOEmbed = result.data;
                return {
                    id: spec.id,
                    title: oembed.title,
                    videoUrl: youtubeUrl,
                    shortTitle: spec.shortTitle,
                    thumbnailUrl: oembed.thumbnail_url,
                };
            } else {
                throw new Error('could not fetch video metadata for ' + spec.videoId);
            }
    }
    assertUnreachable(spec.platform);
}

const videoIndexUntyped = {
    'upload-pdf-background': {
        platform: VideoPlatform.YOUTUBE,
        id: 'upload-pdf-background',
        shortTitle: 'Upload PDF Background',
        videoId: '51Tfyvka2cc',
    },
    'scale-floor-plan': {
        platform: VideoPlatform.YOUTUBE,
        id: 'scale-floor-plan',
        shortTitle: 'Scale Floor Plan',
        videoId: 'ObfpjUBrBtA',
    },
    'replace-pdf-background': {
        platform: VideoPlatform.YOUTUBE,
        id: 'replace-pdf-background',
        shortTitle: 'Replace PDF Background',
        videoId: '6DjJRan4byU',
    },
    'crop-pdf': {
        platform: VideoPlatform.YOUTUBE,
        id: 'crop-pdf',
        shortTitle: 'Crop PDF',
        videoId: 'ndvh5abqFGs',
    },
    'align-floor-plans': {
        platform: VideoPlatform.YOUTUBE,
        id: 'align-floor-plans',
        shortTitle: 'Align Floor Plans',
        videoId: 'Kh_-WC7CBxE',
    },
    'add-levels': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-levels',
        shortTitle: 'Add Levels',
        videoId: 'kuxmACUiOkA',
    },
    'add-booster-pump': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-booster-pump',
        shortTitle: 'Add Booster Pump',
        videoId: 'wd-IjdLvOcw',
    },
    'add-continuous-flow': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-continuous-flow',
        shortTitle: 'Add Continuous Flow',
        videoId: '8Yc_JrwL_94',
    },
    'add-dwelling-node': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-dwelling-node',
        shortTitle: 'Add Dwelling Node',
        videoId: '2NbSsLgtDLc',
    },
    'add-storage-tank': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-storage-tank',
        shortTitle: 'Add Storage Tank',
        videoId: 'FR6GsU5fXGo',
    },
    'add-hot-water-plant': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-hot-water-plant',
        shortTitle: 'Add Hot Water Plant',
        videoId: '0CFMlU7h2wM',
    },
    'add-valves': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-valves',
        shortTitle: 'Add Valves',
        videoId: 'XhuTHz_d-_I',
    },
    'auto-connect-fixtures': {
        platform: VideoPlatform.YOUTUBE,
        id: 'auto-connect-fixtures',
        shortTitle: 'Auto Connect Fixtures',
        videoId: 'EGEVp8Tk-pU',
    },
    'heated-water-return-system': {
        platform: VideoPlatform.YOUTUBE,
        id: 'heated-water-return-system',
        shortTitle: 'Add Heated Water Return System',
        videoId: 'ea9lHWNfzSA',
    },
    'connect-differing-flow-systems': {
        platform: VideoPlatform.YOUTUBE,
        id: 'connect-differing-flow-systems',
        shortTitle: 'Connect Differing Flow Systems',
        videoId: 'DIrQcge2cB4',
    },
    'pipe-between-levels': {
        platform: VideoPlatform.YOUTUBE,
        id: 'pipe-between-levels',
        shortTitle: 'Pipe Between Levels',
        videoId: 't-UCVFyMnlw',
    },
    'draw-pipes': {
        platform: VideoPlatform.YOUTUBE,
        id: 'draw-pipes',
        shortTitle: 'Draw Pipes',
        videoId: 'xGCppZCUphU',
    },
    'override-component-properties': {
        platform: VideoPlatform.YOUTUBE,
        id: 'override-component-properties',
        shortTitle: 'Override Component Properties',
        videoId: 'XXzC62IFt1s',
    },
    'locate-water-source': {
        platform: VideoPlatform.YOUTUBE,
        id: 'locate-water-source',
        shortTitle: 'Specify the Water Source',
        videoId: 'IxkSKRVqS1I',
    },
    'stamp-fixtures': {
        platform: VideoPlatform.YOUTUBE,
        id: 'stamp-fixtures',
        shortTitle: 'Stamp Fixtures',
        videoId: '9sEPfc-iXjw',
    },

    'add-new-flow-system': {
        platform: VideoPlatform.YOUTUBE,
        id: 'add-new-flow-system',
        shortTitle: 'Add New Flow System',
        videoId: 'Iv1P4kvXYjc',
    },


    'change-flow-system-properties': {
        platform: VideoPlatform.YOUTUBE,
        id: 'change-flow-system-properties',
        shortTitle: 'Change Flow System Properties',
        videoId: 'avyou7KyJms',
    },

    'change-peak-flow-rate': {
        platform: VideoPlatform.YOUTUBE,
        id: 'change-peak-flow-rate',
        shortTitle: 'Change Peak Flow Rate',
        videoId: 'dKPXTielJX8',
    },

    'customize-results-filters': {
        platform: VideoPlatform.YOUTUBE,
        id: 'customize-results-filters',
        shortTitle: 'Customize Results Filters',
        videoId: 'BnNitByh2GM',
    },


    'export-pdf': {
        platform: VideoPlatform.YOUTUBE,
        id: 'export-pdf',
        shortTitle: 'Export PDF',
        videoId: '0NIb00ScRog',
    },
};

export const VIDEO_INDEX: typeof videoIndexUntyped & { [key: string]: VideoSpec } = videoIndexUntyped;
