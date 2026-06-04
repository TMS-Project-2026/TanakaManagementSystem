import axiosInstance from './axios';

export const journalApi = {
  getAllJournals: async (params = {}) => {
    const response = await axiosInstance.get('/journal', { params });
    return response.data;
  },
  getStats: async (type) => {
    const response = await axiosInstance.get('/journal/stats/summary', { params: type ? { type } : {} });
    return response.data;
  },
  getFinanceSummary: async () => {
    const response = await axiosInstance.get('/journal/stats/finance-summary');
    return response.data;
  },
  getPurchaseSummary: async () => {
    const response = await axiosInstance.get('/journal/stats/purchase-summary');
    return response.data;
  },
  getJournalById: async (id) => {
    const response = await axiosInstance.get(`/journal/${id}`);
    return response.data;
  },
  createJournal: async (data) => {
    const response = await axiosInstance.post('/journal', data);
    return response.data;
  },
  updateJournal: async (id, data) => {
    const response = await axiosInstance.put(`/journal/${id}`, data);
    return response.data;
  },
  deleteJournal: async (id) => {
    const response = await axiosInstance.delete(`/journal/${id}`);
    return response.data;
  },
  uploadFiles: async (id, formData) => {
    const response = await axiosInstance.post(`/journal/${id}/upload`, formData);
    return response.data;
  }
};
