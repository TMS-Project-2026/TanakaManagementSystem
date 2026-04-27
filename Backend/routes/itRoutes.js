const express = require('express');
const router = express.Router();

const itController = require('../controllers/itController');
const userController = require('../controllers/userController');
const permissionController = require('../controllers/permissionController');
const logController = require('../controllers/logController');
const backupController = require('../controllers/backupController');
const monitoringController = require('../controllers/monitoringController');
const settingController = require('../controllers/settingController');

// Dashboard
router.get('/dashboard', itController.getDashboard);

// User Management
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Permissions
router.get('/permission', permissionController.getPermissions);
router.put('/permission/:role', permissionController.updatePermission);

// Logs
router.get('/logs', logController.getLogs);

// Backup
router.get('/backup', backupController.getBackupHistory);
router.post('/backup', backupController.generateBackup);
router.get('/backup/download/:fileName', backupController.downloadBackup);

// Monitoring
router.get('/monitoring', monitoringController.getMonitoringStats);

// Settings
router.get('/settings', settingController.getSettings);
router.put('/settings', settingController.updateSettings);

module.exports = router;
