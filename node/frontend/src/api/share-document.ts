import axios from 'axios';
import { APIResult } from './../../../common/src/api/document/types';

export async function generateShareLink(documentId: number): Promise<APIResult<string>> {
    try {
        return (await axios.post("/api/shareDocument/shareableLink", { documentId })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
