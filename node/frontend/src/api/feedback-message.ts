import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { FeedbackMessage } from "../../../common/src/models/FeedbackMessage";

export async function submitFeedback(
    category: string,
    message: string,
    document: { url: string, id: string | null} | null
): Promise<APIResult<FeedbackMessage>> {
    try {
        return (
            await axios.post("/api/feedback", {
                category,
                message, 
                document
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
