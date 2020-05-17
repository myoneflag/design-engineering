import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { VideoView } from "../../../common/src/models/VideoView";

export async function recordVideoView(videoId: string): Promise<APIResult<VideoView>> {
    try {
        return (await axios.post("/api/videoView/recordVideoView", { videoId })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function viewedVideoIds(): Promise<APIResult<string[]>> {
    try {
        return (await axios.get("/api/videoView/viewedVideoIds")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
