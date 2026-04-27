import api from './axios';

// Owner Endpoints
export const getOwnerDashboard = () => api.get('/owner/dashboard');
export const getMarketingOverview = () => api.get('/owner/marketing');
export const getFinanceOverview = () => api.get('/owner/finance');
export const getGudangOverview = () => api.get('/owner/gudang');
export const getProduksiOverview = () => api.get('/owner/produksi');
export const getCabangPerformance = () => api.get('/owner/cabang');
export const getUserSummary = () => api.get('/owner/users');

export const getReportCenter = (filter) => api.get(`/owner/report?filter=${filter}`);

export const getApprovals = () => api.get('/owner/approval');
export const updateApprovalStatus = (id, status) => api.put(`/owner/approval/${id}`, { status });
