const express = require('express');
const router = express.Router();

const produksiController = require('../controllers/produksiController');
const qcController = require('../controllers/qcController');
const jadwalController = require('../controllers/jadwalController');

// Dashboard
router.get('/dashboard', produksiController.getDashboard);

// Order Masuk & Proses
router.get('/order', produksiController.getOrders);
router.post('/order', produksiController.createOrder);
router.put('/order/:id', produksiController.updateOrder);
router.put('/status/:id', produksiController.updateStatus);

// Jadwal
router.get('/jadwal', jadwalController.getJadwal);

// Tim Produksi (Assign)
router.get('/tim', produksiController.getTim);
router.post('/assign', produksiController.assignTim);

// Quality Control
router.get('/qc', qcController.getQc);
router.put('/qc/:id', qcController.submitQc);

// Packing
router.get('/packing', produksiController.getPacking);
router.put('/packing/:id', produksiController.updatePacking);

// Deadline & History
router.get('/deadline', produksiController.getDeadline);
router.get('/history', produksiController.getHistory);

module.exports = router;
