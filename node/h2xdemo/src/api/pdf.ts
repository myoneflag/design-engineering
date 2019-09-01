import axios from 'axios';
import {PaperSize} from '@/config';

export interface PDFRenderResult {
    scaleName: string;
    scale: number;
    paperSize: PaperSize;
    uri: string;
    totalPages: number;
}

export const renderPdf = (file: File, onLoad: (data: PDFRenderResult) => void) => {
    let formData = new FormData();
    formData.append('pdf', file);

    axios.post('api/uploadPdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }).catch((reason) => {
        console.log(JSON.stringify(reason));
    }).then((response) => { // from backend API
        if (response) {
            onLoad(response.data);
        }
    });
}
