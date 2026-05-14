import api from './axios';

export const getStokJalan = () => api.get('/stok-jalan');
export const createStokJalan = (data) => api.post('/stok-jalan', data);
export const updateStokJalan = (id, data) => api.put(`/stok-jalan/${id}`, data);
export const deleteStokJalan = (id) => api.delete(`/stok-jalan/${id}`);
