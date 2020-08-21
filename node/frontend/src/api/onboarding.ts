import axios from 'axios';
import { APIResult } from './../../../common/src/api/document/types';

export interface UpdateOnboarding {
    id: number,
    home?: boolean,
    document?: boolean,
    document_plumbing?: boolean,
    document_setting?: boolean,
    [key: string]: any,
}

export async function updateOnboarding(props: UpdateOnboarding): Promise<APIResult<string>> {
    try {
        return (await axios.put("/api/onboarding/" + props.id, props)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
