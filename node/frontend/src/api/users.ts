import {APIResult} from "../../../common/src/api/types";
import {Document} from "../../../backend/src/entity/Document";
import axios from "axios";
import {Organization} from "../../../backend/src/entity/Organization";
import {AccessLevel, User} from "../../../backend/src/entity/User";

export async function getUsers(): Promise<APIResult<User[]>> {
    try {
        return (await axios.get('/api/users/')).data;
    } catch (e) {
        if ('response' in e) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getUser(username: string): Promise<APIResult<User>> {
    try {
        return (await axios.get('/api/users/' + username)).data;
    } catch (e) {
        if ('response' in e) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function createUser(username: string, name: string, password: string, accessLevel: AccessLevel, organization?: string): Promise<APIResult<User>> {
    try {
        return (await axios.post('/api/users/', {
            username, name, password, accessLevel, organization
        })).data;
    } catch (e) {
        if ('response' in e) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function updateUser(username: string, name: string, accessLevel: AccessLevel, organization?: string): Promise<APIResult<User>> {
    try {
        return (await axios.put('/api/users/' + username, {
            name, accessLevel, organization
        })).data;
    } catch (e) {
        if ('response' in e) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
