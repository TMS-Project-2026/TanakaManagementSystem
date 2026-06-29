import api from './axios';

// --- Invoice Premium ---
export const getInvoices = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.cabang) params.append('cabang', filters.cabang);
    return api.get(`/invoice?${params.toString()}`);
};

export const getInvoiceById = (id) => api.get(`/invoice/${id}`);
export const getNextInvoiceNumber = (cabang) => api.get(`/invoice/next-number?cabang=${cabang || 'Banua'}`);
export const createInvoice = (data) => api.post('/invoice', data);
export const updateInvoice = (id, data) => api.put(`/invoice/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/invoice/${id}`);
export const requestRevision = (id, data) => api.put(`/invoice/${id}/request-revision`, data);

export const uploadInvoiceFiles = (id, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/invoice/${id}/upload`, formData);
};
