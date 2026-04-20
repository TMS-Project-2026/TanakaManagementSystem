const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Semua Role (jika sudah login) bisa melihat barang
router.get('/', verifyToken, produkController.getAllProduk);

// HANYA Admin dan Gudang yang diizinkan menambah barang
router.post('/', verifyToken, checkRole(['Admin', 'Gudang']), produkController.tambahProduk);

module.exports = router;