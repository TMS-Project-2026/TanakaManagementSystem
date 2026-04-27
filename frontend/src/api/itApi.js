import api from './axios';

// Dashboard IT
export const getITDashboard = () => api.get('/it/dashboard');

// User Management
export const getUsers = () => api.get('/it/users');
export const createUser = (data) => api.post('/it/users', data);
export const updateUser = (id, data) => api.put(`/it/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/it/users/${id}`);

// Role Permissions
export const getPermissions = () => api.get('/it/permission');
export const updatePermission = (role, permissions) => api.put(`/it/permission/${role}`, { permissions });

// Activity Logs
export const getActivityLogs = () => api.get('/it/logs');

// Backup Database
export const getBackupHistory = () => api.get('/it/backup');
export const generateBackup = () => api.post('/it/backup');
export const downloadBackup = (fileName) => `${api.defaults.baseURL}/it/backup/download/${fileName}`;

// Monitoring System
export const getMonitoringStats = () => api.get('/it/monitoring');

// System Settings
export const getSystemSettings = () => api.get('/it/settings');
export const updateSystemSettings = (data) => api.put('/it/settings', data);
