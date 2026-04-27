import api from './axios';

// --- Dashboard & Warning ---
export const getGudangDashboard = () => api.get('/gudang/dashboard');
export const getWarningStok = () => api.get('/gudang/warning');

// --- Stok ---
export const getStok = (cabang_id) => {
    let url = '/stok';
    if (cabang_id) url += `?cabang_id=${cabang_id}`;
    return api.get(url);
};
export const createStok = (data) => api.post('/stok', data);
export const updateStok = (id, data) => api.put(`/stok/${id}`, data);
export const deleteStok = (id) => api.delete(`/stok/${id}`);

// --- Sparepart ---
export const getSpareparts = () => api.get('/sparepart');
export const createSparepart = (data) => api.post('/sparepart', data);
export const updateSparepart = (id, data) => api.put(`/sparepart/${id}`, data);
export const deleteSparepart = (id) => api.delete(`/sparepart/${id}`);

// --- Barang Masuk ---
export const getBarangMasuk = () => api.get('/barang-masuk');
export const createBarangMasuk = (data) => api.post('/barang-masuk', data);

// --- Barang Keluar ---
export const getBarangKeluar = () => api.get('/barang-keluar');
export const createBarangKeluar = (data) => api.post('/barang-keluar', data);

// --- Mutasi ---
export const getMutasi = () => api.get('/mutasi');
export const createMutasi = (data) => api.post('/mutasi', data);
