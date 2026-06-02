const express = require('express');
const router = express.Router();
const barangMasukController = require('../controllers/barangMasukController');

router.get('/', barangMasukController.getAllBarangMasuk);
router.post('/', barangMasukController.createBarangMasuk);
router.put('/:transaksi_id', barangMasukController.updateBarangMasuk);
router.delete('/:transaksi_id', barangMasukController.deleteBarangMasuk);

module.exports = router;
