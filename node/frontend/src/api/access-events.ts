import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { AccessEvents, LoginEventType } from "../../../common/src/models/AccessEvents";

export async function getAccessEvents(
    username?: string,
    from?: number,
    count?: number,
    type?: LoginEventType,
): Promise<APIResult<AccessEvents[]>> {
    try {
        return (await axios.get("/api/accessEvents/", { params: { username, from, count, type } })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getDataByUsername(props: {
    username: string,
    type?: LoginEventType,
}): Promise<APIResult<AccessEvents[]>> {
    const { username, type } = props;
    
    try {
        return (await axios.get("/api/accessEvents/" + username, { params: { type } })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
