import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { FeedbackMessage } from "../../../common/src/models/FeedbackMessage";

export async function submitFeedback(
    category: string,
    message: string,
): Promise<APIResult<FeedbackMessage>> {
    try {
        return (
            await axios.post("/api/feedback", {
                category,
                message
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

export async function getFeedbacks(
): Promise<APIResult<FeedbackMessage[]>> {
    try {
        let dat = (
            await axios.get("/api/feedback")
        ).data;

        return dat
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
