import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { Catalog } from "../../../common/src/api/catalog/types";

export async function loadCatalog(docId: number | string, shareToken: boolean = false): Promise<APIResult<Catalog>> {
    try {
        return (await axios.get("/api/catalog/" + docId, { params: { shareToken } })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
