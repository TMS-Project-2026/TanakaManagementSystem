import api from './axios';

export const getAllCashOut = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.bank) params.append('bank', filters.bank);
    if (filters.status) params.append('status', filters.status);
    if (filters.cabang) params.append('cabang', filters.cabang);
    if (filters.kategori) params.append('kategori', filters.kategori);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return api.get(`/cash-out-bank?${params.toString()}`);
};
export const getCashOutSummary = () => api.get('/cash-out-bank/summary');
export const createCashOut = (data) => api.post('/cash-out-bank', data);
export const updateCashOut = (id, data) => api.put(`/cash-out-bank/${id}`, data);
export const voidCashOut = (id) => api.delete(`/cash-out-bank/${id}`);
