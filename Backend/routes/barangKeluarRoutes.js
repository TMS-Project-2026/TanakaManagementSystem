const express = require('express');
const router = express.Router();
const barangKeluarController = require('../controllers/barangKeluarController');

router.get('/', barangKeluarController.getAllBarangKeluar);
router.post('/', barangKeluarController.createBarangKeluar);

module.exports = router;
