import api from './axios';

// --- Dashboard & Report ---
export const getFinanceDashboard = () => api.get('/finance/dashboard');
export const getFinanceReport = (startDate, endDate) => {
    let url = '/finance/report';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return api.get(url);
};

// --- Payment ---
export const getPayments = () => api.get('/payment');
export const createPayment = (data) => api.post('/payment', data);
export const updatePaymentStatus = (id, status) => api.put(`/payment/${id}`, { status });

// --- Expense ---
export const getExpenses = () => api.get('/expense');
export const createExpense = (data) => api.post('/expense', data);
export const updateExpense = (id, data) => api.put(`/expense/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expense/${id}`);

// --- Invoice ---
export const getInvoices = () => api.get('/invoice');
export const createInvoice = (data) => api.post('/invoice', data);
export const updateInvoiceStatus = (id, status) => api.put(`/invoice/${id}`, { status });
