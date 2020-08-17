import axios from "axios";
import { APIResult } from '../../../common/src/api/document/types';
import { User } from './../../../common/src/models/User';

export async function hotKeySetting(id: number): Promise<APIResult<string>> {
    try {
        return (await axios.get("/api/hotKey/setting/" + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function add(setting: Object): Promise<APIResult<{ user: User; setting: Object }>> {
    try {
        return (await axios.post("/api/hotKey/", { setting })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function update(data: {id: number, setting: Object}): Promise<APIResult<Object>> {
    try {
        return (await axios.put("/api/hotKey/" + data.id, { setting: data.setting })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
