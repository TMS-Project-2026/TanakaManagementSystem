import axiosInstance from './axios';

export const accountApi = {
  getAllAccounts: async () => {
    const response = await axiosInstance.get('/api/accounts');
    return response.data;
  },
  getAccountById: async (id) => {
    const response = await axiosInstance.get(`/api/accounts/${id}`);
    return response.data;
  },
  createAccount: async (data) => {
    const response = await axiosInstance.post('/api/accounts', data);
    return response.data;
  },
  updateAccount: async (id, data) => {
    const response = await axiosInstance.put(`/api/accounts/${id}`, data);
    return response.data;
  },
  deleteAccount: async (id) => {
    const response = await axiosInstance.delete(`/api/accounts/${id}`);
    return response.data;
  }
};
