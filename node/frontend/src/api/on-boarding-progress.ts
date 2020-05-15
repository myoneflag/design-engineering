import { APIResult } from "../../../common/src/api/document/types";
import axios from "axios";
import { OnBoardingProgressReport } from "../../../common/src/models/Level";

export async function getOnBoardingProgress(): Promise<APIResult<OnBoardingProgressReport>> {
    try {
        return (
            await axios.get("/api/login/onBoardingProgress")
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
