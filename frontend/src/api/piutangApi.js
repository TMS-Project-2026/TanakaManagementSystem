import api from './axios';

export const getAllPiutang = () => api.get('/piutang');
export const createPiutang = (data) => api.post('/piutang', data);
export const payPiutang = (id, data) => api.post(`/piutang/${id}/pay`, data);
export const voidPiutang = (id) => api.put(`/piutang/${id}/void`);
