import api from './axios';

export const getAllHutang = () => api.get('/hutang');
export const createHutang = (data) => api.post('/hutang', data);
export const payHutang = (id, data) => api.post(`/hutang/${id}/pay`, data);
export const voidHutang = (id) => api.put(`/hutang/${id}/void`);
