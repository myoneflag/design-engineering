import axios from "axios";
import { APIResult } from "../../../common/src/api/types";
import { User } from "../../../backend/src/entity/User";

export async function changePasswords(currentPassword: string, newPassword: string): Promise<APIResult<string>> {
    try {
        return (
            await axios.post("/api/login/password", {
                currentPassword,
                newPassword
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

export async function logout(): Promise<APIResult<null>> {
    try {
        return (await axios.get("/api/logout")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function login(username: string, password: string): Promise<APIResult<string>> {
    try {
        return (await axios.post("/api/login", { username, password })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getSession(): Promise<APIResult<User>> {
    try {
        return (await axios.post("/api/session")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
