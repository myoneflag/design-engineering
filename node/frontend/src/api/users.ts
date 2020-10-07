import axios from "axios";
import { APIResult } from "../../../common/src/api/document/types";
import { AccessLevel, User, Create } from "../../../common/src/models/User";

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

export async function createUser(data: Create): Promise<APIResult<User>> {
    try {
        return (await axios.post("/api/users/", data)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function signUp(props: Create): Promise<APIResult<User>> {
    try {
        return (
            await axios.post("/api/users/signUp", props)
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

export async function sendEmailVerification(email: string, username: string): Promise<APIResult<string>> {
    try {
        return (await axios.post("/api/users/send-email-verification", { email, username })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function forgotPassword(email: string, username: string): Promise<APIResult<string>> {
    try {
        return (await axios.post("/api/users/forgot-password", { email, username })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function resetPassword(password: string, confirmPassword: string, email: string, token: string): Promise<APIResult<string>> {
    try {
        return (await axios.post("/api/users/password-reset", { password, confirmPassword, email, token })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function confirmEmail(email: string): Promise<APIResult<User>> {
    try {
        return (await axios.post("/api/users/confirm-email", { email })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function activeUsers(props?: {
    activeFrom?: Date,
    activeTo?: Date,
}): Promise<APIResult<Array<{date: string, total_active: number}>>> {
    try {
        return (await axios.get("/api/users/active-users", { params: {...props, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone} })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
