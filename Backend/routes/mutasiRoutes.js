const express = require('express');
const router = express.Router();
const mutasiController = require('../controllers/mutasiController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Kunci rute ini! Hanya Admin dan bagian Gudang yang boleh mengatur keluar/masuk barang.
router.post('/', verifyToken, checkRole(['Admin', 'Gudang']), mutasiController.catatMutasi);

module.exports = router;