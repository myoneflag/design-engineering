import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { ContactMessage } from "../../../common/src/models/ContactMessage";

export async function sendContactMessage(
    name: string,
    email: string,
    message: string
): Promise<APIResult<ContactMessage>> {
    try {
        return (
            await axios.post("/api/contacts", {
                name,
                email,
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

export async function getContactMessages(): Promise<APIResult<ContactMessage[]>> {
    try {
        return (await axios.get("/api/contacts")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
