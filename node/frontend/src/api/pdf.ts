import axios from "axios";
import { PaperSize } from "../../../common/src/api/paper-config";
import { APIResult, FloorPlanRenders } from "../../../common/src/api/document/types";

export interface PDFRenderResult {
    scaleName: string;
    scale: number;
    paperSize: PaperSize;
    key: string;
    totalPages: number;
}

export interface ImageLinkResult {
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

export async function getImageLink(key: string): Promise<APIResult<ImageLinkResult>> {
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

export async function getFloorPlanRenders(key: string): Promise<APIResult<FloorPlanRenders>> {
    try {
        return (
            await axios.get("/api/uploadPdf/" + key + "/renders")
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
