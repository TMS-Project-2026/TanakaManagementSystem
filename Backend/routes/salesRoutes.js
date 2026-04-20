const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Lihat semua pesanan (Bisa diakses semua pegawai yang login)
router.get('/', verifyToken, salesController.getAllPO);

// Buat pesanan baru (Hanya Admin yang mencatat pesanan)
router.post('/', verifyToken, checkRole(['Admin']), salesController.buatPO);

// Update status pengerjaan (Bisa Admin atau Manager)
router.put('/:id_po/status', verifyToken, checkRole(['Admin', 'Manager']), salesController.updateStatusProduksi);

module.exports = router;