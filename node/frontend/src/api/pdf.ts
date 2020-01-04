import axios from "axios";
import { PaperSize } from "../../../common/src/paper-config";
import { APIResult } from "../../../common/src/api/types";

export interface PDFRenderResult {
    scaleName: string;
    scale: number;
    paperSize: PaperSize;
    key: string;
    totalPages: number;
}

export interface GetImageLinkResult {
    get: string;
    head: string;
}

export const renderPdf = async (file: File): Promise<APIResult<PDFRenderResult>> => {
    const formData = new FormData();
    formData.append("pdf", file);

    try {
        return (
            await axios.post("/api/uploadPdf", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
};

export async function getImageLink(key: string): Promise<APIResult<GetImageLinkResult>> {
    try {
        return (
            await axios.get("/api/uploadPdf/" + key)
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
