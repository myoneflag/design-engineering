import axios from 'axios';
import {Catalog} from '../store/catalog/types';
import {APIResult} from "../../../common/src/api/types";

export async function loadCatalog(docId: number): Promise<APIResult<Catalog>> {
    try {
        return (await axios.get('/api/catalog/', { params: { document: docId }})).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
