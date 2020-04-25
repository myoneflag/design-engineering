import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { VideoResult } from "../../../common/src/api/video";
import { Video } from "../../../common/src/models/Video";
import { VideoListing } from "../../../common/src/models/VideoListing";

export async function getVideo(
    category: string,
    titleId: string,
): Promise<APIResult<VideoResult>> {
    try {
        return (await axios.get("/api/video", {
            params: {
                category,
                titleId
            }
        })).data;
    } catch (e) {
        console.log('error in frontend api')
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getAllVideos(
): Promise<APIResult<Video[]>> {
    try {
        return (await axios.get("/api/video/allVideos", {
        })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function addVideoViewHistory(
    titleId: string,
    completed: Boolean,
    playedTime: Number,
): Promise<APIResult<VideoResult>> {
    try {
        return (await axios.post("/api/video/history", {
            titleId: titleId,
            completed: completed,
            playedTime: playedTime,
        })).data;
    } catch (e) {
        console.log(e);
        console.log('error in frontend call');
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function addVideo(
    titleId: string,
    url: string,
): Promise<APIResult<VideoResult>> {
    try {
        return (await axios.post("/api/video", {
            titleId: titleId,
            url: url,
        })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function addVideoListing(
    titleId: string,
    category: string,
    order: string,
): Promise<APIResult<VideoResult>> {
    try {
        return (await axios.post("/api/video/listing", {
            titleId: titleId,
            category: category,
            order: order,
        })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getAllVideoListing(): Promise<APIResult<VideoListing[]>> {
    try {
        return (await axios.get("/api/video/listing", {
        })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}