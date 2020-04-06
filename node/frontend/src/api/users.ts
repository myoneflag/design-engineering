import { APIResult } from "../../../common/src/api/document/types";
import { Document } from "../../../common/src/models/Document";
import axios from "axios";
import { Organization } from "../../../common/src/models/Organization";
import { AccessLevel, User } from "../../../common/src/models/User";

export async function getUsers(): Promise<APIResult<User[]>> {
    try {
        return (await axios.get("/api/users/")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getUser(username: string): Promise<APIResult<User>> {
    try {
        return (await axios.get("/api/users/" + username)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function createUser(
    username: string,
    name: string,
    email: string | undefined,
    subscribed: boolean,
    password: string,
    accessLevel: AccessLevel,
    organization?: string,
): Promise<APIResult<User>> {
    try {
        return (
            await axios.post("/api/users/", {
                username,
                name,
                email,
                password,
                accessLevel,
                organization,
                subscribed,
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

export async function signUp(
    username: string,
    name: string,
    email: string | undefined,
    password: string,
    organization?: string,
): Promise<APIResult<User>> {
    try {
        return (
            await axios.post("/api/users/signUp", {
                username,
                name,
                email,
                password,
                organization,
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



export async function updateUser(
    username: string,
    name: string,
    email: string | undefined,
    subscribed: boolean,
    accessLevel: AccessLevel,
    organization?: string
): Promise<APIResult<User>> {
    try {
        return (
            await axios.put("/api/users/" + username, {
                name,
                accessLevel,
                email,
                organization,
                subscribed
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

export async function updateLastNoticeSeen(
): Promise<APIResult<User>> {
    try {
        return (
            await axios.get("/api/changeLogMessage/updateNotice")
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
