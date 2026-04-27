import api from './axios';

// --- Invoice Premium ---
export const getInvoices = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.cabang) params.append('cabang', filters.cabang);
    return api.get(`/invoice?${params.toString()}`);
};

export const getInvoiceById = (id) => api.get(`/invoice/${id}`);
export const createInvoice = (data) => api.post('/invoice', data);
export const updateInvoice = (id, data) => api.put(`/invoice/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/invoice/${id}`);
