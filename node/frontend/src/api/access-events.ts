import { ErrorReport, ErrorStatus } from "../../../backend/src/entity/Error";
import { APIResult } from "../../../common/src/api/types";
import axios from "axios";
import { AccessEvents } from "../../../backend/src/entity/AccessEvents";

export async function getAccessEvents(
    username?: string,
    from?: number,
    count?: number
): Promise<APIResult<AccessEvents[]>> {
    try {
        return (await axios.get("/api/accessEvents/", { params: { username, from, count } })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
