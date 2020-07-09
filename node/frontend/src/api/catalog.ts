import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { Catalog } from "../../../common/src/api/catalog/types";

export async function loadCatalog(docId: number): Promise<APIResult<Catalog>> {
    try {
        return (await axios.get("/api/catalog/" + docId)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function loadCatalogShare(docId: string): Promise<APIResult<Catalog>> {
    try {
        return (await axios.get("/api/catalog/share/" + docId)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
