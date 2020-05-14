import { APIResult } from "../../../common/src/api/document/types";
import axios from "axios";
import { LevelAndRequirements } from "../../../common/src/models/Level";

export async function getLevelAndRequirements(): Promise<APIResult<LevelAndRequirements>> {
    try {
        return (
            await axios.get("/api/levelRequirement")
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
