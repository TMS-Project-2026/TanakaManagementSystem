import axiosInstance from './axios';

export const journalApi = {
  getAllJournals: async () => {
    const response = await axiosInstance.get('/api/journal');
    return response.data;
  },
  getJournalById: async (id) => {
    const response = await axiosInstance.get(`/api/journal/${id}`);
    return response.data;
  },
  createJournal: async (data) => {
    const response = await axiosInstance.post('/api/journal', data);
    return response.data;
  },
  updateJournal: async (id, data) => {
    const response = await axiosInstance.put(`/api/journal/${id}`, data);
    return response.data;
  },
  deleteJournal: async (id) => {
    const response = await axiosInstance.delete(`/api/journal/${id}`);
    return response.data;
  }
};
