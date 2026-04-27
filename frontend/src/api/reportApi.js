import api from './axios';

const buildQueryParams = (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.cabang) params.append('cabang', filters.cabang);
    if (filters.akun_id) params.append('akun_id', filters.akun_id);
    return params.toString();
};

export const getReportLabaRugi = (filters = {}) => api.get(`/report/laba-rugi?${buildQueryParams(filters)}`);
export const getReportExpense = (filters = {}) => api.get(`/report/expense?${buildQueryParams(filters)}`);
export const getReportIncomeExpense = (filters = {}) => api.get(`/report/income-expense?${buildQueryParams(filters)}`);
export const getReportArusKas = (filters = {}) => api.get(`/report/arus-kas?${buildQueryParams(filters)}`);
export const getReportSemuaTransaksi = (filters = {}) => api.get(`/report/semua-transaksi?${buildQueryParams(filters)}`);

export const getReportNeraca = (filters = {}) => api.get(`/report/neraca?${buildQueryParams(filters)}`);
export const getReportPerubahanModal = (filters = {}) => api.get(`/report/perubahan-modal?${buildQueryParams(filters)}`);

export const getReportHutang = (filters = {}) => api.get(`/report/hutang?${buildQueryParams(filters)}`);
export const getReportPiutang = (filters = {}) => api.get(`/report/piutang?${buildQueryParams(filters)}`);
export const getReportJurnal = (filters = {}) => api.get(`/report/jurnal?${buildQueryParams(filters)}`);
export const getReportBukuBesar = (filters = {}) => api.get(`/report/buku-besar?${buildQueryParams(filters)}`);
