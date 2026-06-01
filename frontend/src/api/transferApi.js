import api from './axios';

const buildParams = (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    return params.toString();
};

export const getAllTransfer = (filters = {}) => api.get(`/transfer?${buildParams(filters)}`);
export const getTransferSummary = () => api.get('/transfer/summary');
export const createTransfer = (data) => api.post('/transfer', data);
export const updateTransfer = (id, data) => api.put(`/transfer/${id}`, data);
export const deleteTransfer = (id) => api.delete(`/transfer/${id}`);
