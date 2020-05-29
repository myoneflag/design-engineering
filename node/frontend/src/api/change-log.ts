import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { ChangeLogMessage } from "../../../common/src/models/ChangeLogMessage";

export async function saveChangeLogMessage(
    message: string,
    tags: string,
    version: string
): Promise<APIResult<ChangeLogMessage>> {
    try {
        return (
            await axios.post("/api/changeLogMessage", {
                message,
                tags,
                version
            })
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getChangeLogMessages(
    lastSeen: Date | null
): Promise<APIResult<ChangeLogMessage[]>> {
    try {
        let dat = (
            await axios.get("/api/changeLogMessage", {
                params: {
                    lastNoticeSeen: lastSeen
                }
            }
        )).data;
        return dat;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
