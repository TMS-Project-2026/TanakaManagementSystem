import axiosInstance from './axios';

export const accountApi = {
  getAllAccounts: async () => {
    const response = await axiosInstance.get('/accounts');
    return response.data;
  },
  getAccountById: async (id) => {
    const response = await axiosInstance.get(`/accounts/${id}`);
    return response.data;
  },
  createAccount: async (data) => {
    const response = await axiosInstance.post('/accounts', data);
    return response.data;
  },
  updateAccount: async (id, data) => {
    const response = await axiosInstance.put(`/accounts/${id}`, data);
    return response.data;
  },
  deleteAccount: async (id) => {
    const response = await axiosInstance.delete(`/accounts/${id}`);
    return response.data;
  }
};
