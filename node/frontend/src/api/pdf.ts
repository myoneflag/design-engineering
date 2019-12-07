import axios from 'axios';
import {PaperSize} from "../../../common/src/paper-config";
import {APIResult} from "../../../common/src/api/types";

export interface PDFRenderResult {
    scaleName: string;
    scale: number;
    paperSize: PaperSize;
    uri: string;
    totalPages: number;
}

export const renderPdf = async (file: File): Promise<APIResult<PDFRenderResult>> => {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
        return (await axios.post('/api/uploadPdf', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })).data;
    } catch (e) {
        if ('response' in e) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
};
