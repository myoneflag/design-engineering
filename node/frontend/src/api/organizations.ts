import { APIResult } from "../../../common/src/api/document/types";
import { Document } from "../../../common/src/models/Document";
import axios from "axios";
import { Organization } from "../../../common/src/models/Organization";

export async function getOrganizations(): Promise<APIResult<Organization[]>> {
    try {
        return (await axios.get("/api/organizations/")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getOrganization(id: string): Promise<APIResult<Organization>> {
    try {
        return (await axios.get("/api/organizations/" + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function createOrganization(id: string, name: string): Promise<APIResult<Organization>> {
    try {
        return (
            await axios.post("/api/organizations/", {
                id,
                name
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

export async function updateOrganization(id: string, name: string): Promise<APIResult<Organization>> {
    try {
        return (
            await axios.put("/api/organizations/" + id, {
                name
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
