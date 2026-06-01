const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pengaturanKeuanganController');

// Rekening Bank
router.get('/rekening', ctrl.getRekening);
router.post('/rekening', ctrl.createRekening);
router.put('/rekening/:id', ctrl.updateRekening);
router.delete('/rekening/:id', ctrl.deleteRekening);

// Petty Cash Settings
router.get('/petty-cash', ctrl.getPettyCash);
router.put('/petty-cash/:id', ctrl.updatePettyCash);

// Periode Akuntansi
router.get('/periode', ctrl.getPeriode);
router.put('/periode/:id/toggle', ctrl.togglePeriode);

// Notifikasi
router.get('/notifikasi', ctrl.getNotifikasi);
router.put('/notifikasi/:kode', ctrl.updateNotifikasi);
router.post('/notifikasi/save-all', ctrl.saveAllNotifikasi);

module.exports = router;
