const express = require('express');
const router = express.Router();
const barangMasukController = require('../controllers/barangMasukController');

router.get('/', barangMasukController.getAllBarangMasuk);
router.post('/', barangMasukController.createBarangMasuk);

module.exports = router;
