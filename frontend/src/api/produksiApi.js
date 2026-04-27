import api from './axios';

export const getProduksiDashboard = () => api.get('/produksi/dashboard');
export const getProduksiOrders = () => api.get('/produksi/order');
export const createProduksiOrder = (data) => api.post('/produksi/order', data);
export const updateProduksiOrder = (id, data) => api.put(`/produksi/order/${id}`, data);
export const updateProduksiStatus = (id, status, progress, updated_by) => api.put(`/produksi/status/${id}`, { status, progress, updated_by });

export const getJadwalProduksi = () => api.get('/produksi/jadwal');

export const getTimProduksi = () => api.get('/produksi/tim');
export const assignTimProduksi = (data) => api.post('/produksi/assign', data);

export const getQualityControl = () => api.get('/produksi/qc');
export const submitQualityControl = (id, data) => api.put(`/produksi/qc/${id}`, data);

export const getPackingList = () => api.get('/produksi/packing');
export const updatePackingStatus = (id, updated_by) => api.put(`/produksi/packing/${id}`, { status: 'selesai', updated_by });

export const getDeadlineProduksi = () => api.get('/produksi/deadline');
export const getRiwayatProduksi = () => api.get('/produksi/history');
