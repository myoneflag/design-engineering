import axios from "axios";
import { NodeProps } from '../../../common/src/models/CustomEntity';

export async function customEntityData(data: {documentId: number, type: string}) {
    try {
        return (await axios.get("/api/customEntity/", { params: data })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function customEntityShareData(data: {id: string, type: string}) {
    try {
        return (await axios.get("/api/customEntity/share", { params: data })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}


export async function add(data: { documentId: number, entity: NodeProps}) {
    try {
        return (await axios.post("/api/customEntity/", data)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function update(id: number, data: {documentId: number, entity: NodeProps}) {
    try {
        return (await axios.put("/api/customEntity/" + id, data)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function remove(id: number, data: {documentId: number, entity: NodeProps}) {
    try {
        return (await axios.delete("/api/customEntity/" + id, { params: { documentId: data.documentId, type: data.entity.type } })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
