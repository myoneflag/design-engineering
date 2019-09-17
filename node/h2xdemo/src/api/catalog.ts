import axios from 'axios';
import {Catalog} from '@/store/catalog/types';

export function loadCatalog(onLoad: (catalog: Catalog) => void) {
    return axios.post('/api/catalog/').then((response) => {
        onLoad(response.data);
    });
}
