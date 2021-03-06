import axios from 'axios';
import { Onboarding } from '../../../common/src/models/Onboarding';
import { APIResult } from './../../../common/src/api/document/types';

export interface UpdateOnboarding {
    id: number,
    home?: number,
    document?: number,
    document_setting?: number,
}

export async function updateOnboarding(props: UpdateOnboarding): Promise<APIResult<Onboarding>> {
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


