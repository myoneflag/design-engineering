import {APIResult} from "../../../common/src/api/types";
import {Document} from "../../../backend/src/entity/Document";
import axios from "axios";
import {ErrorReport, ErrorStatus} from "../../../backend/src/entity/Error";
import {CreateErrorRequest} from "../../../backend/src/models/Error";

export async function getErrorReports(
    statuses?: ErrorStatus[],
    from?: number,
    count?: number
): Promise<APIResult<ErrorReport[]>> {
    try {
        return (await axios.get('/api/errors/', {params: {statuses, from, count}})).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getErrorReport(id: number): Promise<APIResult<ErrorReport>> {
    try {
        return (await axios.get('/api/errors/' + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function submitErrorReport(
    appVersion: string,
    message: string,
    name: string,
    trace: string,
    url: string
): Promise<APIResult<ErrorReport>> {
    try {
        const request: CreateErrorRequest = {
            appVersion, message, name, threwOn: new Date(), trace, url,
        };
        return (await axios.post('/api/errors/', request)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function updateErrorReport(
    id: number,
    status?: ErrorStatus,
    trace?: string
): Promise<APIResult<ErrorReport>> {
    try {
        return (await axios.put('/api/errors/' + id, {
            status, trace,
        })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
