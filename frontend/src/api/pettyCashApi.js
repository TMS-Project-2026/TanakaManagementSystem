import api from './axios';

export const getAllPettyCash = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.cabang) params.append('cabang', filters.cabang);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return api.get(`/petty-cash?${params.toString()}`);
};
export const getPettyCashSummary = () => api.get('/petty-cash/summary');
export const createPettyCash = (data) => api.post('/petty-cash', data);
export const replenishPettyCash = (data) => api.post('/petty-cash/replenishment', data);
export const updatePettyCash = (id, data) => api.put(`/petty-cash/${id}`, data);
export const voidPettyCash = (id) => api.delete(`/petty-cash/${id}`);
