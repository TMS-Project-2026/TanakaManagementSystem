import api from './axios';

export const getAllCashInBank = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.bank) params.append('bank', filters.bank);
    if (filters.status) params.append('status', filters.status);
    if (filters.cabang) params.append('cabang', filters.cabang);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    return api.get(`/cash-in-bank?${params.toString()}`);
};

export const getCashInBankSummary = () => {
    return api.get('/cash-in-bank/summary');
};

export const createCashInBank = (data) => {
    return api.post('/cash-in-bank', data);
};

export const updateCashInBank = (id, data) => {
    return api.put(`/cash-in-bank/${id}`, data);
};

export const deleteCashInBank = (id) => {
    return api.delete(`/cash-in-bank/${id}`);
};
