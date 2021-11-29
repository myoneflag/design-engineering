import { APIResult, } from "../../../common/src/api/document/types";
import axios from "axios";

export async function updateCalculationReport(id: number, results: any): Promise<APIResult<void>> {
    try {
        return (await axios.put("/api/reports/document/" + id + "/calculation", results)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}


export async function refreshDocumentReport(id: number): Promise<APIResult<void>> {
    try {
        return (await axios.post("/api/reports/document/" + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}


export async function downloadDocumentReport(id: number): Promise<APIResult<string>> {
    try {
        return (await axios.get("/api/reports/document/" + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function triggerSystemManufacturerReport(): Promise<APIResult<void>> {
    try {
        return (await axios.post("/api/reports/"));
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
