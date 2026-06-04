import api from './axios';

export const getQuotations = (params = {}) => api.get('/quotation', { params });
export const getQuotationById = (id) => api.get(`/quotation/${id}`);
export const getNextQuotationNumber = (cabang) => api.get(`/quotation/next-number?cabang=${cabang || 'Banua'}`);
export const createQuotation = (data) => api.post('/quotation', data);
export const updateQuotation = (id, data) => api.put(`/quotation/${id}`, data);
export const deleteQuotation = (id) => api.delete(`/quotation/${id}`);
export const submitQuotationToFinance = (id) => api.post(`/quotation/${id}/submit`);

export const uploadQuotationFiles = (id, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/quotation/${id}/upload`, formData);
};
